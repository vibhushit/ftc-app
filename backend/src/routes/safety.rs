use axum::{routing::post, Json, Router};
use serde_json::{json, Value};

pub fn router() -> Router {
    Router::new().route("/report", post(submit_safety_report))
}

async fn submit_safety_report(Json(payload): Json<Value>) -> Json<Value> {
    let issue_type = payload.get("type").and_then(|v| v.as_str()).unwrap_or("general");
    tracing::info!("🛡️ POST /api/safety/report -> Safety/Dispute report submitted for: {}", issue_type);
    Json(json!({
        "success": true,
        "ticket_id": format!("TK-{}", uuid::Uuid::new_v4().to_string()[..6].to_uppercase()),
        "message": "Report received. FTC Support will review within 2 hours."
    }))
}
