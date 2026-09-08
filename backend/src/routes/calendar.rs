use axum::{
    extract::{Path, Query, State},
    http::header,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use chrono::{Datelike, NaiveDate, Timelike};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::models::calendar::{
    CreateOverridePayload, DayAvailability, MonthAvailabilityResponse,
    UpdateCalendarSettingsPayload,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct AvailabilityQuery {
    pub month: Option<String>, // "YYYY-MM"
    pub duration_minutes: Option<u32>,
    #[allow(dead_code)]
    pub timezone: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/:id/availability", get(get_availability))
        .route("/:id/calendar.ics", get(get_ical_feed))
        .route("/me/calendar-settings", get(get_my_calendar_settings).post(update_my_calendar_settings))
        .route("/me/overrides", post(create_override))
        .route("/me/overrides/:id", delete(delete_override))
}

// ─── 1. Dynamic Availability Engine ──────────────────────────────────────────

pub async fn get_availability(
    State(state): State<AppState>,
    Path(creator_id): Path<String>,
    Query(query): Query<AvailabilityQuery>,
) -> Json<MonthAvailabilityResponse> {
    let month_str = query.month.unwrap_or_else(|| "2026-05".into());
    let duration = query.duration_minutes.unwrap_or(120); // Default 2 hours

    tracing::info!(
        "📅 GET /api/calendar/{}/availability -> Month: {}, Duration: {}m",
        creator_id,
        month_str,
        duration
    );

    // Parse month YYYY-MM
    let parts: Vec<&str> = month_str.split('-').collect();
    let (year, month_num) = if parts.len() == 2 {
        (
            parts[0].parse::<i32>().unwrap_or(2026),
            parts[1].parse::<u32>().unwrap_or(5),
        )
    } else {
        (2026, 5)
    };

    // Defaults for settings and schedules
    let mut slot_step = 60u32;
    let mut buffer = 30u32;
    let mut holiday_mode = false;
    let mut active_days: HashMap<u8, (u32, u32)> = HashMap::new(); // day_of_week -> (start_mins, end_mins)

    // Default weekly schedule: Mon(1) - Sat(6) 09:00 - 19:00 (540..1140 mins)
    for day in 1..=6 {
        active_days.insert(day, (9 * 60, 19 * 60));
    }

    let mut blocked_dates: HashMap<String, bool> = HashMap::new();
    let mut booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();

    // ─── Query Postgres pool if available ──────────
    if let Some(ref pool) = state.pool {
        // Fetch creator settings
        if let Ok(settings_row) = sqlx::query_as::<_, (i32, i32, bool)>(
            "SELECT slot_step_minutes, buffer_minutes, holiday_mode FROM creator_calendar_settings WHERE creator_id = $1::uuid",
        )
        .bind(&creator_id)
        .fetch_optional(pool)
        .await
        {
            if let Some((step, buf, holiday)) = settings_row {
                slot_step = step as u32;
                buffer = buf as u32;
                holiday_mode = holiday;
            }
        }

        // Fetch custom schedules
        if let Ok(schedules) = sqlx::query_as::<_, (i16, bool, chrono::NaiveTime, chrono::NaiveTime)>(
            "SELECT day_of_week, is_active, start_time, end_time FROM creator_schedules WHERE creator_id = $1::uuid",
        )
        .bind(&creator_id)
        .fetch_all(pool)
        .await
        {
            if !schedules.is_empty() {
                active_days.clear();
                for (dow, is_active, start_t, end_t) in schedules {
                    if is_active {
                        let start_m = start_t.hour() * 60 + start_t.minute();
                        let end_m = end_t.hour() * 60 + end_t.minute();
                        active_days.insert(dow as u8, (start_m, end_m));
                    }
                }
            }
        }

        // Fetch overrides for this month
        let start_date_str = format!("{:04}-{:02}-01", year, month_num);
        let end_date_str = format!("{:04}-{:02}-28", year, month_num);
        if let Ok(overrides) = sqlx::query_as::<_, (chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, bool)>(
            "SELECT start_datetime, end_datetime, is_full_day FROM calendar_overrides WHERE creator_id = $1::uuid AND start_datetime >= $2::timestamptz AND start_datetime <= $3::timestamptz",
        )
        .bind(&creator_id)
        .bind(&start_date_str)
        .bind(&end_date_str)
        .fetch_all(pool)
        .await
        {
            for (start_dt, _, full_day) in overrides {
                let date_k = start_dt.format("%Y-%m-%d").to_string();
                if full_day {
                    blocked_dates.insert(date_k, true);
                }
            }
        }

        // Fetch confirmed/pending bookings
        if let Ok(bookings) = sqlx::query_as::<_, (chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>(
            "SELECT start_time, end_time FROM bookings WHERE creator_id = $1::uuid AND status IN ('confirmed', 'pending_approval') AND start_time IS NOT NULL",
        )
        .bind(&creator_id)
        .fetch_all(pool)
        .await
        {
            for (start_dt, end_dt) in bookings {
                let date_k = start_dt.format("%Y-%m-%d").to_string();
                let b_start = start_dt.hour() * 60 + start_dt.minute();
                let b_end = end_dt.hour() * 60 + end_dt.minute();
                booked_intervals.entry(date_k).or_default().push((b_start, b_end));
            }
        }
    } else {
        // Fallback seed simulation when Postgres is offline
        booked_intervals.entry(format!("{:04}-{:02}-12", year, month_num)).or_default().push((10 * 60, 14 * 60));
        booked_intervals.entry(format!("{:04}-{:02}-18", year, month_num)).or_default().push((13 * 60, 17 * 60));
        blocked_dates.insert(format!("{:04}-{:02}-25", year, month_num), true);
    }

    let days = compute_month_slots(
        year,
        month_num,
        duration,
        slot_step,
        buffer,
        holiday_mode,
        &active_days,
        &blocked_dates,
        &booked_intervals,
    );

    Json(MonthAvailabilityResponse {
        creator_id,
        month: month_str,
        duration_minutes: duration,
        slot_step_minutes: slot_step,
        buffer_minutes: buffer,
        holiday_mode,
        days,
    })
}

/// Pure computation function for calculating available start times on continuous time windows.
pub fn compute_month_slots(
    year: i32,
    month: u32,
    duration_minutes: u32,
    slot_step_minutes: u32,
    buffer_minutes: u32,
    holiday_mode: bool,
    active_days: &HashMap<u8, (u32, u32)>,
    blocked_dates: &HashMap<String, bool>,
    booked_intervals: &HashMap<String, Vec<(u32, u32)>>,
) -> HashMap<String, DayAvailability> {
    let mut result = HashMap::new();

    // Determine number of days in the month
    let days_in_month = if month == 2 {
        if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 29 } else { 28 }
    } else if [4, 6, 9, 11].contains(&month) {
        30
    } else {
        31
    };

    for day in 1..=days_in_month {
        let date_str = format!("{:04}-{:02}-{:02}", year, month, day);
        let naive_date = match NaiveDate::from_ymd_opt(year, month, day) {
            Some(d) => d,
            None => continue,
        };

        // Holiday mode overrides everything
        if holiday_mode {
            result.insert(
                date_str.clone(),
                DayAvailability {
                    date: date_str,
                    status: "blocked".into(),
                    slots: vec![],
                    reason: Some("Creator is on Holiday Mode".into()),
                },
            );
            continue;
        }

        // Check if day is explicitly blocked
        if blocked_dates.get(&date_str).copied().unwrap_or(false) {
            result.insert(
                date_str.clone(),
                DayAvailability {
                    date: date_str,
                    status: "blocked".into(),
                    slots: vec![],
                    reason: Some("Blocked by creator".into()),
                },
            );
            continue;
        }

        // Check day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
        let dow = naive_date.weekday().num_days_from_sunday() as u8;
        let work_hours = match active_days.get(&dow) {
            Some(&hours) => hours,
            None => {
                // Creator's off-day
                result.insert(
                    date_str.clone(),
                    DayAvailability {
                        date: date_str,
                        status: "blocked".into(),
                        slots: vec![],
                        reason: Some("Day off".into()),
                    },
                );
                continue;
            }
        };

        let (work_start, work_end) = work_hours;
        let day_bookings = booked_intervals.get(&date_str);

        // Compute free continuous intervals
        let mut free_windows: Vec<(u32, u32)> = vec![(work_start, work_end)];

        if let Some(bookings) = day_bookings {
            for &(b_start, b_end) in bookings {
                // Apply buffer: buffer before and after booking
                let busy_start = b_start.saturating_sub(buffer_minutes);
                let busy_end = (b_end + buffer_minutes).min(24 * 60);

                let mut next_free = Vec::new();
                for (f_start, f_end) in free_windows {
                    if busy_end <= f_start || busy_start >= f_end {
                        // No overlap
                        next_free.push((f_start, f_end));
                    } else {
                        // Split window
                        if busy_start > f_start {
                            next_free.push((f_start, busy_start));
                        }
                        if busy_end < f_end {
                            next_free.push((busy_end, f_end));
                        }
                    }
                }
                free_windows = next_free;
            }
        }

        // Slide duration across free windows with step cadence
        let mut valid_slots = Vec::new();
        let step = slot_step_minutes.max(15);

        for (f_start, f_end) in free_windows {
            // Align start time to slot_step_minutes
            let mut t = f_start;
            if t % step != 0 {
                t = t + (step - (t % step));
            }

            while t + duration_minutes <= f_end {
                let hour = t / 60;
                let min = t % 60;
                valid_slots.push(format!("{:02}:{:02}", hour, min));
                t += step;
            }
        }

        let (status, reason) = if !valid_slots.is_empty() {
            ("available".to_string(), None)
        } else if day_bookings.is_some() && !day_bookings.unwrap().is_empty() {
            ("booked".to_string(), Some("Fully booked for this duration".into()))
        } else {
            ("blocked".to_string(), Some("Not enough continuous hours".into()))
        };

        result.insert(
            date_str.clone(),
            DayAvailability {
                date: date_str,
                status,
                slots: valid_slots,
                reason,
            },
        );
    }

    result
}

// ─── 2. RFC 5545 iCalendar Feed Generator ─────────────────────────────────────

pub async fn get_ical_feed(
    State(state): State<AppState>,
    Path(creator_id): Path<String>,
) -> impl IntoResponse {
    tracing::info!("📆 GET /api/calendar/{}/calendar.ics -> Generating iCal feed", creator_id);

    let mut events = Vec::new();

    if let Some(ref pool) = state.pool {
        if let Ok(bookings) = sqlx::query_as::<_, (
            String, String, String, String, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String, String
        )>(
            r#"
            SELECT
                b.id::text, b.client_name, b.pkg_name, b.location_type,
                b.start_time, b.end_time, b.status, COALESCE(b.client_notes, '')
            FROM bookings b
            WHERE b.creator_id = $1::uuid AND b.start_time IS NOT NULL AND b.status IN ('confirmed', 'pending_approval')
            "#
        )
        .bind(&creator_id)
        .fetch_all(pool)
        .await
        {
            for (id, client, pkg, loc, start_dt, end_dt, status, notes) in bookings {
                events.push((id, client, pkg, loc, start_dt, end_dt, status, notes));
            }
        }
    }

    // If no bookings in DB, provide fallback sample event for demonstration
    if events.is_empty() {
        let now = chrono::Utc::now();
        let start = now + chrono::Duration::days(3);
        let end = start + chrono::Duration::hours(3);
        events.push((
            "ftc-demo-1".into(),
            "Aarav Sharma".into(),
            "Standard Fashion Shoot".into(),
            "Studio (Hauz Khas)".into(),
            start,
            end,
            "confirmed".into(),
            "Includes 3 outfit changes".into(),
        ));
    }

    let mut ical = String::new();
    ical.push_str("BEGIN:VCALENDAR\r\n");
    ical.push_str("VERSION:2.0\r\n");
    ical.push_str("PRODID:-//FTC Creator Marketplace//Calendar 1.0//EN\r\n");
    ical.push_str("CALSCALE:GREGORIAN\r\n");
    ical.push_str("METHOD:PUBLISH\r\n");
    ical.push_str("X-WR-CALNAME:FTC Shoots & Bookings\r\n");
    ical.push_str("X-WR-TIMEZONE:Asia/Kolkata\r\n");

    for (id, client, pkg, loc, start_dt, end_dt, status, notes) in events {
        ical.push_str("BEGIN:VEVENT\r\n");
        ical.push_str(&format!("UID:{}@ftc.co\r\n", id));
        ical.push_str(&format!("DTSTAMP:{}Z\r\n", chrono::Utc::now().format("%Y%m%dT%H%M%S")));
        ical.push_str(&format!("DTSTART:{}Z\r\n", start_dt.format("%Y%m%dT%H%M%S")));
        ical.push_str(&format!("DTEND:{}Z\r\n", end_dt.format("%Y%m%dT%H%M%S")));
        ical.push_str(&format!("SUMMARY:FTC Shoot: {} ({})\r\n", client, pkg));
        ical.push_str(&format!("LOCATION:{}\r\n", loc));
        ical.push_str(&format!("DESCRIPTION:Client: {}\\nPackage: {}\\nNotes: {}\\nStatus: {}\\n\r\n", client, pkg, notes, status));
        ical.push_str(&format!("STATUS:{}\r\n", if status == "confirmed" { "CONFIRMED" } else { "TENTATIVE" }));
        ical.push_str("END:VEVENT\r\n");
    }

    ical.push_str("END:VCALENDAR\r\n");

    ([(header::CONTENT_TYPE, "text/calendar; charset=utf-8")], ical)
}

// ─── 3. Creator Settings & Overrides ──────────────────────────────────────────

async fn get_my_calendar_settings() -> Json<Value> {
    tracing::info!("⚙️ GET /api/calendar/me/calendar-settings");
    Json(json!({
        "slot_step_minutes": 60,
        "buffer_minutes": 30,
        "min_notice_hours": 24,
        "holiday_mode": false,
        "calendar_token": "ftc-ical-sec-9812",
        "schedules": [
            { "day_of_week": 1, "is_active": true, "start_time": "09:00", "end_time": "19:00" },
            { "day_of_week": 2, "is_active": true, "start_time": "09:00", "end_time": "19:00" },
            { "day_of_week": 3, "is_active": true, "start_time": "09:00", "end_time": "19:00" },
            { "day_of_week": 4, "is_active": true, "start_time": "09:00", "end_time": "19:00" },
            { "day_of_week": 5, "is_active": true, "start_time": "09:00", "end_time": "19:00" },
            { "day_of_week": 6, "is_active": true, "start_time": "10:00", "end_time": "18:00" },
            { "day_of_week": 0, "is_active": false, "start_time": "10:00", "end_time": "18:00" }
        ]
    }))
}

async fn update_my_calendar_settings(
    Json(payload): Json<UpdateCalendarSettingsPayload>,
) -> Json<Value> {
    tracing::info!("⚙️ POST /api/calendar/me/calendar-settings -> Updated: {:?}", payload);
    Json(json!({ "success": true, "settings": payload }))
}

async fn create_override(Json(payload): Json<CreateOverridePayload>) -> Json<Value> {
    tracing::info!("🚫 POST /api/calendar/me/overrides -> Block date: {:?}", payload);
    let id = format!("ovr-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());
    Json(json!({ "success": true, "id": id, "override": payload }))
}

async fn delete_override(Path(id): Path<String>) -> Json<Value> {
    tracing::info!("🗑️ DELETE /api/calendar/me/overrides/{}", id);
    Json(json!({ "success": true, "id": id }))
}
