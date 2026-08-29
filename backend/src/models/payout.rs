use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/PayoutBalance.ts")]
pub struct PayoutBalance {
    pub available_balance: u32,
    pub pending_escrow: u32,
    pub total_earned: u32,
    pub upi_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Transaction.ts")]
pub struct Transaction {
    pub id: String,
    pub amount: u32,
    pub transaction_type: String,
    pub status: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/WithdrawPayload.ts")]
pub struct WithdrawPayload {
    pub amount: u32,
    pub upi_id: String,
}
