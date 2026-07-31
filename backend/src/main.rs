mod models;

use axum::{
    routing::{get, post},
    Json, Router,
};
use models::creator::{Creator, CreatorPackage};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/creators", get(get_creators))
        .layer(cors);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_creators() -> Json<Vec<Creator>> {
    let mock = vec![
        Creator {
            id: "c1".into(),
            name: "Rhea Kapoor".into(),
            handle: "@rhea".into(),
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80".into(),
            discipline: "Photography".into(),
            sub_skills: vec!["Fashion".into(), "Editorial".into(), "Portraits".into()],
            city: "Delhi".into(),
            locality: "Hauz Khas".into(),
            starting_at: 12000,
            rating: 4.8,
            review_count: 12,
            bio: "Fashion & portrait photographer. Shot for Vogue India, Harper's Bazaar.".into(),
            verified: true,
            portfolio_urls: vec![
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80".into(),
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80".into(),
            ],
            packages: vec![
                CreatorPackage {
                    name: "Starter".into(),
                    price: 12000,
                    deliverable: "15 edited selects".into(),
                    turnaround_days: 3,
                },
                CreatorPackage {
                    name: "Standard".into(),
                    price: 25000,
                    deliverable: "40 edited selects + raw".into(),
                    turnaround_days: 5,
                },
            ],
        },
    ];
    Json(mock)
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
        
        println!("Successfully exported all Rust models to TypeScript types!");
    }
}
