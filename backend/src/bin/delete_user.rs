// this is a temp file and will be deleted once delte flow is in place


use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use sqlx::Row;
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");

    let args: Vec<String> = env::args().collect();
    let target = args.get(1).map(|s| s.as_str()).unwrap_or("vibhushit.work@gmail.com");

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&database_url)
        .await?;

    println!("Searching for target user: '{}'...", target);

    // Look up user_id in public.users or auth.users
    let pub_row = sqlx::query("SELECT id, name, email FROM public.users WHERE email = $1 OR id::text = $1 LIMIT 1")
        .bind(target)
        .fetch_optional(&pool)
        .await?;

    let user_id: Uuid = match pub_row {
        Some(row) => {
            let id: Uuid = row.get("id");
            let name: Option<String> = row.get("name");
            let email: Option<String> = row.get("email");
            println!("Found in public.users: ID: {}, Name: {:?}, Email: {:?}", id, name, email);
            id
        }
        None => {
            let auth_row = sqlx::query("SELECT id, email FROM auth.users WHERE email = $1 OR id::text = $1 LIMIT 1")
                .bind(target)
                .fetch_optional(&pool)
                .await?;

            match auth_row {
                Some(row) => {
                    let id: Uuid = row.get("id");
                    let email: Option<String> = row.get("email");
                    println!("Found in auth.users: ID: {}, Email: {:?}", id, email);
                    id
                }
                None => {
                    println!("No user found matching '{}'", target);
                    return Ok(());
                }
            }
        }
    };

    println!("\nBeginning clean transactional deletion for user {}...", user_id);
    let mut tx = pool.begin().await?;

    // 1. Chat messages & threads
    let _ = sqlx::query("DELETE FROM public.chat_messages WHERE sender_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await;
    let _ = sqlx::query("DELETE FROM public.chat_threads WHERE $1 = ANY(participant_ids)")
        .bind(user_id)
        .execute(&mut *tx)
        .await;
    println!("  1. Chat history purged");

    // 3. Bookings and reviews
    let _ = sqlx::query("DELETE FROM public.reviews WHERE reviewer_id = $1 OR reviewee_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await;
    let _ = sqlx::query("DELETE FROM public.bookings WHERE consumer_id = $1 OR creator_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await;
    println!("  3. Bookings & reviews purged");

    // 4. Creator profile (cascades services, schedules, calendar_settings, overrides, favorites)
    let cp_res = sqlx::query("DELETE FROM public.creator_profiles WHERE id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    println!("  4. Creator profile purged ({} row deleted, cascaded packages/calendar/schedules)", cp_res.rows_affected());

    // 5. public.users row
    let u_res = sqlx::query("DELETE FROM public.users WHERE id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    println!("  5. public.users row purged ({} row deleted)", u_res.rows_affected());

    // 6. auth.users identity
    let a_res = sqlx::query("DELETE FROM auth.users WHERE id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    println!("  6. auth.users identity purged ({} row deleted)", a_res.rows_affected());

    tx.commit().await?;

    println!("\nSUCCESS: User '{}' ({}) was completely erased from the database.", target, user_id);
    println!("You can now test the full signup, role selection, and onboarding flow from scratch!");

    Ok(())
}
