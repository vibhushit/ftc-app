#![allow(dead_code)]

mod error;
mod middleware;
mod models;
mod routes;
mod state;
mod constants;

#[cfg(test)]
mod calendar_tests;

use axum::{routing::get, Router};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::str::FromStr;
use std::time::Duration;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "backend=info,tower_http=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // ─── Initialize PostgreSQL Pool ──────────────────────────────────────────
    let pool = if let Ok(database_url) = std::env::var("DATABASE_URL") {
        tracing::info!("🔌 Connecting to PostgreSQL database...");
        match PgConnectOptions::from_str(&database_url) {
            Ok(options) => {
                // Disable prepared statement caching to support PgBouncer / Supabase Transaction Pooler (port 6543)
                // Prevents error 42P05: prepared statement already exists
                let options = options.statement_cache_capacity(0);
                match PgPoolOptions::new()
                    .max_connections(5)
                    .acquire_timeout(Duration::from_secs(30))
                    .connect_with(options)
                    .await
                {
                    Ok(p) => {
                        tracing::info!("✅ Successfully connected to PostgreSQL database pool!");
                        let _ = sqlx::query("ALTER TABLE calendar_overrides ADD COLUMN IF NOT EXISTS override_type TEXT NOT NULL DEFAULT 'blocked'").execute(&p).await;
                        let _ = sqlx::query("ALTER TABLE calendar_overrides ADD COLUMN IF NOT EXISTS custom_start_time TIME").execute(&p).await;
                        let _ = sqlx::query("ALTER TABLE calendar_overrides ADD COLUMN IF NOT EXISTS custom_end_time TIME").execute(&p).await;
                        Some(p)
                    }
                    Err(e) => {
                        tracing::warn!("⚠️ Could not connect to PostgreSQL (running in fallback mode): {:?}", e);
                        None
                    }
                }
            }
            Err(e) => {
                tracing::warn!("⚠️ Invalid DATABASE_URL: {:?}", e);
                None
            }
        }
    } else {
        tracing::info!("ℹ️ DATABASE_URL not set — running with local fallback store");
        None
    };

    let app_state = AppState::new(pool);
    let app = create_app(app_state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("🚀 FTC Rust Axum Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

pub fn create_app(app_state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health_check))
        .nest("/api/creators", routes::creators::router())
        .nest("/api/auth", routes::auth::router())
        .nest("/api/bookings", routes::bookings::router())
        .nest("/api/chat", routes::chat::router())
        .nest("/api/media", routes::media::router())
        .nest("/api/payouts", routes::payouts::router())
        .nest("/api/reviews", routes::reviews::router())
        .nest("/api/notifications", routes::notifications::router())
        .nest("/api/safety", routes::safety::router())
        .nest("/api/calendar", routes::calendar::router())
        .nest("/api/filters", routes::filters::router())
        .nest("/api/config", routes::config::router())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(app_state)
}

async fn health_check() -> &'static str {
    tracing::info!("💓 GET /health -> Health check OK!");
    "OK"
}

#[cfg(test)]
mod tests {
    use super::*;
    use ts_rs::TS;

