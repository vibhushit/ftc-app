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
        .route("/:id", get(get_booking_detail))
        .route("/:id/status", post(update_booking_status))
        .route("/:id/pay-deposit", post(pay_deposit))
        .route("/:id/release-escrow", post(release_escrow))
        .route("/:id/cancel", post(cancel_booking))
}

async fn list_bookings() -> Json<Vec<Booking>> {
    tracing::info!("📅 GET /api/bookings -> Fetching user/creator bookings list");
    let mock = vec![
        Booking {
            id: "FTC9821".into(),
            creator_id: "c1".into(),
            creator_name: "Rhea Kapoor".into(),
            creator_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".into(),
            client_name: "Aarav Sharma".into(),
            pkg_name: "Standard Shoot".into(),
            date_time: "Oct 24, 2026 at 10:00 AM".into(),
            status: "confirmed".into(),
            price: 25000,
            deposit_amount: 7500,
            balance_amount: 17500,
            location_type: "Studio".into(),
        }
    ];
    Json(mock)
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
