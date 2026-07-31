use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Booking.ts")]
pub struct Booking {
    pub id: String,
    pub creator_id: String,
    pub creator_name: String,
    pub creator_avatar: String,
    pub client_name: String,
    pub pkg_name: String,
    pub date_time: String,
    pub status: String,
    pub price: u32,
    pub deposit_amount: u32,
    pub balance_amount: u32,
    pub location_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreateBookingPayload.ts")]
pub struct CreateBookingPayload {
    pub creator_id: String,
    pub pkg_name: String,
    pub date_time: String,
    pub location_type: String,
}
