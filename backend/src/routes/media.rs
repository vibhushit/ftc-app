use axum::{routing::post, Json, Router};
use serde_json::{json, Value};

pub fn router() -> Router {
    Router::new().route("/upload-url", post(get_upload_url))
}

async fn get_upload_url(Json(payload): Json<Value>) -> Json<Value> {
    let file_name = payload.get("file_name").and_then(|v| v.as_str()).unwrap_or("image.webp");
    let file_size = payload.get("file_size").and_then(|v| v.as_u64()).unwrap_or(0);
    tracing::info!("☁️ POST /api/media/upload-url -> Presigned URL for WebP photo: {} ({} bytes)", file_name, file_size);
    Json(json!({
        "upload_url": format!("https://r2.ftc-app.com/upload/{}", file_name),
        "public_url": format!("https://cdn.ftc-app.com/media/{}", file_name)
    }))
}
