// backend/src/models/config.rs
// Platform-level configuration models and schemas.

use serde::{Deserialize, Serialize};
use ts_rs::TS;
use crate::models::filter::{DisciplineFilterOption, PriceRangeConfig, SortOption};

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/PlatformConfig.ts")]
pub struct PlatformConfig {
    pub sla_hours: i64,
    pub default_advance_pct: u32,
    pub default_platform_fee_pct: u32,
    pub default_slot_step_minutes: u32,
    pub default_buffer_minutes: u32,
    pub default_min_notice_hours: u32,
    pub cities: Vec<String>,
    pub disciplines: Vec<DisciplineFilterOption>,
    pub price_range: PriceRangeConfig,
    pub sort_options: Vec<SortOption>,
}
