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
#[ts(export, export_to = "../../src/types/bindings/CreatePackageItem.ts")]
pub struct CreatePackageItem {
    pub name: String,
    pub price: i32,
    #[serde(default = "default_package_duration")]
    pub duration: String,
    #[serde(default)]
    pub inclusions: Vec<String>,
    #[serde(default)]
    pub delivery_days: Option<i16>,
}

fn default_package_duration() -> String {
    "2 hours".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorOnboardPayload.ts")]
pub struct CreatorOnboardPayload {
    pub name: String,
    #[serde(default)]
    pub handle: Option<String>,
    pub bio: String,
    pub discipline: String,
    #[serde(default)]
    pub sub_skills: Vec<String>,
    #[serde(default)]
    pub years_exp: u32,
    pub city: String,
    #[serde(default)]
    pub languages: Vec<String>,
    #[serde(default = "default_travel_mode")]
    pub travel_mode: String,
    pub upi_id: String,
    pub instagram_handle: String,
    #[serde(default)]
    pub youtube_handle: Option<String>,
    #[serde(default)]
    pub website_url: Option<String>,
    #[serde(default)]
    pub portfolio_urls: Vec<String>,
    #[serde(default)]
    pub packages: Vec<CreatePackageItem>,
}

fn default_travel_mode() -> String {
    "studio".to_string()
}

