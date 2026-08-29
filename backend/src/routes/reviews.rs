use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use crate::models::review::{CreateReviewPayload, Review};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/creator/:id", get(get_creator_reviews))
        .route("/", post(create_review))
}

async fn get_creator_reviews(Path(id): Path<String>) -> Json<Vec<Review>> {
    tracing::info!("⭐ GET /api/reviews/creator/{} -> Fetching verified reviews", id);
    let mock = vec![
        Review {
            id: "rev_1".into(),
            creator_id: id.clone(),
            client_name: "Aarav Sharma".into(),
            rating: 5,
            comment: "Rhea was phenomenal! High quality editorial portraits for our fashion label.".into(),
            created_at: "2 weeks ago".into(),
        },
        Review {
            id: "rev_2".into(),
            creator_id: id,
            client_name: "Tanvi Mehta".into(),
            rating: 5,
            comment: "Super professional and delivered within 48 hours. Highly recommended!".into(),
            created_at: "1 month ago".into(),
        }
    ];
    Json(mock)
}

async fn create_review(Json(payload): Json<CreateReviewPayload>) -> Json<serde_json::Value> {
    tracing::info!("📝 POST /api/reviews -> Submitting review for creator: {}", payload.creator_id);
    Json(json!({ "success": true, "review_id": "rev_new_8471" }))
}
