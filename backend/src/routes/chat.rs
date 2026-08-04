use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::models::chat::{ChatMessage, ChatMessagePayload, CreateQuotePayload, CustomQuote};

pub fn router() -> Router {
    Router::new()
        .route("/inbox", get(get_inbox))
        .route("/messages/:partner_id", get(get_messages))
        .route("/messages", post(send_message))
        .route("/quotes", post(create_quote))
        .route("/quotes/:id/action", post(quote_action))
        .route("/ws", get(chat_websocket_handler))
}

async fn get_inbox() -> Json<Value> {
    tracing::info!("💬 GET /api/chat/inbox -> Fetching chat threads list");
    Json(json!([
        {
            "partner_id": "c1",
            "partner_name": "Rhea Kapoor",
            "partner_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            "last_message": "Sounds great! Looking forward to Thursday.",
            "unread_count": 1
        }
    ]))
}

async fn get_messages(Path(partner_id): Path<String>) -> Json<Vec<ChatMessage>> {
    tracing::info!("💬 GET /api/chat/messages/{} -> Loading message history", partner_id);
    let mock = vec![
        ChatMessage {
            id: "m1".into(),
            sender_id: partner_id.clone(),
            receiver_id: "self".into(),
            text: "Hi! Thanks for reaching out. What kind of shoot do you have in mind?".into(),
            timestamp: "10:30 AM".into(),
        },
        ChatMessage {
            id: "m2".into(),
            sender_id: "self".into(),
            receiver_id: partner_id,
            text: "Looking for an editorial fashion portrait shoot in Hauz Khas!".into(),
            timestamp: "10:32 AM".into(),
        },
    ];
    Json(mock)
}

async fn send_message(Json(payload): Json<ChatMessagePayload>) -> Json<ChatMessage> {
    tracing::info!("✉️ POST /api/chat/messages -> Message sent to: {}", payload.receiver_id);
    let msg_id = format!("m_{}", &uuid::Uuid::new_v4().to_string()[..8]);
    Json(ChatMessage {
        id: msg_id,
        sender_id: "self".into(),
        receiver_id: payload.receiver_id,
        text: payload.text,
        timestamp: "Just now".into(),
    })
}

async fn create_quote(Json(payload): Json<CreateQuotePayload>) -> Json<CustomQuote> {
    tracing::info!("📜 POST /api/quotes -> Custom quote created for client: {}", payload.client_id);
    let quote_id = format!("q_{}", &uuid::Uuid::new_v4().to_string()[..8]);
    Json(CustomQuote {
        id: quote_id,
        creator_id: "self".into(),
        client_id: payload.client_id,
        scope: payload.scope,
        price: payload.price,
        delivery: payload.delivery,
        note: payload.note,
        status: "sent".into(),
        created_at: "2026-07-31T11:00:00Z".into(),
    })
}

async fn quote_action(Path(id): Path<String>, Json(payload): Json<Value>) -> Json<Value> {
    let action = payload.get("action").and_then(|v| v.as_str()).unwrap_or("accepted");
    tracing::info!("✍️ POST /api/quotes/{}/action -> Action performed: {}", id, action);
    Json(json!({ "success": true, "quote_id": id, "status": action }))
}

async fn chat_websocket_handler() -> Json<Value> {
    tracing::info!("⚡ GET /api/chat/ws -> Live WebSocket connection request");
    Json(json!({ "message": "WebSocket upgrade endpoint ready" }))
}
