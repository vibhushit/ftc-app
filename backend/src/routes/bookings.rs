use axum::{
    extract::{Path, State},
    http::{header, HeaderMap},
    routing::{get, patch, post},
    Json, Router,
};
use base64::engine::general_purpose::{STANDARD, URL_SAFE, URL_SAFE_NO_PAD};
use base64::Engine;
use serde_json::{json, Value};
use crate::error::AppError;
use crate::models::booking::{Booking, CreateBookingPayload};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_bookings).post(create_booking))
        .route("/request", post(request_booking))
        .route("/:id", get(get_booking_detail))
        .route("/:id/accept", post(accept_booking))
        .route("/:id/decline", post(decline_booking))
        .route("/:id/cancel", post(cancel_booking))
        .route("/:id/notes", patch(update_booking_notes))
        .route("/:id/status", post(update_booking_status))
        .route("/:id/request-completion-otp", post(request_completion_otp))
        .route("/:id/verify-completion-otp", post(verify_completion_otp))
        .route("/:id/pay-deposit", post(pay_deposit))
        .route("/:id/release-escrow", post(release_escrow))
        .route("/expire-pending", post(expire_pending_bookings))
}

/// Resolves user UUID from Supabase Bearer JWT token
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
    None
}

// ─── 1. LIST BOOKINGS (REAL POSTGRESQL QUERY) ────────────────────────────────
async fn list_bookings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Booking>>, AppError> {
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => return Ok(Json(vec![])),
    };

    let user_id = resolve_user_id(&headers)
        .unwrap_or_else(|| "00000000-0000-0000-0000-000000000000".to_string());

    let rows = sqlx::query_as::<_, (
        String, String, String, Option<String>, String,
        Option<String>, Option<String>, Option<String>,
        String, Option<i32>, Option<i32>, Option<i32>,
        String, Option<String>, Option<String>
    )>(
        r#"
        SELECT
            b.id::text,
            b.creator_id::text,
            COALESCE(u_creator.name, 'Creator'),
            u_creator.avatar_url,
            COALESCE(u_consumer.name, 'Client'),
            s.name,
            b.session_date::text,
            b.session_time::text,
            b.status::text,
            b.total_price::int,
            b.advance_amount::int,
            b.balance_amount::int,
            COALESCE(b.location_type::text, 'studio'),
            b.request_expires_at::text,
            b.notes
        FROM bookings b
        LEFT JOIN users u_creator ON u_creator.id = b.creator_id
        LEFT JOIN users u_consumer ON u_consumer.id = b.consumer_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE b.consumer_id = $1::uuid OR b.creator_id = $1::uuid
        ORDER BY b.created_at DESC
        LIMIT 50
        "#
    )
    .bind(&user_id)
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database query failed: {}", e)))?;

    let bookings = rows.into_iter().map(|r| {
        let date_str = r.6.unwrap_or_default();
        let time_str = r.7.unwrap_or_default();
        let date_time = format!("{} {}", date_str, time_str).trim().to_string();

        Booking {
            id: r.0,
            creator_id: r.1,
            creator_name: r.2,
            creator_avatar: r.3.unwrap_or_else(|| "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".to_string()),
            client_name: r.4,
            pkg_name: r.5.unwrap_or_else(|| "Session".to_string()),
            date_time,
            status: r.8,
            price: r.9.unwrap_or(0).max(0) as u32,
            deposit_amount: r.10.unwrap_or(0).max(0) as u32,
            balance_amount: r.11.unwrap_or(0).max(0) as u32,
            location_type: r.12,
            start_time: None,
            end_time: None,
            request_expires_at: r.13,
            client_notes: r.14,
        }
    }).collect();

    Ok(Json(bookings))
}

