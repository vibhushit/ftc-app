// backend/src/routes/filters.rs
// Dedicated route for centralized search and discovery filter metadata

use axum::{extract::State, routing::get, Json, Router};
use crate::constants::{
    get_discipline_presets, get_sort_options, DEFAULT_OPERATIONAL_CITIES, DEFAULT_PRICE_RANGE,
};
use crate::models::filter::FilterConfig;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_discovery_filters))
}

pub async fn get_discovery_filters(State(state): State<AppState>) -> Json<FilterConfig> {
    tracing::info!("🎯 GET /api/filters -> Fetching canonical discovery filter configuration");

    // Dynamically query distinct active cities from database if available
    let mut cities: Vec<String> = Vec::new();
    if let Some(ref pool) = state.pool {
        if let Ok(rows) = sqlx::query_as::<_, (String,)>(
            "SELECT DISTINCT city FROM creator_profiles WHERE city IS NOT NULL AND city != '' ORDER BY city ASC",
        )
        .fetch_all(pool)
        .await
        {
            cities = rows.into_iter().map(|(c,)| c).collect();
        }
    }

    // Fall back to predefined launch cities if database returned empty
    if cities.is_empty() {
        cities = DEFAULT_OPERATIONAL_CITIES.iter().map(|&s| s.to_string()).collect();
    }

    Json(FilterConfig {
        disciplines: get_discipline_presets(),
        cities,
        price_range: DEFAULT_PRICE_RANGE,
        sort_options: get_sort_options(),
        ratings: vec![4.8, 4.5, 4.0, 3.5],
    })
}
