use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/User.ts")]
pub struct User {
    pub id: String,
    pub phone: String,
    pub name: String,
    pub role: String,
    pub city: Option<String>,
    pub handle: Option<String>,
    pub trust_score: u32,
    pub is_creator: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/AuthResponse.ts")]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/PhoneAuthPayload.ts")]
pub struct PhoneAuthPayload {
    pub phone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/VerifyOtpPayload.ts")]
pub struct VerifyOtpPayload {
    pub phone: String,
    pub code: String,
}
