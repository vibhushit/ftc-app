use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::models::booking::{Booking, CreateBookingPayload};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_bookings).post(create_booking))
        .route("/request", post(request_booking))
        .route("/:id", get(get_booking_detail))
        .route("/:id/accept", post(accept_booking))
        .route("/:id/decline", post(decline_booking))
        .route("/:id/status", post(update_booking_status))
        .route("/:id/pay-deposit", post(pay_deposit))
        .route("/:id/release-escrow", post(release_escrow))
        .route("/:id/cancel", post(cancel_booking))
        .route("/expire-pending", post(expire_pending_bookings))
}

async fn list_bookings() -> Json<Vec<Booking>> {
    tracing::info!("📅 GET /api/bookings -> Fetching user/creator bookings list");
    Json(vec![])
}

async fn create_booking(Json(payload): Json<CreateBookingPayload>) -> Json<Booking> {
    tracing::info!("💼 POST /api/bookings -> New booking requested for creator: {}", payload.creator_id);
    let id_suffix = uuid::Uuid::new_v4().to_string();
    let booking_id = format!("FTC-{}", &id_suffix[..6]);
    Json(Booking {
        id: booking_id,
        creator_id: payload.creator_id,
        creator_name: "Rhea Kapoor".into(),
        creator_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".into(),
        client_name: "You".into(),
        pkg_name: payload.pkg_name,
        date_time: payload.date_time,
        status: "confirmed".into(),
        price: 25000,
        deposit_amount: 7500,
        balance_amount: 17500,
        location_type: payload.location_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        request_expires_at: None,
        client_notes: payload.client_notes,
    })
}

async fn get_booking_detail(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("📋 GET /api/bookings/{} -> Booking timeline & contract", id);
    Json(json!({
        "id": id,
        "status": "confirmed",
        "creator_name": "Rhea Kapoor",
        "escrow_status": "held",
        "contract_signed": true
    }))
}

async fn update_booking_status(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let status = payload.get("status").and_then(|v| v.as_str()).unwrap_or("updated");
    tracing::info!("🔄 POST /api/bookings/{}/status -> Status updated to: {}", id, status);
    Json(json!({ "success": true, "booking_id": id, "status": status }))
}

async fn pay_deposit(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let amount = payload.get("amount").and_then(|v| v.as_u64()).unwrap_or(7500);
    tracing::info!("💳 POST /api/bookings/{}/pay-deposit -> Advance deposit captured: ₹{}", id, amount);
    Json(json!({ "success": true, "booking_id": id, "escrow_status": "held", "amount_paid": amount }))
}

async fn release_escrow(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔓 POST /api/bookings/{}/release-escrow -> Escrow released to creator", id);
    Json(json!({ "success": true, "booking_id": id, "escrow_status": "released" }))
}

async fn cancel_booking(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let reason = payload.get("reason").and_then(|v| v.as_str()).unwrap_or("No reason provided");
    tracing::info!("❌ POST /api/bookings/{}/cancel -> Cancelled: {}", id, reason);
    Json(json!({ "success": true, "booking_id": id, "status": "cancelled", "refund_status": "processed" }))
}

async fn request_booking(Json(payload): Json<CreateBookingPayload>) -> Json<Booking> {
    tracing::info!("⏳ POST /api/bookings/request -> 24h Request created for creator: {}", payload.creator_id);
    let id_suffix = uuid::Uuid::new_v4().to_string();
    let booking_id = format!("FTC-REQ-{}", &id_suffix[..6]);
    let expires_at = (chrono::Utc::now() + chrono::Duration::hours(crate::constants::BOOKING_REQUEST_SLA_HOURS)).to_rfc3339();

    Json(Booking {
        id: booking_id,
        creator_id: payload.creator_id,
        creator_name: "Rhea Kapoor".into(),
        creator_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".into(),
        client_name: "You".into(),
        pkg_name: payload.pkg_name,
        date_time: payload.date_time,
        status: "pending_approval".into(),
        price: 25000,
        deposit_amount: 7500,
        balance_amount: 17500,
        location_type: payload.location_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        request_expires_at: Some(expires_at),
        client_notes: payload.client_notes,
    })
}

async fn accept_booking(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("✅ POST /api/bookings/{}/accept -> Creator accepted booking!", id);
    Json(json!({
        "success": true,
        "booking_id": id,
        "status": "confirmed",
        "message": "Booking confirmed! Calendar invite generated.",
        "calendar_feed_url": format!("/api/calendar/creators/me/calendar.ics")
    }))
}

async fn decline_booking(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let reason = payload.get("reason").and_then(|v| v.as_str()).unwrap_or("Creator is unavailable");
    tracing::info!("⛔ POST /api/bookings/{}/decline -> Declined: {}", id, reason);
    Json(json!({
        "success": true,
        "booking_id": id,
        "status": "declined",
        "reason": reason,
        "escrow_status": "refunded_to_client"
    }))
}

async fn expire_pending_bookings() -> Json<Value> {
    tracing::info!("⏰ POST /api/bookings/expire-pending -> Checking for 24h expired requests");
    Json(json!({
        "success": true,
        "swept_count": 0,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
