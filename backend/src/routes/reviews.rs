use axum::{
    extract::{Path, State},
    http::{header, HeaderMap},
    routing::{get, post},
    Json, Router,
};
use base64::engine::general_purpose::{STANDARD, URL_SAFE, URL_SAFE_NO_PAD};
use base64::Engine;
use serde_json::{json, Value};
use crate::error::AppError;
use crate::models::review::{BookingReviewResponse, CreateReviewPayload, CreatorReviewsSummary, Review};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create_review))
        .route("/creator/:id", get(get_creator_reviews))
        .route("/booking/:id", get(get_booking_review))
}

/// Resolves user UUID from Supabase Bearer JWT token or FTC-User header
fn resolve_user_id(headers: &HeaderMap) -> Option<String> {
    if let Some(auth_val) = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()) {
        if let Some(token) = auth_val.strip_prefix("Bearer ").map(str::trim) {
            let parts: Vec<&str> = token.split('.').collect();
            if parts.len() >= 2 {
                let payload_b64 = parts[1];
                let decoded_opt = URL_SAFE_NO_PAD
                    .decode(payload_b64)
                    .or_else(|_| URL_SAFE.decode(payload_b64))
                    .or_else(|_| STANDARD.decode(payload_b64))
                    .ok();

                if let Some(decoded_bytes) = decoded_opt {
                    if let Ok(val) = serde_json::from_slice::<Value>(&decoded_bytes) {
                        if let Some(sub_str) = val.get("sub").and_then(|s| s.as_str()) {
                            if uuid::Uuid::parse_str(sub_str).is_ok() {
                                return Some(sub_str.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    if let Some(h) = headers.get("x-user-id").and_then(|v| v.to_str().ok()) {
        if uuid::Uuid::parse_str(h).is_ok() {
            return Some(h.to_string());
        }
    }

    None
}

#[derive(sqlx::FromRow)]
struct ReviewDbRow {
    id: uuid::Uuid,
    booking_id: Option<uuid::Uuid>,
    creator_id: uuid::Uuid,
    client_name: String,
    client_avatar: Option<String>,
    rating: i16,
    comment: Option<String>,
    package_name: Option<String>,
    created_at: Option<String>,
}

// ─── 1. CREATE REVIEW (POST /api/reviews) ──────────────────────────────────
async fn create_review(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateReviewPayload>,
) -> Result<Json<Value>, AppError> {
    let user_id = resolve_user_id(&headers)
        .ok_or_else(|| AppError::Unauthorized("Authentication required to submit a review".into()))?;

    if payload.rating < 1 || payload.rating > 5 {
        return Err(AppError::BadRequest("Rating must be between 1 and 5 stars".into()));
    }

    let trimmed_comment = payload
        .comment
        .as_ref()
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty());

    if let Some(ref c) = trimmed_comment {
        if c.len() > 1000 {
            return Err(AppError::BadRequest("Review comment must not exceed 1000 characters".into()));
        }
    }

    let booking_uuid = uuid::Uuid::parse_str(&payload.booking_id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;
    let client_uuid = uuid::Uuid::parse_str(&user_id)
        .map_err(|_| AppError::BadRequest("Invalid client UUID".into()))?;

    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(json!({
                "success": true,
                "review_id": uuid::Uuid::new_v4().to_string(),
            })));
        }
    };

    // 1. Fetch booking to verify ownership and completion status
    let booking_row = sqlx::query_as::<_, (uuid::Uuid, uuid::Uuid, String)>(
        r#"
        SELECT consumer_id, creator_id, status::text
        FROM bookings
        WHERE id = $1
        "#
    )
    .bind(booking_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error checking booking: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Booking not found".into()))?;

    let (booking_consumer_id, booking_creator_id, booking_status) = booking_row;

    // 2. Validate caller is the client who booked
    if booking_consumer_id != client_uuid {
        return Err(AppError::Forbidden("Only the client who completed this session can submit a review".into()));
    }

    // 3. Validate booking is strictly completed
    if booking_status.to_lowercase() != "completed" {
        return Err(AppError::BadRequest(format!(
            "Reviews can only be submitted for completed sessions (current status: {})",
            booking_status
        )));
    }

    // 4. Check if already reviewed (idempotency / 1 review per booking guarantee)
    let already_reviewed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM reviews WHERE booking_id = $1)"
    )
    .bind(booking_uuid)
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if already_reviewed {
        return Err(AppError::Conflict("A review has already been submitted for this booking".into()));
    }

    // 5. Execute insert and atomic creator rating aggregate update in a transaction
    let mut tx = pool.begin().await
        .map_err(|e| AppError::InternalServerError(format!("Failed to begin transaction: {}", e)))?;

    let review_id: uuid::Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO reviews (booking_id, creator_id, client_id, rating, comment, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
        "#
    )
    .bind(booking_uuid)
    .bind(booking_creator_id)
    .bind(client_uuid)
    .bind(payload.rating as i16)
    .bind(trimmed_comment)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to insert review: {}", e)))?;

    // Atomic recalculation of creator profile avg_rating and review_count
    let _ = sqlx::query(
        r#"
        UPDATE creator_profiles
        SET 
            avg_rating = (SELECT ROUND(COALESCE(AVG(rating), 5.0)::numeric, 1) FROM reviews WHERE creator_id = $1),
            review_count = (SELECT COUNT(*)::int FROM reviews WHERE creator_id = $1),
            completed_jobs = (SELECT COUNT(*)::int FROM bookings WHERE creator_id = $1 AND status = 'completed'),
            updated_at = NOW()
        WHERE id = $1
        "#
    )
    .bind(booking_creator_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to update creator rating aggregate: {}", e)))?;

    tx.commit().await
        .map_err(|e| AppError::InternalServerError(format!("Failed to commit review: {}", e)))?;

    tracing::info!("⭐ Review {} successfully submitted for creator {}", review_id, booking_creator_id);

    Ok(Json(json!({
        "success": true,
        "review_id": review_id.to_string(),
    })))
}

// ─── 2. GET CREATOR REVIEWS (GET /api/reviews/creator/:id) ─────────────────
async fn get_creator_reviews(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<CreatorReviewsSummary>, AppError> {
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(CreatorReviewsSummary {
                creator_id: id,
                rating: 5.0,
                review_count: 0,
                reviews: vec![],
            }));
        }
    };

    // Resolve creator UUID if passed as handle
    let creator_uuid = match uuid::Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => {
            let clean_handle = id.trim_start_matches('@').to_lowercase();
            sqlx::query_scalar::<_, uuid::Uuid>(
                "SELECT id FROM creator_profiles WHERE LOWER(handle) = $1 OR id::text = $1 LIMIT 1"
            )
            .bind(&clean_handle)
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFound("Creator profile not found".into()))?
        }
    };

    // Query verified reviews
    let rows = sqlx::query_as::<_, ReviewDbRow>(
        r#"
        SELECT 
            r.id,
            r.booking_id,
            r.creator_id,
            COALESCE(u.name, 'Verified Client') as client_name,
            u.avatar_url as client_avatar,
            r.rating,
            r.comment,
            s.name as package_name,
            to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM reviews r
        JOIN users u ON u.id = r.client_id
        LEFT JOIN bookings b ON b.id = r.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE r.creator_id = $1
        ORDER BY r.created_at DESC
        LIMIT 50
        "#
    )
    .bind(creator_uuid)
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to fetch reviews: {}", e)))?;

    // Fetch aggregate rating and count from creator_profiles
    let profile_stats = sqlx::query_as::<_, (Option<f32>, Option<i32>)>(
        "SELECT avg_rating::float4, review_count FROM creator_profiles WHERE id = $1 LIMIT 1"
    )
    .bind(creator_uuid)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    let (rating, review_count) = match profile_stats {
        Some((r_opt, c_opt)) => {
            let r = r_opt.unwrap_or(5.0) as f64;
            let c = c_opt.unwrap_or(rows.len() as i32);
            (r, c)
        }
        None => {
            if rows.is_empty() {
                (5.0, 0)
            } else {
                let sum: i16 = rows.iter().map(|r| r.rating).sum();
                let avg = (sum as f64 / rows.len() as f64 * 10.0).round() / 10.0;
                (avg, rows.len() as i32)
            }
        }
    };

    let reviews = rows
        .into_iter()
        .map(|r| Review {
            id: r.id.to_string(),
            booking_id: r.booking_id.map(|b| b.to_string()),
            creator_id: r.creator_id.to_string(),
            client_name: r.client_name,
            client_avatar: r.client_avatar,
            rating: r.rating as u8,
            comment: r.comment,
            package_name: r.package_name,
            created_at: r.created_at.unwrap_or_default(),
        })
        .collect();

    Ok(Json(CreatorReviewsSummary {
        creator_id: creator_uuid.to_string(),
        rating,
        review_count,
        reviews,
    }))
}

