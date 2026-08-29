use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Review.ts")]
pub struct Review {
    pub id: String,
    pub creator_id: String,
    pub client_name: String,
    pub rating: u8,
    pub comment: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreateReviewPayload.ts")]
pub struct CreateReviewPayload {
    pub creator_id: String,
    pub rating: u8,
    pub comment: String,
}
