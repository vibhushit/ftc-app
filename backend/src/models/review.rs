use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Review.ts")]
pub struct Review {
    pub id: String,
    pub booking_id: Option<String>,
    pub creator_id: String,
    pub client_name: String,
    pub client_avatar: Option<String>,
    pub rating: u8,
    pub comment: Option<String>,
    pub package_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreateReviewPayload.ts")]
pub struct CreateReviewPayload {
    pub booking_id: String,
    pub rating: u8,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorReviewsSummary.ts")]
pub struct CreatorReviewsSummary {
    pub creator_id: String,
    pub rating: f64,
    pub review_count: i32,
    pub reviews: Vec<Review>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/BookingReviewResponse.ts")]
pub struct BookingReviewResponse {
    pub reviewed: bool,
    pub review: Option<Review>,
}
