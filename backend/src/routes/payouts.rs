use axum::{routing::{get, post}, Json, Router};
use serde_json::{json, Value};
use crate::models::payout::{PayoutBalance, Transaction, WithdrawPayload};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/balance", get(get_balance))
        .route("/history", get(get_payout_history))
        .route("/withdraw", post(request_withdrawal))
}

async fn get_balance() -> Json<PayoutBalance> {
    tracing::info!("💰 GET /api/payouts/balance -> Fetching creator wallet balance");
    Json(PayoutBalance {
        available_balance: 42500,
        pending_escrow: 25000,
        total_earned: 185000,
        upi_id: "rhea@okaxis".into(),
    })
}

async fn get_payout_history() -> Json<Vec<Transaction>> {
    tracing::info!("📜 GET /api/payouts/history -> Fetching transaction ledger");
    Json(vec![
        Transaction {
            id: "tx_901".into(),
            amount: 25000,
            transaction_type: "payout".into(),
            status: "completed".into(),
            description: "Payout for Booking #FTC8472".into(),
            created_at: "Oct 20, 2026".into(),
        },
        Transaction {
            id: "tx_842".into(),
            amount: 17500,
            transaction_type: "payout".into(),
            status: "completed".into(),
            description: "Payout for Booking #FTC7291".into(),
            created_at: "Oct 12, 2026".into(),
        },
    ])
}

async fn request_withdrawal(Json(payload): Json<WithdrawPayload>) -> Json<Value> {
    tracing::info!("💸 POST /api/payouts/withdraw -> Withdrawal requested: ₹{} to UPI {}", payload.amount, payload.upi_id);
    Json(json!({
        "success": true,
        "withdrawal_id": "wth_5921",
        "status": "processing",
        "amount": payload.amount,
        "estimated_arrival": "Within 2 hours"
    }))
}