    #[test]
    fn export_typescript_types() {
        models::user::User::export_all().unwrap();
        models::user::AuthResponse::export_all().unwrap();
        models::user::PhoneAuthPayload::export_all().unwrap();
        models::user::VerifyOtpPayload::export_all().unwrap();

        models::creator::Creator::export_all().unwrap();
        models::creator::CreatorPackage::export_all().unwrap();
        models::creator::CreatorOnboardPayload::export_all().unwrap();

        models::booking::Booking::export_all().unwrap();
        models::booking::CreateBookingPayload::export_all().unwrap();

        models::chat::ChatMessage::export_all().unwrap();
        models::chat::ChatMessagePayload::export_all().unwrap();
        models::chat::CustomQuote::export_all().unwrap();
        models::chat::CreateQuotePayload::export_all().unwrap();

        models::payout::PayoutBalance::export_all().unwrap();
        models::payout::Transaction::export_all().unwrap();
        models::payout::WithdrawPayload::export_all().unwrap();

        models::review::Review::export_all().unwrap();
        models::review::CreateReviewPayload::export_all().unwrap();

        models::calendar::CreatorSchedule::export_all().unwrap();
        models::calendar::CreatorCalendarSettings::export_all().unwrap();
        models::calendar::UpdateScheduleItem::export_all().unwrap();
        models::calendar::UpdateCalendarSettingsPayload::export_all().unwrap();
        models::calendar::CalendarOverride::export_all().unwrap();
        models::calendar::CreateOverridePayload::export_all().unwrap();
        models::calendar::DayAvailability::export_all().unwrap();
        models::calendar::MonthAvailabilityResponse::export_all().unwrap();

        models::filter::DisciplineFilterOption::export_all().unwrap();
        models::filter::PriceRangeConfig::export_all().unwrap();
        models::filter::SortOption::export_all().unwrap();
        models::filter::FilterConfig::export_all().unwrap();
        models::filter::CreatorFilterParams::export_all().unwrap();

        // Enums & Platform Config
        models::enums::Discipline::export_all().unwrap();
        models::enums::CreatorTier::export_all().unwrap();
        models::enums::VerificationLevel::export_all().unwrap();
        models::enums::BookingStatus::export_all().unwrap();
        models::enums::EscrowStatus::export_all().unwrap();
        models::enums::LocationType::export_all().unwrap();
        models::enums::TravelMode::export_all().unwrap();
        models::config::PlatformConfig::export_all().unwrap();

        println!("Successfully exported all Rust models to TypeScript types!");
    }

    #[test]
    fn test_calendar_model_serialization() {
        let schedule = models::calendar::CreatorSchedule {
            id: "sched-1".into(),
            creator_id: "c1".into(),
            day_of_week: 1, // Monday
            is_active: true,
            start_time: "09:00:00".into(),
            end_time: "19:00:00".into(),
        };
        let json_str = serde_json::to_string(&schedule).unwrap();
        assert!(json_str.contains("\"day_of_week\":1"));
        assert!(json_str.contains("\"is_active\":true"));

        let settings = models::calendar::CreatorCalendarSettings {
            creator_id: "c1".into(),
            slot_step_minutes: 60,
            buffer_minutes: 30,
            min_notice_hours: 24,
            holiday_mode: false,
            calendar_token: "token-123".into(),
        };
        let json_str = serde_json::to_string(&settings).unwrap();
        assert!(json_str.contains("\"slot_step_minutes\":60"));
        assert!(json_str.contains("\"buffer_minutes\":30"));
    }

    #[test]
    fn test_filter_model_serialization() {
        let filter_config = models::filter::FilterConfig {
            disciplines: vec![
                models::filter::DisciplineFilterOption {
                    id: "photography".into(),
                    name: "Photography".into(),
                    icon: "camera".into(),
                    sub_skills: vec!["Portraits".into(), "Fashion".into()],
                    default_step_minutes: 60,
                    default_buffer_minutes: 30,
                }
            ],
            cities: vec!["Delhi".into(), "Mumbai".into(), "Bengaluru".into()],
            price_range: models::filter::PriceRangeConfig {
                min: 1000,
                max: 200000,
                step: 1000,
                default_min: 1000,
                default_max: 100000,
            },
            sort_options: vec![
                models::filter::SortOption { id: "rating".into(), label: "Top Rated".into() },
                models::filter::SortOption { id: "price_low".into(), label: "Price: Low to High".into() },
            ],
            ratings: vec![4.5, 4.0, 3.5],
        };

        let json_str = serde_json::to_string(&filter_config).unwrap();
        let parsed: models::filter::FilterConfig = serde_json::from_str(&json_str).unwrap();
        assert_eq!(parsed.cities.len(), 3);
        assert_eq!(parsed.disciplines[0].default_step_minutes, 60);
    }

