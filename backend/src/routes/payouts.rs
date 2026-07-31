use axum::{routing::{get, post}, Json, Router};
use serde_json::{json, Value};
use crate::models::payout::{PayoutBalance, Transaction, WithdrawPayload};

pub fn router() -> Router {
    Router::new()
        .route("/balance", get(get_balance))
        .route("/transactions", get(get_transactions))
        .route("/withdraw", post(withdraw_payout))
}

async fn get_balance() -> Json<PayoutBalance> {
    tracing::info!("💰 GET /api/payouts/balance -> Fetching creator wallet balance");
    Json(PayoutBalance {
        available_balance: 42500,
        pending_escrow: 17500,
        total_earned: 185000,
        upi_id: "rhea@upi".into(),
    })
}

async fn get_transactions() -> Json<Vec<Transaction>> {
    tracing::info!("💳 GET /api/payouts/transactions -> Fetching financial transaction history");
    let mock = vec![
        Transaction {
            id: "tx_901".into(),
            amount: 25000,
            transaction_type: "payout_release".into(),
            status: "completed".into(),
            description: "Payout release for Booking FTC9821".into(),
            created_at: "2026-07-28T14:30:00Z".into(),
        },
        Transaction {
            id: "tx_902".into(),
            amount: 12000,
            transaction_type: "withdrawal".into(),
            status: "transferred".into(),
            description: "Withdrawal to UPI rhea@upi".into(),
            created_at: "2026-07-25T10:15:00Z".into(),
        },
    ];
    Json(mock)
}

async fn withdraw_payout(Json(payload): Json<WithdrawPayload>) -> Json<Value> {
    tracing::info!("💸 POST /api/payouts/withdraw -> Withdrawal requested: ₹{} to {}", payload.amount, payload.upi_id);
    Json(json!({
        "success": true,
        "message": format!("Withdrawal request for ₹{} submitted for admin review", payload.amount),
        "upi_id": payload.upi_id
    }))
}