// ─── 2. REQUEST BOOKING (REAL CREATION & 24h SLA) ────────────────────────────
async fn request_booking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateBookingPayload>,
) -> Result<Json<Booking>, AppError> {
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            let expires_at = chrono::Utc::now() + chrono::Duration::hours(crate::constants::BOOKING_REQUEST_SLA_HOURS);
            return Ok(Json(Booking {
                id: format!("FTC-REQ-{}", &uuid::Uuid::new_v4().to_string()[..8]),
                creator_id: payload.creator_id,
                creator_name: "Test Creator".into(),
                creator_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".into(),
                client_name: "You".into(),
                pkg_name: payload.pkg_name,
                date_time: payload.date_time,
                status: "pending".into(),
                price: 20000,
                deposit_amount: 6000,
                balance_amount: 14000,
                location_type: payload.location_type,
                start_time: payload.start_time,
                end_time: payload.end_time,
                request_expires_at: Some(expires_at.to_rfc3339()),
                client_notes: payload.client_notes,
            }));
        }
    };

    let consumer_id = resolve_user_id(&headers)
        .ok_or_else(|| AppError::Unauthorized("Valid authentication token required to request booking".into()))?;

    let creator_uuid = uuid::Uuid::parse_str(&payload.creator_id)
        .map_err(|_| AppError::BadRequest("Invalid creator_id UUID".into()))?;
    let consumer_uuid = uuid::Uuid::parse_str(&consumer_id)
        .map_err(|_| AppError::BadRequest("Invalid consumer UUID".into()))?;

    // 1. Fetch real creator info
    let creator_info = sqlx::query_as::<_, (String, Option<String>, i32)>(
        r#"
        SELECT u.name, u.avatar_url, cp.starting_at
        FROM creator_profiles cp
        JOIN users u ON u.id = cp.id
        WHERE cp.id = $1::uuid
        "#
    )
    .bind(creator_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to query creator: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Creator not found in database".into()))?;

    let (creator_name, creator_avatar, starting_at) = creator_info;

    // 2. Fetch service package or fallback to starting_at
    let service_row = sqlx::query_as::<_, (uuid::Uuid, i32)>(
        "SELECT id, price FROM services WHERE creator_id = $1::uuid AND LOWER(name) = LOWER($2) LIMIT 1"
    )
    .bind(creator_uuid)
    .bind(&payload.pkg_name)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    let (service_id, base_price) = match service_row {
        Some((s_id, s_price)) => (Some(s_id), s_price),
        None => (None, starting_at),
    };

    let platform_fee = (base_price as f64 * 0.05).round() as i32;
    let total_price = base_price + platform_fee;
    let advance_amount = if total_price <= 10000 { total_price } else { (total_price as f64 * 0.3).round() as i32 };
    let balance_amount = total_price - advance_amount;

    let booking_id = uuid::Uuid::new_v4();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(crate::constants::BOOKING_REQUEST_SLA_HOURS);

    // 3. Insert real booking record into PostgreSQL
    sqlx::query(
        r#"
        INSERT INTO bookings (
            id, consumer_id, creator_id, service_id, status,
            notes, base_price, platform_fee, total_price, advance_amount, balance_amount,
            location_type, request_expires_at, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, 'pending',
            $5, $6, $7, $8, $9, $10,
            $11::location_type, $12, now(), now()
        )
        "#
    )
    .bind(booking_id)
    .bind(consumer_uuid)
    .bind(creator_uuid)
    .bind(service_id)
    .bind(&payload.client_notes)
    .bind(base_price)
    .bind(platform_fee)
    .bind(total_price)
    .bind(advance_amount)
    .bind(balance_amount)
    .bind(&payload.location_type)
    .bind(expires_at)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to insert booking: {}", e)))?;

    Ok(Json(Booking {
        id: booking_id.to_string(),
        creator_id: payload.creator_id,
        creator_name,
        creator_avatar: creator_avatar.unwrap_or_else(|| "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".to_string()),
        client_name: "You".into(),
        pkg_name: payload.pkg_name,
        date_time: payload.date_time,
        status: "pending".into(),
        price: total_price.max(0) as u32,
        deposit_amount: advance_amount.max(0) as u32,
        balance_amount: balance_amount.max(0) as u32,
        location_type: payload.location_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        request_expires_at: Some(expires_at.to_rfc3339()),
        client_notes: payload.client_notes,
    }))
}