    #[test]
    fn test_continuous_window_sliding_with_buffer() {
        use std::collections::HashMap;
        let mut active_days: HashMap<u8, (u32, u32)> = HashMap::new();
        // Active Monday to Saturday: 09:00 (540m) to 19:00 (1140m)
        for d in 1..=6 {
            active_days.insert(d, (9 * 60, 19 * 60));
        }

        let blocked_dates: HashMap<String, bool> = HashMap::new();
        let custom_day_hours: HashMap<String, (u32, u32)> = HashMap::new();
        let mut booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();
        // Booking on 2026-05-15 (Friday): 12:00 to 15:00 (720m to 900m)
        booked_intervals.insert("2026-05-15".into(), vec![(12 * 60, 15 * 60)]);

        // Test with 2-hour duration (120m), 60m slot step, and 30m buffer
        let slots = routes::calendar::compute_month_slots(
            2026,
            5,
            120, // 2 hour duration
            60,  // 60 min step
            30,  // 30 min buffer
            false,
            &active_days,
            &blocked_dates,
            &booked_intervals,
            &custom_day_hours,
        );

        let day = slots.get("2026-05-15").expect("Day 2026-05-15 must exist");
        assert_eq!(day.status, "available");
        // Effective busy: (12:00 - 30m) = 11:30 (690m) to (15:00 + 30m) = 15:30 (930m)
        // Morning window: 09:00 (540m) to 11:30 (690m) -> 150m free. 09:00 fits (ends at 11:00 <= 11:30).
        assert!(day.slots.contains(&"09:00".to_string()));
        // 10:00 does not fit because 10:00 + 120m = 12:00 > 11:30.
        assert!(!day.slots.contains(&"10:00".to_string()));
        // Afternoon window: 15:30 (930m) to 19:00 (1140m).
        // Step alignment to 60m: first valid slot is 16:00 (960m), then 17:00 (1020m).
        assert!(day.slots.contains(&"16:00".to_string()));
        assert!(day.slots.contains(&"17:00".to_string()));
        // 18:00 does not fit (18:00 + 120m = 20:00 > 19:00).
        assert!(!day.slots.contains(&"18:00".to_string()));
    }

    #[test]
    fn test_holiday_mode_blocks_entire_month() {
        use std::collections::HashMap;
        let mut active_days: HashMap<u8, (u32, u32)> = HashMap::new();
        active_days.insert(1, (9 * 60, 19 * 60));

        let blocked_dates: HashMap<String, bool> = HashMap::new();
        let custom_day_hours: HashMap<String, (u32, u32)> = HashMap::new();
        let booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();

        let slots = routes::calendar::compute_month_slots(
            2026,
            5,
            120,
            60,
            30,
            true, // holiday_mode = true
            &active_days,
            &blocked_dates,
            &booked_intervals,
            &custom_day_hours,
        );

        assert_eq!(slots.len(), 31);
        for (_, day_avail) in slots {
            assert_eq!(day_avail.status, "blocked");
            assert!(day_avail.slots.is_empty());
            assert_eq!(day_avail.reason, Some("Creator is on Holiday Mode".into()));
        }
    }

    #[test]
    fn test_off_days_are_marked_blocked() {
        use std::collections::HashMap;
        let mut active_days: HashMap<u8, (u32, u32)> = HashMap::new();
        // Only Monday is active
        active_days.insert(1, (9 * 60, 19 * 60));

        let blocked_dates: HashMap<String, bool> = HashMap::new();
        let custom_day_hours: HashMap<String, (u32, u32)> = HashMap::new();
        let booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();

        let slots = routes::calendar::compute_month_slots(
            2026,
            5,
            120,
            60,
            30,
            false,
            &active_days,
            &blocked_dates,
            &booked_intervals,
            &custom_day_hours,
        );

        // May 3, 2026 is Sunday (dow = 0, inactive)
        let sunday = slots.get("2026-05-03").unwrap();
        assert_eq!(sunday.status, "blocked");
        assert_eq!(sunday.reason, Some("Day off".into()));

        // May 4, 2026 is Monday (dow = 1, active)
        let monday = slots.get("2026-05-04").unwrap();
        assert_eq!(monday.status, "available");
        assert!(!monday.slots.is_empty());
    }

    #[tokio::test]
    async fn test_filter_config_defaults() {
        let app_state = state::AppState::new(None);
        let config = routes::filters::get_discovery_filters(axum::extract::State(app_state)).await.0;
        assert_eq!(config.disciplines.len(), 5);
        assert_eq!(config.disciplines[0].name, "Photography");
        assert_eq!(config.disciplines[0].default_step_minutes, 60);
        assert_eq!(config.disciplines[1].name, "Videography");
        assert_eq!(config.disciplines[1].default_step_minutes, 120);
        assert_eq!(config.price_range.min, 1000);
        assert_eq!(config.price_range.max, 200000);
        assert!(config.cities.contains(&"Delhi NCR".to_string()));
    }
}
