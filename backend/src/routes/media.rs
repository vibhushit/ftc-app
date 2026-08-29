use axum::{routing::post, Json, Router};
use serde_json::{json, Value};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/upload-url", post(generate_upload_url))
}

async fn generate_upload_url(Json(payload): Json<Value>) -> Json<Value> {
    let file_name = payload.get("file_name").and_then(|v| v.as_str()).unwrap_or("media.webp");
    let bucket = payload.get("bucket").and_then(|v| v.as_str()).unwrap_or("portfolios");
    tracing::info!("☁️ POST /api/media/upload-url -> Presigned URL requested for: {}/{}", bucket, file_name);

    Json(json!({
        "success": true,
        "upload_url": format!("https://storage.findtoconnect.com/{}/{}", bucket, file_name),
        "public_url": format!("https://cdn.findtoconnect.com/{}/{}", bucket, file_name)
    }))
}
