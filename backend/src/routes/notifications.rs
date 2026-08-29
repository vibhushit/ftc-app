use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_notifications))
        .route("/:id/read", post(mark_notification_read))
}

async fn list_notifications() -> Json<Value> {
    tracing::info!("🔔 GET /api/notifications -> Fetching active alerts");
    Json(json!([
        {
            "id": "notif_1",
            "title": "Booking Confirmed",
            "message": "Aarav paid the ₹7,500 advance deposit for your Standard Shoot.",
            "time": "10m ago",
            "read": false
        },
        {
            "id": "notif_2",
            "title": "New Review",
            "message": "Tanvi gave you a 5-star rating ⭐",
            "time": "1d ago",
            "read": true
        }
    ]))
}

async fn mark_notification_read(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔔 POST /api/notifications/{}/read", id);
    Json(json!({ "success": true, "notification_id": id }))
}
