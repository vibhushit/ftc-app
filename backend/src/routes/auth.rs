use axum::{routing::{get, post}, Json, Router};
use serde_json::{json, Value};
use crate::models::user::{PhoneAuthPayload, VerifyOtpPayload};

pub fn router() -> Router {
    Router::new()
        .route("/phone", post(send_phone_otp))
        .route("/verify", post(verify_otp))
        .route("/role", post(select_role))
        .route("/me", get(get_current_user))
}

async fn send_phone_otp(Json(payload): Json<PhoneAuthPayload>) -> Json<Value> {
    tracing::info!("🔑 POST /api/auth/phone -> OTP requested for: {}", payload.phone);
    Json(json!({ "success": true, "message": format!("OTP sent to {}", payload.phone) }))
}

async fn verify_otp(Json(payload): Json<VerifyOtpPayload>) -> Json<Value> {
    tracing::info!("✅ POST /api/auth/verify -> Verified OTP for: {}", payload.phone);
    Json(json!({
        "token": "mock_jwt_token_ftc_2026",
        "user": {
            "id": "u_101",
            "phone": payload.phone,
            "name": "Rhea Kapoor",
            "role": "client",
            "city": "Delhi",
            "locality": "Hauz Khas",
            "trust_score": 85,
            "is_creator": false
        }
    }))
}

async fn select_role(Json(payload): Json<Value>) -> Json<Value> {
    let role = payload.get("role").and_then(|v| v.as_str()).unwrap_or("client");
    tracing::info!("🎯 POST /api/auth/role -> User selected role: {}", role);
    Json(json!({ "success": true, "role": role }))
}

async fn get_current_user() -> Json<Value> {
    tracing::info!("👤 GET /api/auth/me -> Returning current user profile");
    Json(json!({
        "id": "u_101",
        "phone": "+91 98765 43210",
        "name": "Rhea Kapoor",
        "role": "client",
        "city": "Delhi",
        "locality": "Hauz Khas",
        "trust_score": 85,
        "is_creator": false
    }))
}
