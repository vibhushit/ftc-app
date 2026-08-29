use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts},
};
use base64::engine::general_purpose::{STANDARD, URL_SAFE, URL_SAFE_NO_PAD};
use base64::Engine;
use serde::{Deserialize, Serialize};
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub user_metadata: Option<serde_json::Value>,
    #[serde(default)]
    pub exp: Option<usize>,
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: String,
    pub email: Option<String>,
    pub role: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".into()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized("Invalid token format, expected Bearer token".into()));
        }

        let token = &auth_header[7..];

        // 1. Handle Sandbox / Local test tokens
        if token.starts_with("sandbox_") || token.starts_with("mock_") {
            return Ok(AuthenticatedUser {
                user_id: "u_101".into(),
                email: Some("rhea@example.com".into()),
                role: "client".into(),
            });
        }

        // 2. Decode Supabase Asymmetric JWT Token (Base64 payload inspection)
        let token_parts: Vec<&str> = token.split('.').collect();
        if token_parts.len() != 3 {
            return Err(AppError::Unauthorized("Malformed JWT token structure".into()));
        }

        let payload_b64 = token_parts[1];
        let decoded_bytes = URL_SAFE_NO_PAD
            .decode(payload_b64)
            .or_else(|_| URL_SAFE.decode(payload_b64))
            .or_else(|_| STANDARD.decode(payload_b64))
            .map_err(|_| AppError::Unauthorized("Failed to base64-decode JWT payload".into()))?;

        let claims: Claims = serde_json::from_slice(&decoded_bytes)
            .map_err(|e| AppError::Unauthorized(format!("Invalid JWT claims payload: {}", e)))?;

        // Check expiration if present
        if let Some(exp) = claims.exp {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as usize;
            if now > exp {
                return Err(AppError::Unauthorized("JWT token has expired".into()));
            }
        }

        let role = claims.role.unwrap_or_else(|| "authenticated".into());

        Ok(AuthenticatedUser {
            user_id: claims.sub,
            email: claims.email,
            role,
        })
    }
}
