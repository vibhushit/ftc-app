use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorSchedule.ts")]
pub struct CreatorSchedule {
    pub id: String,
    pub creator_id: String,
    pub day_of_week: u8,
    pub is_active: bool,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorCalendarSettings.ts")]
pub struct CreatorCalendarSettings {
    pub creator_id: String,
    pub slot_step_minutes: u32,
    pub buffer_minutes: u32,
    pub min_notice_hours: u32,
    pub holiday_mode: bool,
    pub calendar_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/UpdateScheduleItem.ts")]
pub struct UpdateScheduleItem {
    pub day_of_week: u8,
    pub is_active: bool,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/UpdateCalendarSettingsPayload.ts")]
pub struct UpdateCalendarSettingsPayload {
    pub slot_step_minutes: Option<u32>,
    pub buffer_minutes: Option<u32>,
    pub min_notice_hours: Option<u32>,
    pub holiday_mode: Option<bool>,
    pub schedules: Option<Vec<UpdateScheduleItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CalendarOverride.ts")]
pub struct CalendarOverride {
    pub id: String,
    pub creator_id: String,
    pub start_datetime: String,
    pub end_datetime: String,
    pub reason: Option<String>,
    pub is_full_day: bool,
    #[serde(default = "default_override_type")]
    pub override_type: String, // "blocked" | "custom_hours"
    pub custom_start_time: Option<String>,
    pub custom_end_time: Option<String>,
}

fn default_override_type() -> String {
    "blocked".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreateOverridePayload.ts")]
pub struct CreateOverridePayload {
    pub start_datetime: String,
    pub end_datetime: String,
    pub reason: Option<String>,
    pub is_full_day: bool,
    #[serde(default = "default_override_type")]
    pub override_type: String, // "blocked" | "custom_hours"
    pub custom_start_time: Option<String>,
    pub custom_end_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/DayAvailability.ts")]
pub struct DayAvailability {
    pub date: String,
    pub status: String, // "available" | "booked" | "blocked"
    pub slots: Vec<String>,
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_custom_hours: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub custom_start_time: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub custom_end_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/MonthAvailabilityResponse.ts")]
pub struct MonthAvailabilityResponse {
    pub creator_id: String,
    pub month: String,
    pub duration_minutes: u32,
    pub slot_step_minutes: u32,
    pub buffer_minutes: u32,
    pub holiday_mode: bool,
    pub days: HashMap<String, DayAvailability>,
}
