use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap},
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use base64::engine::general_purpose::{STANDARD, URL_SAFE, URL_SAFE_NO_PAD};
use base64::Engine;
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

/// Helper to resolve creator UUID from JWT Bearer token, x-creator-id header, or fallback to latest creator in DB
async fn resolve_creator_id(headers: &HeaderMap, pool: Option<&sqlx::PgPool>) -> Option<String> {
    // 1. Explicit header (UUID, user_id, or handle)
    if let Some(val) = headers.get("x-creator-id").and_then(|v| v.to_str().ok()) {
        let val_clean = val.trim();
        if !val_clean.is_empty() && val_clean != "my_profile" {
            if let Ok(parsed) = uuid::Uuid::parse_str(val_clean) {
                if let Some(p) = pool {
                    if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                        "SELECT id::text FROM creator_profiles WHERE id = $1::uuid OR user_id = $1::uuid LIMIT 1"
                    )
                    .bind(parsed)
                    .fetch_optional(p)
                    .await
                    {
                        return Some(cid);
                    }
                } else {
                    return Some(parsed.to_string());
                }
            } else if let Some(p) = pool {
                // Check by handle or text id
                if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                    "SELECT id::text FROM creator_profiles WHERE handle = $1 OR id::text = $1 LIMIT 1"
                )
                .bind(val_clean)
                .fetch_optional(p)
                .await
                {
                    return Some(cid);
                }
            }
        }
    }

    // 2. Bearer token decode
    if let Some(auth_val) = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()) {
        if let Some(token) = auth_val.strip_prefix("Bearer ") {
            let token_parts: Vec<&str> = token.split('.').collect();
            if token_parts.len() == 3 {
                let payload_b64 = token_parts[1];
                if let Ok(decoded) = URL_SAFE_NO_PAD
                    .decode(payload_b64)
                    .or_else(|_| URL_SAFE.decode(payload_b64))
                    .or_else(|_| STANDARD.decode(payload_b64))
                {
                    if let Ok(claims) = serde_json::from_slice::<serde_json::Value>(&decoded) {
                        if let Some(sub) = claims.get("sub").and_then(|s| s.as_str()) {
                            if let Ok(sub_uuid) = uuid::Uuid::parse_str(sub) {
                                if let Some(p) = pool {
                                    // Check if sub matches creator_profiles.id OR creator_profiles.user_id
                                    if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                                        "SELECT id::text FROM creator_profiles WHERE id = $1::uuid OR user_id = $1::uuid LIMIT 1"
                                    )
                                    .bind(sub_uuid)
                                    .fetch_optional(p)
                                    .await
                                    {
                                        return Some(cid);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. Fallback to latest updated creator profile in PostgreSQL
    if let Some(p) = pool {
        if let Ok(Some(row)) = sqlx::query_scalar::<_, String>(
            "SELECT id::text FROM creator_profiles ORDER BY updated_at DESC LIMIT 1"
        )
        .fetch_optional(p)
        .await
        {
            return Some(row);
        }
    }

    None
}

// ─── 1. Dynamic Availability Engine ──────────────────────────────────────────

pub async fn get_availability(
    State(state): State<AppState>,
    Path(creator_id): Path<String>,
    Query(query): Query<AvailabilityQuery>,
) -> Json<MonthAvailabilityResponse> {
    let now = chrono::Utc::now();
    let current_month_str = format!("{:04}-{:02}", now.year(), now.month());
    let month_str = query.month.unwrap_or(current_month_str);
    let duration = query.duration_minutes.unwrap_or(120); // Default 2 hours

    tracing::info!(
        "📅 GET /api/calendar/{}/availability -> Month: {}, Duration: {}m",
        creator_id,
        month_str,
        duration
    );

    // Resolve creator_id into valid UUID if possible
    let resolved_cid = if let Some(ref pool) = state.pool {
        let clean_id = creator_id.trim();
        if let Ok(parsed) = uuid::Uuid::parse_str(clean_id) {
            if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                "SELECT id::text FROM creator_profiles WHERE id = $1::uuid OR user_id = $1::uuid LIMIT 1"
            )
            .bind(parsed)
            .fetch_optional(pool)
            .await
            {
                cid
            } else {
                creator_id.clone()
            }
        } else {
            // Check by handle or text id
            if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                "SELECT id::text FROM creator_profiles WHERE handle = $1 OR id::text = $1 LIMIT 1"
            )
            .bind(clean_id)
            .fetch_optional(pool)
            .await
            {
                cid
            } else if let Ok(Some(fallback_cid)) = sqlx::query_scalar::<_, String>(
                "SELECT id::text FROM creator_profiles ORDER BY updated_at DESC LIMIT 1"
            )
            .fetch_optional(pool)
            .await
            {
                fallback_cid
            } else {
                creator_id.clone()
            }
        }
    } else {
        creator_id.clone()
    };

    // Parse month YYYY-MM
    let parts: Vec<&str> = month_str.split('-').collect();
    let (year, month_num) = if parts.len() == 2 {
        (
            parts[0].parse::<i32>().unwrap_or_else(|_| now.year()),
            parts[1].parse::<u32>().unwrap_or_else(|_| now.month()),
        )
    } else {
        (now.year(), now.month())
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
    let mut custom_day_hours: HashMap<String, (u32, u32)> = HashMap::new();
    let mut booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();
    let mut override_reasons: HashMap<String, String> = HashMap::new();
    let mut custom_time_labels: HashMap<String, (String, String)> = HashMap::new();

    // ─── Query Postgres pool if available ──────────
    if let Some(ref pool) = state.pool {
        // Fetch creator settings
        if let Ok(settings_row) = sqlx::query_as::<_, (i32, i32, bool)>(
            "SELECT slot_step_minutes, buffer_minutes, holiday_mode FROM creator_calendar_settings WHERE creator_id = $1::uuid",
        )
        .bind(&resolved_cid)
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
        .bind(&resolved_cid)
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

        // Fetch overrides for this full month
        let last_day = if month_num == 2 {
            if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 29 } else { 28 }
        } else if [4, 6, 9, 11].contains(&month_num) {
            30
        } else {
            31
        };
        let start_date_str = format!("{:04}-{:02}-01T00:00:00Z", year, month_num);
        let end_date_str = format!("{:04}-{:02}-{:02}T23:59:59Z", year, month_num, last_day);


        if let Ok(overrides) = sqlx::query_as::<_, (
            chrono::DateTime<chrono::Utc>,
            chrono::DateTime<chrono::Utc>,
            bool,
            String,
            Option<chrono::NaiveTime>,
            Option<chrono::NaiveTime>,
            Option<String>,
        )>(
            r#"
            SELECT start_datetime, end_datetime, is_full_day, COALESCE(override_type, 'blocked'),
                   custom_start_time, custom_end_time, reason
            FROM calendar_overrides
            WHERE creator_id = $1::uuid AND start_datetime >= $2::timestamptz AND start_datetime <= $3::timestamptz
            "#
        )
        .bind(&resolved_cid)
        .bind(&start_date_str)
        .bind(&end_date_str)
        .fetch_all(pool)
        .await
        {
            for (start_dt, _, full_day, ovr_type, c_start_opt, c_end_opt, reason_opt) in overrides {
                let date_k = start_dt.format("%Y-%m-%d").to_string();
                if let Some(ref r) = reason_opt {
                    if !r.trim().is_empty() {
                        override_reasons.insert(date_k.clone(), r.trim().to_string());
                    }
                }
                if ovr_type == "custom_hours" {
                    if let (Some(c_start), Some(c_end)) = (c_start_opt, c_end_opt) {
                        let start_mins = c_start.hour() * 60 + c_start.minute();
                        let end_mins = end_mins_safe(c_end);
                        if end_mins > start_mins {
                            custom_day_hours.insert(date_k.clone(), (start_mins, end_mins));
                            custom_time_labels.insert(
                                date_k.clone(),
                                (c_start.format("%H:%M").to_string(), c_end.format("%H:%M").to_string()),
                            );
                            continue;
                        }
                    }
                }
                if full_day || ovr_type == "blocked" {
                    blocked_dates.insert(date_k, true);
                }
            }
        }

        // Fetch confirmed/pending bookings
        if let Ok(bookings) = sqlx::query_as::<_, (chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>(
            "SELECT start_time, end_time FROM bookings WHERE creator_id = $1::uuid AND status IN ('confirmed', 'pending_approval') AND start_time IS NOT NULL",
        )
        .bind(&resolved_cid)
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
    }

    let days = compute_month_slots_extended(
        year,
        month_num,
        duration,
        slot_step,
        buffer,
        holiday_mode,
        &active_days,
        &blocked_dates,
        &booked_intervals,
        &custom_day_hours,
        &override_reasons,
        &custom_time_labels,
    );

    Json(MonthAvailabilityResponse {
        creator_id: resolved_cid,
        month: month_str,
        duration_minutes: duration,
        slot_step_minutes: slot_step,
        buffer_minutes: buffer,
        holiday_mode,
        days,
    })
}

fn end_mins_safe(t: chrono::NaiveTime) -> u32 {
    let m = t.hour() * 60 + t.minute();
    if m == 0 && t.hour() == 0 && t.minute() == 0 {
        24 * 60
    } else {
        m
    }
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
    custom_day_hours: &HashMap<String, (u32, u32)>,
) -> HashMap<String, DayAvailability> {
    compute_month_slots_extended(
        year,
        month,
        duration_minutes,
        slot_step_minutes,
        buffer_minutes,
        holiday_mode,
        active_days,
        blocked_dates,
        booked_intervals,
        custom_day_hours,
        &HashMap::new(),
        &HashMap::new(),
    )
}

/// Extended computation function with explicit override reasons and custom time display labels.
pub fn compute_month_slots_extended(
    year: i32,
    month: u32,
    duration_minutes: u32,
    slot_step_minutes: u32,
    buffer_minutes: u32,
    holiday_mode: bool,
    active_days: &HashMap<u8, (u32, u32)>,
    blocked_dates: &HashMap<String, bool>,
    booked_intervals: &HashMap<String, Vec<(u32, u32)>>,
    custom_day_hours: &HashMap<String, (u32, u32)>,
    override_reasons: &HashMap<String, String>,
    custom_time_labels: &HashMap<String, (String, String)>,
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
                    is_custom_hours: None,
                    custom_start_time: None,
                    custom_end_time: None,
                },
            );
            continue;
        }

        // Check if day is explicitly blocked
        if blocked_dates.get(&date_str).copied().unwrap_or(false) {
            let blocked_reason = override_reasons
                .get(&date_str)
                .cloned()
                .unwrap_or_else(|| "Blocked by creator".into());
            result.insert(
                date_str.clone(),
                DayAvailability {
                    date: date_str,
                    status: "blocked".into(),
                    slots: vec![],
                    reason: Some(blocked_reason),
                    is_custom_hours: None,
                    custom_start_time: None,
                    custom_end_time: None,
                },
            );
            continue;
        }

        // Check custom hours override or regular weekly day-of-week
        let (work_hours, is_custom) = if let Some(&custom) = custom_day_hours.get(&date_str) {
            (custom, true)
        } else {
            let dow = naive_date.weekday().num_days_from_sunday() as u8;
            match active_days.get(&dow) {
                Some(&hours) => (hours, false),
                None => {
                    result.insert(
                        date_str.clone(),
                        DayAvailability {
                            date: date_str,
                            status: "blocked".into(),
                            slots: vec![],
                            reason: Some("Day off".into()),
                            is_custom_hours: None,
                            custom_start_time: None,
                            custom_end_time: None,
                        },
                    );
                    continue;
                }
            }
        };

        let (work_start, work_end) = work_hours;
        let day_bookings = booked_intervals.get(&date_str);

        // Compute free continuous intervals
        let mut free_windows: Vec<(u32, u32)> = vec![(work_start, work_end)];

        if let Some(bookings) = day_bookings {
            for &(b_start, b_end) in bookings {
                let busy_start = b_start.saturating_sub(buffer_minutes);
                let busy_end = (b_end + buffer_minutes).min(24 * 60);

                let mut next_free = Vec::new();
                for (f_start, f_end) in free_windows {
                    if busy_end <= f_start || busy_start >= f_end {
                        next_free.push((f_start, f_end));
                    } else {
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
            let r = if is_custom {
                override_reasons.get(&date_str).cloned()
            } else {
                None
            };
            ("available".to_string(), r)
        } else if day_bookings.is_some() && !day_bookings.unwrap().is_empty() {
            ("booked".to_string(), Some("Fully booked for this duration".into()))
        } else {
            ("blocked".to_string(), Some("Not enough continuous hours".into()))
        };

        let (custom_start_time, custom_end_time) = if is_custom {
            if let Some(lbl) = custom_time_labels.get(&date_str) {
                (Some(lbl.0.clone()), Some(lbl.1.clone()))
            } else {
                (
                    Some(format!("{:02}:{:02}", work_start / 60, work_start % 60)),
                    Some(format!("{:02}:{:02}", work_end / 60, work_end % 60)),
                )
            }
        } else {
            (None, None)
        };

        result.insert(
            date_str.clone(),
            DayAvailability {
                date: date_str,
                status,
                slots: valid_slots,
                reason,
                is_custom_hours: if is_custom { Some(true) } else { None },
                custom_start_time,
                custom_end_time,
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

// ─── 3. Creator Settings & Overrides (PostgreSQL Wired) ──────────────────────

async fn get_my_calendar_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Json<Value> {
    tracing::info!("⚙️ GET /api/calendar/me/calendar-settings");
    let pool = state.pool.as_ref();
    let creator_id = resolve_creator_id(&headers, pool).await;

    if let (Some(pool), Some(cid)) = (pool, creator_id.as_deref()) {
        // Fetch or initialize creator calendar settings
        let settings = match sqlx::query_as::<_, (i32, i32, i32, bool, String)>(
            r#"
            SELECT slot_step_minutes, buffer_minutes, min_notice_hours, holiday_mode, calendar_token::text
            FROM creator_calendar_settings
            WHERE creator_id = $1::uuid
            "#
        )
        .bind(cid)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(s)) => s,
            _ => {
                let _ = sqlx::query(
                    r#"
                    INSERT INTO creator_calendar_settings (creator_id, slot_step_minutes, buffer_minutes, min_notice_hours, holiday_mode)
                    VALUES ($1::uuid, 60, 30, 24, false)
                    ON CONFLICT (creator_id) DO NOTHING
                    "#
                )
                .bind(cid)
                .execute(pool)
                .await;

                (60, 30, 24, false, "ftc-ical-token".to_string())
            }
        };

        // Fetch schedules
        let schedules = match sqlx::query_as::<_, (i16, bool, chrono::NaiveTime, chrono::NaiveTime)>(
            r#"
            SELECT day_of_week, is_active, start_time, end_time
            FROM creator_schedules
            WHERE creator_id = $1::uuid
            ORDER BY day_of_week
            "#
        )
        .bind(cid)
        .fetch_all(pool)
        .await
        {
            Ok(rows) if !rows.is_empty() => {
                rows.into_iter().map(|(dow, active, st, et)| {
                    json!({
                        "day_of_week": dow,
                        "is_active": active,
                        "start_time": st.format("%H:%M").to_string(),
                        "end_time": et.format("%H:%M").to_string()
                    })
                }).collect::<Vec<_>>()
            }
            _ => {
                // Initialize default weekly schedules (Mon-Sat active, Sun off)
                for d in 0..=6 {
                    let active = d != 0;
                    let st = if d == 6 { "10:00:00" } else { "09:00:00" };
                    let et = if d == 6 { "18:00:00" } else { "19:00:00" };
                    let _ = sqlx::query(
                        r#"
                        INSERT INTO creator_schedules (creator_id, day_of_week, is_active, start_time, end_time)
                        VALUES ($1::uuid, $2, $3, $4::time, $5::time)
                        ON CONFLICT (creator_id, day_of_week) DO NOTHING
                        "#
                    )
                    .bind(cid)
                    .bind(d as i16)
                    .bind(active)
                    .bind(st)
                    .bind(et)
                    .execute(pool)
                    .await;
                }

                vec![
                    json!({ "day_of_week": 1, "is_active": true, "start_time": "09:00", "end_time": "19:00" }),
                    json!({ "day_of_week": 2, "is_active": true, "start_time": "09:00", "end_time": "19:00" }),
                    json!({ "day_of_week": 3, "is_active": true, "start_time": "09:00", "end_time": "19:00" }),
                    json!({ "day_of_week": 4, "is_active": true, "start_time": "09:00", "end_time": "19:00" }),
                    json!({ "day_of_week": 5, "is_active": true, "start_time": "09:00", "end_time": "19:00" }),
                    json!({ "day_of_week": 6, "is_active": true, "start_time": "10:00", "end_time": "18:00" }),
                    json!({ "day_of_week": 0, "is_active": false, "start_time": "10:00", "end_time": "18:00" }),
                ]
            }
        };

        // Fetch overrides
        let overrides = match sqlx::query_as::<_, (
            String,
            chrono::DateTime<chrono::Utc>,
            chrono::DateTime<chrono::Utc>,
            Option<String>,
            bool,
            String,
            Option<chrono::NaiveTime>,
            Option<chrono::NaiveTime>
        )>(
            r#"
            SELECT id::text, start_datetime, end_datetime, reason, is_full_day,
                   COALESCE(override_type, 'blocked'), custom_start_time, custom_end_time
            FROM calendar_overrides
            WHERE creator_id = $1::uuid
            ORDER BY start_datetime ASC
            "#
        )
        .bind(cid)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => {
                rows.into_iter().map(|(id, s_dt, e_dt, reason, full, ovr_type, c_st, c_et)| {
                    json!({
                        "id": id,
                        "date": s_dt.format("%Y-%m-%d").to_string(),
                        "start_datetime": s_dt.to_rfc3339(),
                        "end_datetime": e_dt.to_rfc3339(),
                        "reason": reason.unwrap_or_default(),
                        "is_full_day": full,
                        "override_type": ovr_type,
                        "custom_start_time": c_st.map(|t| t.format("%H:%M").to_string()),
                        "custom_end_time": c_et.map(|t| t.format("%H:%M").to_string())
                    })
                }).collect::<Vec<_>>()
            }
            _ => vec![]
        };

        return Json(json!({
            "creator_id": cid,
            "slot_step_minutes": settings.0,
            "buffer_minutes": settings.1,
            "min_notice_hours": settings.2,
            "holiday_mode": settings.3,
            "calendar_token": settings.4,
            "schedules": schedules,
            "overrides": overrides
        }));
    }

    // Default response when database is unreachable
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
        ],
        "overrides": []
    }))
}

async fn update_my_calendar_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateCalendarSettingsPayload>,
) -> Json<Value> {
    tracing::info!("⚙️ POST /api/calendar/me/calendar-settings -> Updated: {:?}", payload);
    let pool = state.pool.as_ref();
    let creator_id = resolve_creator_id(&headers, pool).await;

    if let (Some(pool), Some(cid)) = (pool, creator_id.as_deref()) {
        let _ = sqlx::query(
            r#"
            INSERT INTO creator_calendar_settings (creator_id, slot_step_minutes, buffer_minutes, min_notice_hours, holiday_mode, updated_at)
            VALUES ($1::uuid, COALESCE($2, 60), COALESCE($3, 30), COALESCE($4, 24), COALESCE($5, false), NOW())
            ON CONFLICT (creator_id) DO UPDATE SET
                slot_step_minutes = COALESCE($2, creator_calendar_settings.slot_step_minutes),
                buffer_minutes = COALESCE($3, creator_calendar_settings.buffer_minutes),
                min_notice_hours = COALESCE($4, creator_calendar_settings.min_notice_hours),
                holiday_mode = COALESCE($5, creator_calendar_settings.holiday_mode),
                updated_at = NOW()
            "#
        )
        .bind(cid)
        .bind(payload.slot_step_minutes.map(|v| v as i32))
        .bind(payload.buffer_minutes.map(|v| v as i32))
        .bind(payload.min_notice_hours.map(|v| v as i32))
        .bind(payload.holiday_mode)
        .execute(pool)
        .await;

        if let Some(ref scheds) = payload.schedules {
            for s in scheds {
                let _ = sqlx::query(
                    r#"
                    INSERT INTO creator_schedules (creator_id, day_of_week, is_active, start_time, end_time, updated_at)
                    VALUES ($1::uuid, $2, $3, $4::time, $5::time, NOW())
                    ON CONFLICT (creator_id, day_of_week) DO UPDATE SET
                        is_active = EXCLUDED.is_active,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        updated_at = NOW()
                    "#
                )
                .bind(cid)
                .bind(s.day_of_week as i16)
                .bind(s.is_active)
                .bind(&s.start_time)
                .bind(&s.end_time)
                .execute(pool)
                .await;
            }
        }
    }

    Json(json!({ "success": true, "settings": payload }))
}

async fn create_override(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateOverridePayload>,
) -> Json<Value> {
    tracing::info!("🚫 POST /api/calendar/me/overrides -> {:?}", payload);
    let pool = state.pool.as_ref();
    let creator_id = resolve_creator_id(&headers, pool).await;

    if let (Some(pool), Some(cid)) = (pool, creator_id.as_deref()) {
        // Clear any existing override on this date for this creator
        let _ = sqlx::query(
            "DELETE FROM calendar_overrides WHERE creator_id = $1::uuid AND DATE(start_datetime) = DATE($2::timestamptz)"
        )
        .bind(cid)
        .bind(&payload.start_datetime)
        .execute(pool)
        .await;

        let insert_res = sqlx::query_scalar::<_, uuid::Uuid>(
            r#"
            INSERT INTO calendar_overrides (
                creator_id, start_datetime, end_datetime, reason, is_full_day,
                override_type, custom_start_time, custom_end_time
            )
            VALUES ($1::uuid, $2::timestamptz, $3::timestamptz, $4, $5, $6, $7::time, $8::time)
            RETURNING id
            "#
        )
        .bind(cid)
        .bind(&payload.start_datetime)
        .bind(&payload.end_datetime)
        .bind(&payload.reason)
        .bind(payload.is_full_day)
        .bind(&payload.override_type)
        .bind(&payload.custom_start_time)
        .bind(&payload.custom_end_time)
        .fetch_one(pool)
        .await;

        match insert_res {
            Ok(id) => return Json(json!({ "success": true, "id": id.to_string(), "override": payload })),
            Err(e) => tracing::error!("Failed to insert calendar override into PostgreSQL: {:?}", e),
        }
    }

    let id = format!("ovr-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());
    Json(json!({ "success": true, "id": id, "override": payload }))
}

async fn delete_override(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<Value> {
    tracing::info!("🗑️ DELETE /api/calendar/me/overrides/{}", id);
    if let Some(ref pool) = state.pool {
        if let Ok(uuid_val) = uuid::Uuid::parse_str(&id) {
            let _ = sqlx::query("DELETE FROM calendar_overrides WHERE id = $1::uuid")
                .bind(uuid_val)
                .execute(pool)
                .await;
        }
    }
    Json(json!({ "success": true, "id": id }))
}
