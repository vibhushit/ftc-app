use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorPackage.ts")]
pub struct CreatorPackage {
    pub name: String,
    pub price: u32,
    pub deliverable: String,
    pub turnaround_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Creator.ts")]
pub struct Creator {
    pub id: String,
    pub name: String,
    pub handle: String,
    pub avatar: String,
    pub discipline: String,
    pub sub_skills: Vec<String>,
    pub city: String,
    pub locality: String,
    pub starting_at: u32,
    pub rating: f32,
    pub review_count: u32,
    pub bio: String,
    pub verified: bool,
    pub portfolio_urls: Vec<String>,
    pub packages: Vec<CreatorPackage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorOnboardPayload.ts")]
pub struct CreatorOnboardPayload {
    pub name: String,
    pub bio: String,
    pub discipline: String,
    pub sub_skills: Vec<String>,
    pub years_exp: u32,
    pub upi_id: String,
    pub instagram_handle: String,
    pub portfolio_urls: Vec<String>,
}
