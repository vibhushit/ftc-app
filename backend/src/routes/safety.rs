use axum::{routing::get, Json, Router};
use serde_json::{json, Value};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/guidelines", get(get_safety_guidelines))
}

async fn get_safety_guidelines() -> Json<Value> {
    tracing::info!("🛡️ GET /api/safety/guidelines -> Serving platform guidelines");
    Json(json!({
        "escrow_guarantee": "Payments are held securely in escrow until milestones are completed.",
        "identity_verification": "Creators can verify identity via Govt ID badge.",
        "support_emergency_contact": "sos@findtoconnect.com"
    }))
}
