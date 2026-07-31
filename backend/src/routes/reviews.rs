use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::models::review::{CreateReviewPayload, Review};

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_review))
        .route("/creator/:creator_id", get(get_creator_reviews))
}

async fn create_review(Json(payload): Json<CreateReviewPayload>) -> Json<Review> {
    tracing::info!("⭐ POST /api/reviews -> New {} star review for creator: {}", payload.rating, payload.creator_id);
    let rev_id = format!("rev_{}", &uuid::Uuid::new_v4().to_string()[..8]);
    Json(Review {
        id: rev_id,
        creator_id: payload.creator_id,
        client_name: "You".into(),
        rating: payload.rating,
        comment: payload.comment,
        created_at: "Just now".into(),
    })
}

async fn get_creator_reviews(Path(creator_id): Path<String>) -> Json<Vec<Review>> {
    tracing::info!("⭐ GET /api/reviews/creator/{} -> Fetching reviews list", creator_id);
    let mock = vec![
        Review {
            id: "rev_1".into(),
            creator_id,
            client_name: "Aarav S.".into(),
            rating: 5,
            comment: "Absolutely top-tier photography! Delivered 40 selects within 3 days.".into(),
            created_at: "2 days ago".into(),
        }
    ];
    Json(mock)
}