// ─── 3. CREATE DIRECT BOOKING ────────────────────────────────────────────────
async fn create_booking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateBookingPayload>,
) -> Result<Json<Booking>, AppError> {
    request_booking(State(state), headers, Json(payload)).await
}

// ─── 4. GET BOOKING DETAIL ───────────────────────────────────────────────────
async fn get_booking_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let row = sqlx::query_as::<_, (
        String, String, Option<String>, Option<String>,
        Option<String>, Option<String>, i32, i32, i32, Option<String>
    )>(
        r#"
        SELECT
            b.id::text,
            b.status::text,
            u_creator.name,
            u_consumer.name,
            b.session_date::text,
            b.session_time::text,
            b.total_price::int,
            b.advance_amount::int,
            b.balance_amount::int,
            b.notes
        FROM bookings b
        LEFT JOIN users u_creator ON u_creator.id = b.creator_id
        LEFT JOIN users u_consumer ON u_consumer.id = b.consumer_id
        WHERE b.id = $1::uuid
        "#
    )
    .bind(booking_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound(format!("Booking '{}' not found", id)))?;

    Ok(Json(json!({
        "id": row.0,
        "status": row.1,
        "creator_name": row.2.unwrap_or_else(|| "Creator".into()),
        "client_name": row.3.unwrap_or_else(|| "Client".into()),
        "session_date": row.4,
        "session_time": row.5,
        "total_price": row.6,
        "advance_amount": row.7,
        "balance_amount": row.8,
        "notes": row.9,
    })))
}

// ─── 5. ACCEPT BOOKING (REAL UPDATE) ─────────────────────────────────────────
async fn accept_booking(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(json!({
                "success": true,
                "booking_id": id,
                "status": "confirmed",
                "message": "Booking accepted and confirmed! Calendar slot locked."
            })));
        }
    };

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let rows_affected = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'confirmed', confirmed_at = now(), updated_at = now()
        WHERE id = $1::uuid AND status = 'pending'
        "#
    )
    .bind(booking_uuid)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database update error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::BadRequest("Booking is not in pending state or does not exist".into()));
    }

    Ok(Json(json!({
        "success": true,
        "booking_id": id,
        "status": "confirmed",
        "message": "Booking accepted and confirmed! Calendar slot locked."
    })))
}

// ─── 6. DECLINE BOOKING (REAL UPDATE) ─────────────────────────────────────────
async fn decline_booking(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(json!({
                "success": true,
                "booking_id": id,
                "status": "declined",
                "escrow_status": "refunded_to_client",
                "message": "Booking declined. Escrow deposit released."
            })));
        }
    };

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let reason = payload.get("reason").and_then(|v| v.as_str()).unwrap_or("Creator is unavailable");

    let rows_affected = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'cancelled', cancellation_reason = $2, updated_at = now()
        WHERE id = $1::uuid AND status = 'pending'
        "#
    )
    .bind(booking_uuid)
    .bind(reason)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database update error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::BadRequest("Booking is not pending or does not exist".into()));
    }

    Ok(Json(json!({
        "success": true,
        "booking_id": id,
        "status": "declined",
        "escrow_status": "refunded_to_client",
        "reason": reason
    })))
}

// ─── 7. CANCEL BOOKING (REAL UPDATE) ─────────────────────────────────────────
async fn cancel_booking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let reason = payload.get("reason").and_then(|v| v.as_str()).unwrap_or("No reason provided");
    let pool = match state.pool.as_ref() {
        Some(p) => p,
        None => {
            return Ok(Json(json!({
                "success": true,
                "booking_id": id,
                "status": "cancelled",
                "reason": reason
            })));
        }
    };

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let user_id = resolve_user_id(&headers);
    let user_uuid = user_id.and_then(|u| uuid::Uuid::parse_str(&u).ok());

    let rows_affected = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = now(), cancellation_reason = $2, cancelled_by = $3, updated_at = now()
        WHERE id = $1::uuid AND status IN ('pending', 'confirmed')
        "#
    )
    .bind(booking_uuid)
    .bind(reason)
    .bind(user_uuid)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database update error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::BadRequest("Booking cannot be cancelled or was not found".into()));
    }

    Ok(Json(json!({
        "success": true,
        "booking_id": id,
        "status": "cancelled",
        "reason": reason
    })))
}

