use axum::{routing::{get, post}, Json, Router};
use serde_json::{json, Value};

pub fn router() -> Router {
    Router::new()
        .route("/", get(get_notifications))
        .route("/mark-read", post(mark_notifications_read))
}

async fn get_notifications() -> Json<Value> {
    tracing::info!("🔔 GET /api/notifications -> Fetching in-app notifications");
    Json(json!([
        {
            "id": "notif_101",
            "title": "Booking Confirmed 🎉",
            "message": "Rhea Kapoor accepted your booking request for Oct 24.",
            "read": false,
            "created_at": "10 mins ago"
        },
        {
            "id": "notif_102",
            "title": "New Custom Quote Received 📜",
            "message": "Custom quote received for Editorial Fashion Shoot (₹25,000).",
            "read": false,
            "created_at": "1 hour ago"
        }
    ]))
}

async fn mark_notifications_read() -> Json<Value> {
    tracing::info!("READ POST /api/notifications/mark-read -> Marking notifications as read");
    Json(json!({ "success": true }))
}
