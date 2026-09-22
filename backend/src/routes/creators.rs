use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use crate::models::creator::{Creator, CreatorOnboardPayload, CreatorPackage};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct CreatorQueryParams {
    pub discipline: Option<String>,
    pub city: Option<String>,
    pub min_price: Option<u32>,
    pub max_price: Option<u32>,
    pub sort: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_creators))
        .route("/filters", get(crate::routes::filters::get_discovery_filters))
        .route("/saved", get(get_saved_creators))
        .route("/saved/:id", post(toggle_save_creator))
        .route("/check-handle", get(check_handle_availability))
        .route("/handle/:handle", get(get_creator_by_handle))
        .route("/:id", get(get_creator_by_id))
        .route("/onboard", post(onboard_creator))
        .route("/:id/availability", get(get_creator_availability))
        .route("/me/availability", post(update_creator_availability))
        .route("/me/toggle-holiday-mode", post(toggle_holiday_mode))
}

#[derive(Debug, Deserialize)]
pub struct CheckHandleQuery {
    pub handle: String,
}

async fn check_handle_availability(
    State(state): State<AppState>,
    Query(query): Query<CheckHandleQuery>,
) -> Result<Json<Value>, (axum::http::StatusCode, Json<Value>)> {
    let clean = query.handle.trim().trim_start_matches('@').to_lowercase();

    if clean.len() < 3 || clean.len() > 30 {
        return Ok(Json(json!({
            "available": false,
            "handle": format!("@{}", clean),
            "reason": "Handle must be between 3 and 30 characters"
        })));
    }

    let is_valid_format = clean.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '.')
        && !clean.starts_with('.') && !clean.ends_with('.')
        && !clean.starts_with('_') && !clean.ends_with('_')
        && !clean.contains("..") && !clean.contains("__");

    if !is_valid_format {
        return Ok(Json(json!({
            "available": false,
            "handle": format!("@{}", clean),
            "reason": "Handle can only contain lowercase letters, numbers, underscores, and dots"
        })));
    }

    let formatted = format!("@{}", clean);

    if let Some(ref pool) = state.pool {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM creator_profiles WHERE handle = $1 OR handle = $2)"
        )
        .bind(&formatted)
        .bind(&clean)
        .fetch_one(pool)
        .await
        .unwrap_or(false);

        return Ok(Json(json!({
            "available": !exists,
            "handle": formatted,
            "reason": if exists { Some("Handle is already taken") } else { None }
        })));
    }

    Ok(Json(json!({
        "available": true,
        "handle": formatted,
        "reason": None::<String>
    })))
}

