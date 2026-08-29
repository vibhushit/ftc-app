mod error;
mod middleware;
mod models;
mod routes;
mod state;

use axum::{routing::get, Router};
use sqlx::postgres::PgPoolOptions;
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
        match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&database_url)
            .await
        {
            Ok(p) => {
                tracing::info!("✅ Successfully connected to PostgreSQL database pool!");
                Some(p)
            }
            Err(e) => {
                tracing::warn!("⚠️ Could not connect to PostgreSQL (running in fallback mode): {:?}", e);
                None
            }
        }
    } else {
        tracing::info!("ℹ️ DATABASE_URL not set — running with local fallback store");
        None
    };

    let app_state = AppState { pool };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
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
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(app_state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("🚀 FTC Rust Axum Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
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

        println!("Successfully exported all Rust models to TypeScript types!");
    }
}
