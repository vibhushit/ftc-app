// backend/src/routes/config.rs
// Global platform configuration endpoint.

use axum::{extract::State, routing::get, Json, Router};
use crate::constants::{
    get_discipline_presets, get_sort_options, BOOKING_REQUEST_SLA_HOURS, DEFAULT_ADVANCE_PCT,
    DEFAULT_BUFFER_MINUTES, DEFAULT_MIN_NOTICE_HOURS, DEFAULT_OPERATIONAL_CITIES,
    DEFAULT_PLATFORM_FEE_PCT, DEFAULT_PRICE_RANGE, DEFAULT_SLOT_STEP_MINUTES,
};
use crate::models::config::PlatformConfig;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_platform_config))
}

pub async fn get_platform_config(State(state): State<AppState>) -> Json<PlatformConfig> {
    tracing::info!("⚙️ GET /api/config -> Returning platform configuration");

    let mut cities: Vec<String> = DEFAULT_OPERATIONAL_CITIES.iter().map(|&s| s.to_string()).collect();

    // Dynamically augment with active cities in database if pool available
    if let Some(ref pool) = state.pool {
        if let Ok(rows) = sqlx::query_scalar::<_, String>(
            "SELECT DISTINCT city FROM creator_profiles WHERE city IS NOT NULL AND city != '' ORDER BY city"
        )
        .fetch_all(pool)
        .await {
            for c in rows {
                if !cities.iter().any(|existing| existing.eq_ignore_ascii_case(&c)) {
                    cities.push(c);
                }
            }
        }
    }

    Json(PlatformConfig {
        sla_hours: BOOKING_REQUEST_SLA_HOURS,
        default_advance_pct: DEFAULT_ADVANCE_PCT,
        default_platform_fee_pct: DEFAULT_PLATFORM_FEE_PCT,
        default_slot_step_minutes: DEFAULT_SLOT_STEP_MINUTES,
        default_buffer_minutes: DEFAULT_BUFFER_MINUTES,
        default_min_notice_hours: DEFAULT_MIN_NOTICE_HOURS,
        cities,
        disciplines: get_discipline_presets(),
        price_range: DEFAULT_PRICE_RANGE,
        sort_options: get_sort_options(),
    })
}