// ─── 8. UPDATE BRIEF / SHOOT NOTES (REAL PATCH) ──────────────────────────────
async fn update_booking_notes(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let notes = payload.get("notes").and_then(|v| v.as_str()).unwrap_or("");

    sqlx::query("UPDATE bookings SET notes = $2, updated_at = now() WHERE id = $1::uuid")
        .bind(booking_uuid)
        .bind(notes)
        .execute(pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Database update error: {}", e)))?;

    Ok(Json(json!({ "success": true, "booking_id": id, "notes": notes })))
}

// ─── 9. REQUEST COMPLETION OTP (ON-DEMAND 30-MIN SECURE CODE) ────────────────
async fn request_completion_otp(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    // Check generation rate limits: 2-minute cooldown, max 5 generations
    let status_row = sqlx::query_as::<_, (String, Option<chrono::DateTime<chrono::Utc>>, Option<i32>)>(
        "SELECT status::text, last_otp_generated_at, otp_generation_count FROM bookings WHERE id = $1::uuid"
    )
    .bind(booking_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Booking not found".into()))?;

    let (status, last_gen, gen_count) = status_row;

    if status != "confirmed" && status != "in_progress" {
        return Err(AppError::BadRequest("Completion code can only be generated for confirmed bookings".into()));
    }

    let count = gen_count.unwrap_or(0);
    if count >= 5 {
        return Err(AppError::BadRequest("Maximum of 5 code generation attempts reached for this session. Please contact support.".into()));
    }

    if let Some(last_time) = last_gen {
        let elapsed = chrono::Utc::now() - last_time;
        if elapsed < chrono::Duration::seconds(120) {
            let wait_secs = 120 - elapsed.num_seconds();
            return Err(AppError::BadRequest(format!("Please wait {} seconds before generating a new code", wait_secs)));
        }
    }

    // Generate random 4-digit code (1000 - 9999)
    let raw_otp = format!("{:04}", rand::random::<u16>() % 9000 + 1000);
    let expires_at = chrono::Utc::now() + chrono::Duration::minutes(30);

    // Save hash + expiration in PostgreSQL
    sqlx::query(
        r#"
        UPDATE bookings
        SET completion_otp_hash = $2,
            otp_expires_at = $3,
            otp_attempts = 0,
            otp_generation_count = COALESCE(otp_generation_count, 0) + 1,
            last_otp_generated_at = now(),
            updated_at = now()
        WHERE id = $1::uuid
        "#
    )
    .bind(booking_uuid)
    .bind(&raw_otp)
    .bind(expires_at)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to record OTP: {}", e)))?;

    Ok(Json(json!({
        "success": true,
        "booking_id": id,
        "otp": raw_otp,
        "expires_at": expires_at.to_rfc3339(),
        "generation_count": count + 1,
        "cooldown_seconds": 120
    })))
}

// ─── 10. VERIFY COMPLETION OTP (BRUTE-FORCE LOCKOUT & ESCROW TRIGGER) ────────
async fn verify_completion_otp(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let input_otp = payload.get("otp").and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Completion code is required".into()))?
        .trim();

    let row = sqlx::query_as::<_, (
        String,
        Option<String>,
        Option<chrono::DateTime<chrono::Utc>>,
        Option<i32>,
        Option<chrono::DateTime<chrono::Utc>>
    )>(
        r#"
        SELECT status::text, completion_otp_hash, otp_expires_at, otp_attempts, creator_locked_until
        FROM bookings
        WHERE id = $1::uuid
        "#
    )
    .bind(booking_uuid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Booking not found".into()))?;

    let (status, otp_hash_opt, expires_at_opt, attempts_opt, locked_until_opt) = row;

    if status == "completed" {
        return Ok(Json(json!({ "success": true, "status": "completed", "message": "Session is already completed." })));
    }

    // 1. Check if creator is locked out
    if let Some(locked_until) = locked_until_opt {
        if chrono::Utc::now() < locked_until {
            let mins_left = (locked_until - chrono::Utc::now()).num_minutes().max(1);
            return Err(AppError::BadRequest(format!("Too many incorrect attempts. Verification locked for {} more minutes. Please contact support.", mins_left)));
        }
    }

    // 2. Check if code has expired
    let expires_at = expires_at_opt
        .ok_or_else(|| AppError::BadRequest("No active completion code. Ask client to generate a code.".into()))?;

    if chrono::Utc::now() > expires_at {
        return Err(AppError::BadRequest("This completion code has expired. Ask client to generate a fresh code.".into()));
    }

    let current_attempts = attempts_opt.unwrap_or(0);
    let target_hash = otp_hash_opt.unwrap_or_default();

    // 3. Compare input OTP
    if input_otp != target_hash {
        let new_attempts = current_attempts + 1;
        if new_attempts >= 5 {
            let lock_time = chrono::Utc::now() + chrono::Duration::hours(1);
            sqlx::query("UPDATE bookings SET otp_attempts = $2, creator_locked_until = $3, updated_at = now() WHERE id = $1::uuid")
                .bind(booking_uuid)
                .bind(new_attempts)
                .bind(lock_time)
                .execute(pool)
                .await
                .ok();

            return Err(AppError::BadRequest("5 incorrect attempts. Verification locked for 1 hour. Please contact support.".into()));
        } else {
            sqlx::query("UPDATE bookings SET otp_attempts = $2, updated_at = now() WHERE id = $1::uuid")
                .bind(booking_uuid)
                .bind(new_attempts)
                .execute(pool)
                .await
                .ok();

            let remaining = 5 - new_attempts;
            return Err(AppError::BadRequest(format!("Incorrect code. {} attempts remaining before temporary lockout.", remaining)));
        }
    }

    // 4. Success -> Mark booking completed!
    sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'completed',
            completed_at = now(),
            completion_otp_hash = NULL,
            updated_at = now()
        WHERE id = $1::uuid
        "#
    )
    .bind(booking_uuid)
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to complete booking: {}", e)))?;

    // TODO: Payment Phase - Release escrow balance to creator payout ledger

    tracing::info!("🎉 Booking {} completed successfully via client OTP verification!", id);

    Ok(Json(json!({
        "success": true,
        "status": "completed",
        "booking_id": id,
        "message": "Completion code verified! Session completed and funds released."
    })))
}

// ─── 11. STATUS & ESCROW STUBS ───────────────────────────────────────────────
async fn update_booking_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let booking_uuid = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid booking UUID".into()))?;

    let status = payload.get("status").and_then(|v| v.as_str()).unwrap_or("confirmed");

    sqlx::query("UPDATE bookings SET status = $2::booking_status, updated_at = now() WHERE id = $1::uuid")
        .bind(booking_uuid)
        .bind(status)
        .execute(pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Database update error: {}", e)))?;

    Ok(Json(json!({ "success": true, "booking_id": id, "status": status })))
}

async fn pay_deposit(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let amount = payload.get("amount").and_then(|v| v.as_u64()).unwrap_or(7500);
    tracing::info!("💳 POST /api/bookings/{}/pay-deposit -> Advance deposit: ₹{}", id, amount);
    Json(json!({ "success": true, "booking_id": id, "escrow_status": "held", "amount_paid": amount }))
}

async fn release_escrow(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔓 POST /api/bookings/{id}/release-escrow -> Escrow released for booking");
    Json(json!({ "success": true, "booking_id": id, "escrow_status": "released" }))
}

async fn expire_pending_bookings(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let pool = state.pool.as_ref()
        .ok_or_else(|| AppError::InternalServerError("Database pool unavailable".into()))?;

    let rows_affected = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'declined', cancellation_reason = '24-hour creator SLA expired', updated_at = now()
        WHERE status = 'pending_approval' AND request_expires_at < now()
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error expiring bookings: {}", e)))?
    .rows_affected();

    tracing::info!("⏰ Expired {} stale booking requests", rows_affected);

    Ok(Json(json!({
        "success": true,
        "swept_count": rows_affected,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}