// ─── 3. GET BOOKING REVIEW STATUS (GET /api/reviews/booking/:id) ────────────
async fn get_booking_review(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<BookingReviewResponse>, AppError> {
    let booking_uuid = match uuid::Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => {
            return Ok(Json(BookingReviewResponse {
                reviewed: false,
                review: None,
            }));
        }
    };

    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(BookingReviewResponse {
                reviewed: false,
                review: None,
            }));
        }
    };

    let row_opt = sqlx::query_as::<_, ReviewDbRow>(
        r#"
        SELECT 
            r.id,
            r.booking_id,
            r.creator_id,
            COALESCE(u.name, 'Verified Client') as client_name,
            u.avatar_url as client_avatar,
            r.rating,
            r.comment,
            s.name as package_name,
            to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM reviews r
        JOIN users u ON u.id = r.client_id
        LEFT JOIN bookings b ON b.id = r.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE r.booking_id = $1
        LIMIT 1
        "#
    )
    .bind(booking_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database query failed: {}", e)))?;

    match row_opt {
        Some(r) => Ok(Json(BookingReviewResponse {
            reviewed: true,
            review: Some(Review {
                id: r.id.to_string(),
                booking_id: r.booking_id.map(|b| b.to_string()),
                creator_id: r.creator_id.to_string(),
                client_name: r.client_name,
                client_avatar: r.client_avatar,
                rating: r.rating as u8,
                comment: r.comment,
                package_name: r.package_name,
                created_at: r.created_at.unwrap_or_default(),
            }),
        })),
        None => Ok(Json(BookingReviewResponse {
            reviewed: false,
            review: None,
        })),
    }
}