async fn get_creators(
    State(state): State<AppState>,
    Query(params): Query<CreatorQueryParams>,
) -> Json<Vec<Creator>> {
    tracing::info!("📸 GET /api/creators -> Query params: {:?}", params);

    // ─── If PostgreSQL pool is available, execute dynamic query ──────────────
    if let Some(ref pool) = state.pool {
        let query_str = r#"
            SELECT
                u.id::text,
                u.name,
                cp.handle,
                COALESCE(u.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
                cp.discipline,
                cp.sub_skills,
                cp.city,
                cp.area,
                cp.starting_at,
                COALESCE(cp.avg_rating::float4, 5.0),
                cp.review_count,
                cp.bio,
                u.is_verified,
                cp.portfolio_urls
            FROM creator_profiles cp
            JOIN users u ON u.id = cp.id
            WHERE ($1::text IS NULL OR LOWER(cp.discipline) = LOWER($1))
              AND ($2::text IS NULL OR LOWER(cp.city) = LOWER($2))
              AND ($3::int IS NULL OR cp.starting_at >= $3)
              AND ($4::int IS NULL OR cp.starting_at <= $4)
            ORDER BY
                CASE WHEN $5 = 'price_low' THEN cp.starting_at END ASC,
                CASE WHEN $5 = 'price_high' THEN cp.starting_at END DESC,
                cp.avg_rating DESC
            LIMIT 50
        "#;

        let discipline = params.discipline.as_deref();
        let city = params.city.as_deref();
        let min_price = params.min_price.map(|p| p as i32);
        let max_price = params.max_price.map(|p| p as i32);
        let sort = params.sort.as_deref().unwrap_or("rating");

        let result = sqlx::query_as::<_, (
            String, String, String, String, String, Vec<String>,
            String, String, i32, f32, i32, String, bool, Vec<String>
        )>(query_str)
        .bind(discipline)
        .bind(city)
        .bind(min_price)
        .bind(max_price)
        .bind(sort)
        .fetch_all(pool)
        .await;

        match result {
            Ok(rows) if !rows.is_empty() => {
                let creators: Vec<Creator> = rows.into_iter().map(|r| Creator {
                    id: r.0,
                    name: r.1,
                    handle: r.2,
                    avatar: r.3,
                    discipline: r.4,
                    sub_skills: r.5,
                    city: r.6,
                    locality: r.7,
                    starting_at: r.8.max(0) as u32,
                    rating: r.9,
                    review_count: r.10.max(0) as u32,
                    bio: r.11,
                    verified: r.12,
                    portfolio_urls: r.13,
                    packages: vec![
                        CreatorPackage {
                            name: "Starter".into(),
                            price: r.8.max(0) as u32,
                            deliverable: "Standard Deliverable Session".into(),
                            turnaround_days: 3,
                        }
                    ],
                }).collect();

                tracing::info!("✅ Returned {} creators from PostgreSQL", creators.len());
                return Json(creators);
            }
            Ok(_) => {
                tracing::info!("ℹ️ Database connected but no rows match query, using baseline seed data");
            }
            Err(e) => {
                tracing::warn!("⚠️ Database query failed (falling back to in-memory): {:?}", e);
            }
        }
    }

    Json(vec![])
}

async fn get_creator_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (axum::http::StatusCode, Json<Value>)> {
    tracing::info!("🔍 GET /api/creators/{} -> Fetching profile", id);

    if let Some(ref pool) = state.pool {
        let query_str = r#"
            SELECT
                u.id::text,
                u.name,
                cp.handle,
                COALESCE(u.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
                cp.discipline,
                cp.sub_skills,
                cp.city,
                cp.area,
                cp.starting_at,
                COALESCE(cp.avg_rating::float4, 5.0),
                cp.review_count,
                cp.bio,
                u.is_verified,
                cp.portfolio_urls
            FROM creator_profiles cp
            JOIN users u ON u.id = cp.id
            WHERE u.id::text = $1 OR cp.handle = $1
            LIMIT 1
        "#;

        if let Ok(row) = sqlx::query_as::<_, (
            String, String, String, String, String, Vec<String>,
            String, String, i32, f32, i32, String, bool, Vec<String>
        )>(query_str)
        .bind(&id)
        .fetch_one(pool)
        .await {
            return Ok(Json(json!({
                "id": row.0,
                "name": row.1,
                "handle": row.2,
                "avatar": row.3,
                "discipline": row.4,
                "sub_skills": row.5,
                "city": row.6,
                "locality": row.7,
                "starting_at": row.8,
                "rating": row.9,
                "review_count": row.10,
                "bio": row.11,
                "verified": row.12,
                "portfolio_urls": row.13,
            })));
        }
    }

    Err((
        axum::http::StatusCode::NOT_FOUND,
        Json(json!({ "error": "Creator not found", "id": id }))
    ))
}

async fn get_creator_by_handle(
    State(state): State<AppState>,
    Path(handle): Path<String>,
) -> Result<Json<Value>, (axum::http::StatusCode, Json<Value>)> {
    get_creator_by_id(State(state), Path(handle)).await
}

use crate::middleware::auth::AuthenticatedUser;

async fn onboard_creator(
    State(state): State<AppState>,
    auth_user: AuthenticatedUser,
    Json(payload): Json<CreatorOnboardPayload>,
) -> Result<Json<Value>, (axum::http::StatusCode, Json<Value>)> {
    tracing::info!("✨ POST /api/creators/onboard -> New creator onboarding: {} (user: {})", payload.name, auth_user.user_id);

    let user_id = match uuid::Uuid::parse_str(&auth_user.user_id) {
        Ok(u) => u,
        Err(_) => uuid::Uuid::new_v4(),
    };

    let candidate_handle = if let Some(ref custom_h) = payload.handle {
        let clean = custom_h.trim().trim_start_matches('@').to_lowercase();
        let is_valid = clean.len() >= 3 && clean.len() <= 30
            && clean.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '.')
            && !clean.starts_with('.') && !clean.ends_with('.')
            && !clean.starts_with('_') && !clean.ends_with('_')
            && !clean.contains("..") && !clean.contains("__");

        if !is_valid {
            return Err((
                axum::http::StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Invalid handle format. Use 3-30 lowercase characters, numbers, _, or ." }))
            ));
        }

        let formatted = format!("@{}", clean);
        if let Some(ref pool) = state.pool {
            let is_taken = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM creator_profiles WHERE (handle = $1 OR handle = $2) AND id != $3)"
            )
            .bind(&formatted)
            .bind(&clean)
            .bind(user_id)
            .fetch_one(pool)
            .await
            .unwrap_or(false);

            if is_taken {
                return Err((
                    axum::http::StatusCode::CONFLICT,
                    Json(json!({ "error": format!("Handle {} is already taken. Please choose another.", formatted) }))
                ));
            }
        }
        formatted
    } else {
        let raw_name = payload.name.trim().to_lowercase();
        let sanitized_name: String = raw_name
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '_' })
            .collect();
        let sanitized_name = sanitized_name.trim_matches('_');
        let base_handle = if sanitized_name.is_empty() {
            format!("user_{}", &user_id.to_string().replace('-', "")[..8])
        } else {
            sanitized_name.to_string()
        };

        let mut auto_handle = format!("@{}", base_handle);
        if let Some(ref pool) = state.pool {
            let mut suffix = 1;
            while let Ok(Some(_)) = sqlx::query_scalar::<_, String>(
                "SELECT handle FROM creator_profiles WHERE handle = $1 AND id != $2 LIMIT 1"
            )
            .bind(&auto_handle)
            .bind(user_id)
            .fetch_optional(pool)
            .await {
                suffix += 1;
                auto_handle = format!("@{}_{}", base_handle, suffix);
            }
        }
        auto_handle
    };

    if let Some(ref pool) = state.pool {

        let mut tx = pool.begin().await.map_err(|e| {
            tracing::error!("Failed to begin transaction: {:?}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Database error" })))
        })?;

        let current_role: Option<String> = sqlx::query_scalar(
            "SELECT role::text FROM users WHERE id = $1 LIMIT 1"
        )
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await
        .unwrap_or(None);

        let role_str = match current_role.as_deref() {
            Some("consumer") | Some("client") => "both",
            Some("both") => "both",
            _ => "creator",
        };

        if role_str == "both" {
            sqlx::query(
                r#"
                INSERT INTO users (id, name, city, role, is_verified)
                VALUES ($1, $2, $3, 'both', false)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    city = CASE WHEN users.city IS NULL OR users.city = '' THEN EXCLUDED.city ELSE users.city END,
                    role = 'both'
                "#
            )
            .bind(user_id)
            .bind(&payload.name)
            .bind(&payload.city)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!("Failed to insert user: {:?}", e);
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to create user record" })))
            })?;
        } else {
            sqlx::query(
                r#"
                INSERT INTO users (id, name, city, role, is_verified)
                VALUES ($1, $2, $3, 'creator', false)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    city = CASE WHEN users.city IS NULL OR users.city = '' THEN EXCLUDED.city ELSE users.city END,
                    role = 'creator'
                "#
            )
            .bind(user_id)
            .bind(&payload.name)
            .bind(&payload.city)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!("Failed to insert user: {:?}", e);
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to create user record" })))
            })?;
        }

        let starting_at = payload.packages
            .iter()
            .map(|p| p.price)
            .filter(|&p| p > 0)
            .min()
            .unwrap_or(5000);

        let travel_mode = match payload.travel_mode.to_lowercase().as_str() {
            "travel" => "travel",
            "both" => "both",
            _ => "studio",
        };

        let languages = if payload.languages.is_empty() {
            vec!["English".to_string(), "Hindi".to_string()]
        } else {
            payload.languages.clone()
        };

        sqlx::query(
            r#"
            INSERT INTO creator_profiles (
                id, handle, bio, discipline, sub_skills, years_exp,
                starting_at, upi_id, ig_handle, yt_handle, website_url,
                portfolio_urls, city, travel_mode, languages, is_published, onboard_step, trust_score
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13,
                CASE WHEN $14 = 'travel' THEN 'travel' WHEN $14 = 'both' THEN 'both' ELSE 'studio' END,
                $15, true, 'live', 70
            )
            ON CONFLICT (id) DO UPDATE SET
                handle = EXCLUDED.handle,
                bio = EXCLUDED.bio,
                discipline = EXCLUDED.discipline,
                sub_skills = EXCLUDED.sub_skills,
                years_exp = EXCLUDED.years_exp,
                starting_at = EXCLUDED.starting_at,
                upi_id = EXCLUDED.upi_id,
                ig_handle = EXCLUDED.ig_handle,
                yt_handle = EXCLUDED.yt_handle,
                website_url = EXCLUDED.website_url,
                portfolio_urls = EXCLUDED.portfolio_urls,
                city = EXCLUDED.city,
                travel_mode = EXCLUDED.travel_mode,
                languages = EXCLUDED.languages,
                is_published = true,
                onboard_step = 'live'
            "#
        )
        .bind(user_id)
        .bind(&candidate_handle)
        .bind(&payload.bio)
        .bind(&payload.discipline)
        .bind(&payload.sub_skills)
        .bind(payload.years_exp as i16)
        .bind(starting_at)
        .bind(&payload.upi_id)
        .bind(&payload.instagram_handle)
        .bind(&payload.youtube_handle)
        .bind(&payload.website_url)
        .bind(&payload.portfolio_urls)
        .bind(&payload.city)
        .bind(travel_mode)
        .bind(&languages)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("Failed to insert creator profile: {:?}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to create creator profile" })))
        })?;

        // Replace existing services with the newly configured packages
        sqlx::query("DELETE FROM services WHERE creator_id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .ok();

        for (idx, pkg) in payload.packages.iter().enumerate() {
            let delivery_days = pkg.delivery_days.unwrap_or(7);
            let duration = if pkg.duration.trim().is_empty() {
                "2 hours".to_string()
            } else {
                pkg.duration.clone()
            };
            sqlx::query(
                r#"
                INSERT INTO services (creator_id, name, price, duration, inclusions, delivery_days, sort_order, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                "#
            )
            .bind(user_id)
            .bind(&pkg.name)
            .bind(pkg.price)
            .bind(&duration)
            .bind(&pkg.inclusions)
            .bind(delivery_days)
            .bind(idx as i16)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!("Failed to insert service package: {:?}", e);
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to save package" })))
            })?;
        }

        // Initialize default calendar settings for the new creator
        sqlx::query(
            r#"
            INSERT INTO creator_calendar_settings (creator_id, slot_step_minutes, buffer_minutes, min_notice_hours, holiday_mode)
            VALUES ($1, 60, 30, 24, false)
            ON CONFLICT (creator_id) DO NOTHING
            "#
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .ok();

        // Initialize default weekly schedules (Mon-Sat 9am-7pm, Sun off)
        for dow in 0..=6 {
            let active = dow != 0;
            sqlx::query(
                r#"
                INSERT INTO creator_schedules (creator_id, day_of_week, is_active, start_time, end_time)
                VALUES ($1, $2, $3, '09:00:00'::time, '19:00:00'::time)
                ON CONFLICT (creator_id, day_of_week) DO NOTHING
                "#
            )
            .bind(user_id)
            .bind(dow as i16)
            .bind(active)
            .execute(&mut *tx)
            .await
            .ok();
        }

        tx.commit().await.map_err(|e| {
            tracing::error!("Failed to commit onboarding tx: {:?}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Commit failed" })))
        })?;

        tracing::info!("🎉 Creator onboarding committed to PostgreSQL: {} (handle: {})", user_id, candidate_handle);
        return Ok(Json(json!({
            "success": true,
            "creator_id": user_id.to_string(),
            "handle": candidate_handle
        })));
    }

    Err((
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "error": "Database not connected" }))
    ))
}

async fn get_saved_creators() -> Json<Vec<String>> {
    tracing::info!("🔖 GET /api/creators/saved -> Fetching bookmarked creators");
    Json(vec![])
}

async fn toggle_save_creator(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔖 POST /api/creators/saved/{} -> Toggling bookmark", id);
    Json(json!({ "success": true, "creator_id": id }))
}

async fn get_creator_availability(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("📅 GET /api/creators/{}/availability -> Availability slots", id);
    Json(json!({ "creator_id": id, "booked_days": [] }))
}

async fn update_creator_availability(Json(payload): Json<Value>) -> Json<Value> {
    tracing::info!("📅 POST /api/creators/me/availability -> Updating working slots");
    Json(json!({ "success": true, "updated_slots": payload }))
}

async fn toggle_holiday_mode(Json(payload): Json<Value>) -> Json<Value> {
    let enabled = payload.get("enabled").and_then(|v| v.as_bool()).unwrap_or(false);
    tracing::info!("🌴 POST /api/creators/me/toggle-holiday-mode -> Holiday mode: {}", enabled);
    Json(json!({ "success": true, "holiday_mode": enabled }))
}
