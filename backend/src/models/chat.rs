use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/ChatMessagePayload.ts")]
pub struct ChatMessagePayload {
    pub receiver_id: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/ChatMessage.ts")]
pub struct ChatMessage {
    pub id: String,
    pub sender_id: String,
    pub receiver_id: String,
    pub text: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CustomQuote.ts")]
pub struct CustomQuote {
    pub id: String,
    pub creator_id: String,
    pub client_id: String,
    pub scope: String,
    pub price: u32,
    pub delivery: String,
    pub note: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreateQuotePayload.ts")]
pub struct CreateQuotePayload {
    pub client_id: String,
    pub scope: String,
    pub price: u32,
    pub delivery: String,
    pub note: Option<String>,
}
