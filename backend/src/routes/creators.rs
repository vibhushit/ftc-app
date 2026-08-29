use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use crate::models::creator::{Creator, CreatorOnboardPayload, CreatorPackage};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct CreatorQueryParams {
    pub discipline: Option<String>,
    pub city: Option<String>,
    pub min_price: Option<u32>,
    pub max_price: Option<u32>,
    pub sort: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_creators))
        .route("/saved", get(get_saved_creators))
        .route("/saved/:id", post(toggle_save_creator))
        .route("/handle/:handle", get(get_creator_by_handle))
        .route("/:id", get(get_creator_by_id))
        .route("/onboard", post(onboard_creator))
        .route("/:id/availability", get(get_creator_availability))
        .route("/me/availability", post(update_creator_availability))
        .route("/me/toggle-holiday-mode", post(toggle_holiday_mode))
}

async fn get_creators(
    State(state): State<AppState>,
    Query(params): Query<CreatorQueryParams>,
) -> Json<Vec<Creator>> {
    tracing::info!("📸 GET /api/creators -> Query params: {:?}", params);

    // ─── If PostgreSQL pool is available, execute dynamic query ──────────────
    if let Some(ref pool) = state.pool {
        let query_str = r#"
            SELECT
                u.id::text,
                u.name,
                cp.handle,
                COALESCE(u.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
                cp.discipline,
                cp.sub_skills,
                cp.city,
                cp.area,
                cp.starting_at,
                COALESCE(cp.avg_rating::float4, 5.0),
                cp.review_count,
                cp.bio,
                u.is_verified,
                cp.portfolio_urls
            FROM creator_profiles cp
            JOIN users u ON u.id = cp.id
            WHERE ($1::text IS NULL OR LOWER(cp.discipline) = LOWER($1))
              AND ($2::text IS NULL OR LOWER(cp.city) = LOWER($2))
              AND ($3::int IS NULL OR cp.starting_at >= $3)
              AND ($4::int IS NULL OR cp.starting_at <= $4)
            ORDER BY
                CASE WHEN $5 = 'price_low' THEN cp.starting_at END ASC,
                CASE WHEN $5 = 'price_high' THEN cp.starting_at END DESC,
                cp.avg_rating DESC
            LIMIT 50
        "#;

        let discipline = params.discipline.as_deref();
        let city = params.city.as_deref();
        let min_price = params.min_price.map(|p| p as i32);
        let max_price = params.max_price.map(|p| p as i32);
        let sort = params.sort.as_deref().unwrap_or("rating");

        let result = sqlx::query_as::<_, (
            String, String, String, String, String, Vec<String>,
            String, String, i32, f32, i32, String, bool, Vec<String>
        )>(query_str)
        .bind(discipline)
        .bind(city)
        .bind(min_price)
        .bind(max_price)
        .bind(sort)
        .fetch_all(pool)
        .await;

        match result {
            Ok(rows) if !rows.is_empty() => {
                let creators: Vec<Creator> = rows.into_iter().map(|r| Creator {
                    id: r.0,
                    name: r.1,
                    handle: r.2,
                    avatar: r.3,
                    discipline: r.4,
                    sub_skills: r.5,
                    city: r.6,
                    locality: r.7,
                    starting_at: r.8.max(0) as u32,
                    rating: r.9,
                    review_count: r.10.max(0) as u32,
                    bio: r.11,
                    verified: r.12,
                    portfolio_urls: r.13,
                    packages: vec![
                        CreatorPackage {
                            name: "Starter".into(),
                            price: r.8.max(0) as u32,
                            deliverable: "Standard Deliverable Session".into(),
                            turnaround_days: 3,
                        }
                    ],
                }).collect();

                tracing::info!("✅ Returned {} creators from PostgreSQL", creators.len());
                return Json(creators);
            }
            Ok(_) => {
                tracing::info!("ℹ️ Database connected but no rows match query, using baseline seed data");
            }
            Err(e) => {
                tracing::warn!("⚠️ Database query failed (falling back to in-memory): {:?}", e);
            }
        }
    }

    // ─── Fallback: High-quality baseline creators ─────────────────────────────
    let mock = get_fallback_creators();
    let filtered: Vec<Creator> = mock.into_iter().filter(|c| {
        if let Some(ref d) = params.discipline {
            if !c.discipline.eq_ignore_ascii_case(d) { return false; }
        }
        if let Some(ref ct) = params.city {
            if !c.city.eq_ignore_ascii_case(ct) { return false; }
        }
        if let Some(min) = params.min_price {
            if c.starting_at < min { return false; }
        }
        if let Some(max) = params.max_price {
            if c.starting_at > max { return false; }
        }
        true
    }).collect();

    Json(filtered)
}

async fn get_creator_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<Value> {
    tracing::info!("🔍 GET /api/creators/{} -> Fetching profile", id);

    if let Some(ref pool) = state.pool {
        let query_str = r#"
            SELECT
                u.id::text,
                u.name,
                cp.handle,
                COALESCE(u.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
                cp.discipline,
                cp.sub_skills,
                cp.city,
                cp.area,
                cp.starting_at,
                COALESCE(cp.avg_rating::float4, 5.0),
                cp.review_count,
                cp.bio,
                u.is_verified,
                cp.portfolio_urls
            FROM creator_profiles cp
            JOIN users u ON u.id = cp.id
            WHERE u.id::text = $1 OR cp.handle = $1
            LIMIT 1
        "#;

        if let Ok(row) = sqlx::query_as::<_, (
            String, String, String, String, String, Vec<String>,
            String, String, i32, f32, i32, String, bool, Vec<String>
        )>(query_str)
        .bind(&id)
        .fetch_one(pool)
        .await {
            return Json(json!({
                "id": row.0,
                "name": row.1,
                "handle": row.2,
                "avatar": row.3,
                "discipline": row.4,
                "sub_skills": row.5,
                "city": row.6,
                "locality": row.7,
                "starting_at": row.8,
                "rating": row.9,
                "review_count": row.10,
                "bio": row.11,
                "verified": row.12,
                "portfolio_urls": row.13,
            }));
        }
    }

    // Fallback profile
    Json(json!({
        "id": id,
        "name": "Rhea Kapoor",
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
        "verified": true,
        "portfolio_urls": [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
        ]
    }))
}

async fn get_creator_by_handle(
    State(state): State<AppState>,
    Path(handle): Path<String>,
) -> Json<Value> {
    get_creator_by_id(State(state), Path(handle)).await
}

async fn onboard_creator(
    State(state): State<AppState>,
    Json(payload): Json<CreatorOnboardPayload>,
) -> Json<Value> {
    tracing::info!("✨ POST /api/creators/onboard -> New creator onboarding: {}", payload.name);

    if let Some(ref pool) = state.pool {
        let user_id = uuid::Uuid::new_v4();
        let handle = format!("@{}", payload.name.to_lowercase().replace(' ', "_"));

        let tx_result: Result<uuid::Uuid, sqlx::Error> = async {
            let mut tx = pool.begin().await?;

            sqlx::query(
                r#"
                INSERT INTO users (id, name, city, role, is_verified)
                VALUES ($1, $2, 'Delhi', 'creator', false)
                ON CONFLICT (id) DO UPDATE SET name = $2, role = 'creator'
                "#
            )
            .bind(user_id)
            .bind(&payload.name)
            .execute(&mut *tx)
            .await?;

            sqlx::query(
                r#"
                INSERT INTO creator_profiles (
                    id, handle, bio, discipline, sub_skills, years_exp,
                    starting_at, upi_id, ig_handle, portfolio_urls, city, is_published
                )
                VALUES ($1, $2, $3, $4, $5, $6, 8000, $7, $8, $9, 'Delhi', true)
                ON CONFLICT (id) DO UPDATE SET
                    bio = $3, discipline = $4, sub_skills = $5, portfolio_urls = $9
                "#
            )
            .bind(user_id)
            .bind(&handle)
            .bind(&payload.bio)
            .bind(&payload.discipline)
            .bind(&payload.sub_skills)
            .bind(payload.years_exp as i16)
            .bind(&payload.upi_id)
            .bind(&payload.instagram_handle)
            .bind(&payload.portfolio_urls)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;
            Ok(user_id)
        }
        .await;

        match tx_result {
            Ok(id) => {
                tracing::info!("🎉 Creator onboarding committed to PostgreSQL: {}", id);
                return Json(json!({ "success": true, "creator_id": id.to_string() }));
            }
            Err(err) => {
                tracing::error!("❌ Failed to onboard creator into DB: {:?}", err);
            }
        }
    }

    let creator_id = format!("c_{}", payload.name.to_lowercase().replace(' ', "_"));
    Json(json!({ "success": true, "creator_id": creator_id }))
}

async fn get_saved_creators() -> Json<Vec<String>> {
    tracing::info!("🔖 GET /api/creators/saved -> Fetching bookmarked creators");
    Json(vec!["c1".into(), "c3".into(), "c5".into()])
}

async fn toggle_save_creator(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🔖 POST /api/creators/saved/{} -> Toggling bookmark", id);
    Json(json!({ "success": true, "creator_id": id }))
}

async fn get_creator_availability(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("📅 GET /api/creators/{}/availability -> Availability slots", id);
    Json(json!({ "creator_id": id, "booked_days": [12, 18, 25, 27, 30] }))
}

async fn update_creator_availability(Json(payload): Json<Value>) -> Json<Value> {
    tracing::info!("📅 POST /api/creators/me/availability -> Updating working slots");
    Json(json!({ "success": true, "updated_slots": payload }))
}

async fn toggle_holiday_mode(Json(payload): Json<Value>) -> Json<Value> {
    let enabled = payload.get("enabled").and_then(|v| v.as_bool()).unwrap_or(false);
    tracing::info!("🌴 POST /api/creators/me/toggle-holiday-mode -> Holiday mode: {}", enabled);
    Json(json!({ "success": true, "holiday_mode": enabled }))
}

fn get_fallback_creators() -> Vec<Creator> {
    vec![
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
        Creator {
            id: "c2".into(),
            name: "Arjun Verma".into(),
            handle: "@arjunfilms".into(),
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80".into(),
            discipline: "Videography".into(),
            sub_skills: vec!["Commercial".into(), "Drone".into(), "Reels".into()],
            city: "Mumbai".into(),
            locality: "Bandra".into(),
            starting_at: 20000,
            rating: 4.9,
            review_count: 28,
            bio: "Commercial director and Sony ambassador. Specialises in luxury and fashion ads.".into(),
            verified: true,
            portfolio_urls: vec![
                "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80".into(),
            ],
            packages: vec![
                CreatorPackage {
                    name: "Reels Pack".into(),
                    price: 20000,
                    deliverable: "3 cinematic 4K reels (60s)".into(),
                    turnaround_days: 4,
                },
            ],
        },
    ]
}
