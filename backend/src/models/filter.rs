use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/DisciplineFilterOption.ts")]
pub struct DisciplineFilterOption {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub sub_skills: Vec<String>,
    pub default_step_minutes: u32,
    pub default_buffer_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/PriceRangeConfig.ts")]
pub struct PriceRangeConfig {
    pub min: u32,
    pub max: u32,
    pub step: u32,
    pub default_min: u32,
    pub default_max: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/SortOption.ts")]
pub struct SortOption {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/FilterConfig.ts")]
pub struct FilterConfig {
    pub disciplines: Vec<DisciplineFilterOption>,
    pub cities: Vec<String>,
    pub price_range: PriceRangeConfig,
    pub sort_options: Vec<SortOption>,
    pub ratings: Vec<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorFilterParams.ts")]
pub struct CreatorFilterParams {
    pub discipline: Option<String>,
    pub city: Option<String>,
    pub min_price: Option<u32>,
    pub max_price: Option<u32>,
    pub min_rating: Option<f32>,
    pub available_today: Option<bool>,
    pub target_date: Option<String>,
    pub duration_minutes: Option<u32>,
    pub sort: Option<String>,
}
