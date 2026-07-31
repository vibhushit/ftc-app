use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use crate::models::creator::{Creator, CreatorOnboardPayload, CreatorPackage};

pub fn router() -> Router {
    Router::new()
        .route("/", get(get_creators))
        .route("/:id", get(get_creator_by_id))
        .route("/onboard", post(onboard_creator))
        .route("/:id/availability", get(get_creator_availability))
}

async fn get_creators() -> Json<Vec<Creator>> {
    tracing::info!("📸 GET /api/creators -> Searching/listing creators");
    let mock = vec![
        Creator {
            id: "c1".into(),
            name: "Rhea Kapoor (via Rust Axum)".into(),
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

async fn get_creator_by_id(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔍 GET /api/creators/{} -> Fetching profile", id);
    Json(json!({
        "id": id,
        "name": "Rhea Kapoor (via Rust Axum)",
        "handle": "@rhea",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "discipline": "Photography",
        "sub_skills": ["Fashion", "Editorial"],
        "city": "Delhi",
        "locality": "Hauz Khas",
        "starting_at": 12000,
        "rating": 4.8,
        "review_count": 12,
        "bio": "Fashion & portrait photographer. Shot for Vogue India.",
        "verified": true
    }))
}

async fn onboard_creator(Json(payload): Json<CreatorOnboardPayload>) -> Json<Value> {
    tracing::info!("✨ POST /api/creators/onboard -> New creator onboarding: {}", payload.name);
    let creator_id = format!("c_{}", payload.name.to_lowercase().replace(' ', "_"));
    Json(json!({ "success": true, "creator_id": creator_id }))
}

async fn get_creator_availability(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("📅 GET /api/creators/{}/availability -> Availability slots", id);
    Json(json!({ "creator_id": id, "booked_days": [12, 18, 25, 27, 30] }))
}
