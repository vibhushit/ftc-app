use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::models::chat::{ChatMessage, ChatMessagePayload, CustomQuote, CreateQuotePayload};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/conversations", get(list_conversations))
        .route("/conversations/:id/messages", get(get_conversation_messages).post(send_message))
        .route("/quotes", post(create_quote))
        .route("/quotes/:id/accept", post(accept_quote))
        .route("/quotes/:id/decline", post(decline_quote))
}

async fn list_conversations() -> Json<Value> {
    tracing::info!("💬 GET /api/chat/conversations -> Fetching conversation inbox");
    Json(json!([
        {
            "id": "conv_1",
            "participant_name": "Rhea Kapoor",
            "participant_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            "last_message": "Done! Uploaded 42 edited selects in full-res.",
            "last_message_time": "2m",
            "unread_count": 1,
            "is_online": true
        }
    ]))
}

async fn get_conversation_messages(Path(id): Path<String>) -> Json<Vec<ChatMessage>> {
    tracing::info!("💬 GET /api/chat/conversations/{}/messages", id);
    let mock = vec![
        ChatMessage {
            id: "m1".into(),
            sender_id: "c1".into(),
            receiver_id: "u_101".into(),
            text: "Hey! Thanks for reaching out. Here are the package options for your shoot.".into(),
            timestamp: "10:30 AM".into(),
        },
        ChatMessage {
            id: "m2".into(),
            sender_id: "u_101".into(),
            receiver_id: "c1".into(),
            text: "Looking for a 4-hour fashion portrait session in Hauz Khas next Saturday.".into(),
            timestamp: "10:32 AM".into(),
        }
    ];
    Json(mock)
}

async fn send_message(Path(_id): Path<String>, Json(payload): Json<ChatMessagePayload>) -> Json<ChatMessage> {
    tracing::info!("💬 POST /api/chat/messages -> Sending message to: {}", payload.receiver_id);
    Json(ChatMessage {
        id: format!("m_{}", &uuid::Uuid::new_v4().to_string()[..6]),
        sender_id: "u_101".into(),
        receiver_id: payload.receiver_id,
        text: payload.text,
        timestamp: "Just now".into(),
    })
}

async fn create_quote(Json(payload): Json<CreateQuotePayload>) -> Json<CustomQuote> {
    tracing::info!("📑 POST /api/chat/quotes -> Custom quote created: ₹{}", payload.price);
    Json(CustomQuote {
        id: format!("q_{}", &uuid::Uuid::new_v4().to_string()[..6]),
        creator_id: "c1".into(),
        client_id: payload.client_id,
        scope: payload.scope,
        price: payload.price,
        delivery: payload.delivery,
        note: payload.note,
        status: "pending".into(),
        created_at: "2026-08-29T10:00:00Z".into(),
    })
}

async fn accept_quote(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("✅ POST /api/chat/quotes/{}/accept -> Quote accepted", id);
    Json(json!({ "success": true, "quote_id": id, "status": "accepted" }))
}

async fn decline_quote(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("❌ POST /api/chat/quotes/{}/decline -> Quote declined", id);
    Json(json!({ "success": true, "quote_id": id, "status": "declined" }))
}
