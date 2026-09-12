use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap},
    routing::{delete, get, post},
    Json, Router,
};
use base64::engine::general_purpose::{STANDARD, URL_SAFE, URL_SAFE_NO_PAD};
use base64::Engine;
use chrono::{Datelike, NaiveDate, Timelike};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::error::AppError;
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
        .route("/:id/validate-slot", get(validate_slot))
        .route("/me/calendar-settings", get(get_my_calendar_settings).post(update_my_calendar_settings))
        .route("/me/overrides", post(create_override))
        .route("/me/overrides/:id", delete(delete_override))
}

#[derive(Debug, Deserialize)]
pub struct ValidateSlotQuery {
    pub date: String,
    pub time: String,
    pub duration: Option<u32>,
}

#[derive(Debug, serde::Serialize)]
pub struct SlotValidationResult {
    pub valid: bool,
    pub reason: Option<String>,
}

/// Resolves the authenticated creator ID from `x-creator-id` header or Bearer JWT token.
/// Matches on `id = $1::uuid` or `handle = $1`. Never falls back to arbitrary creators.
async fn resolve_creator_id(headers: &HeaderMap, pool: Option<&sqlx::PgPool>) -> Option<String> {
    let pool = pool?;

    // 1. Explicit header: x-creator-id (UUID or handle)
    if let Some(val) = headers.get("x-creator-id").and_then(|v| v.to_str().ok()) {
        let val_clean = val.trim();
        if !val_clean.is_empty() && val_clean != "my_profile" {
            if let Ok(parsed) = uuid::Uuid::parse_str(val_clean) {
                if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                    "SELECT id::text FROM creator_profiles WHERE id = $1::uuid LIMIT 1"
                )
                .bind(parsed)
                .fetch_optional(pool)
                .await
                {
                    return Some(cid);
                }
            } else if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                "SELECT id::text FROM creator_profiles WHERE handle = $1 OR id::text = $1 LIMIT 1"
            )
            .bind(val_clean)
            .fetch_optional(pool)
            .await
            {
                return Some(cid);
            }
        }
    }

    // 2. Authorization Bearer JWT
    if let Some(auth_val) = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()) {
        if let Some(token) = auth_val.strip_prefix("Bearer ").map(str::trim) {
            let parts: Vec<&str> = token.split('.').collect();
            if parts.len() >= 2 {
                let payload_b64 = parts[1];
                let decoded_opt = URL_SAFE_NO_PAD
                    .decode(payload_b64)
                    .or_else(|_| URL_SAFE.decode(payload_b64))
                    .or_else(|_| STANDARD.decode(payload_b64))
                    .ok();

                if let Some(decoded_bytes) = decoded_opt {
                    if let Ok(val) = serde_json::from_slice::<Value>(&decoded_bytes) {
                        if let Some(sub_str) = val.get("sub").and_then(|s| s.as_str()) {
                            if let Ok(parsed_sub) = uuid::Uuid::parse_str(sub_str) {
                                // Match on id = sub
                                if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                                    "SELECT id::text FROM creator_profiles WHERE id = $1::uuid LIMIT 1"
                                )
                                .bind(parsed_sub)
                                .fetch_optional(pool)
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

    None
}

/// Resolves a creator identifier (UUID or handle like `@bobby`) to the database UUID.
/// Returns `AppError::NotFound` if the creator does not exist.
async fn resolve_target_creator_id(identifier: &str, pool: Option<&sqlx::PgPool>) -> Result<String, AppError> {
    let clean = identifier.trim().trim_start_matches('@');
    if clean.is_empty() {
        return Err(AppError::BadRequest("Creator identifier cannot be empty".into()));
    }

    if let Some(p) = pool {
        if let Ok(uuid_val) = uuid::Uuid::parse_str(clean) {
            if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
                "SELECT id::text FROM creator_profiles WHERE id = $1::uuid LIMIT 1"
            )
            .bind(uuid_val)
            .fetch_optional(p)
            .await
            {
                return Ok(cid);
            }
        }

        if let Ok(Some(cid)) = sqlx::query_scalar::<_, String>(
            "SELECT id::text FROM creator_profiles WHERE handle = $1 OR handle = $2 OR id::text = $1 LIMIT 1"
        )
        .bind(clean)
        .bind(format!("@{}", clean))
        .fetch_optional(p)
        .await
        {
            return Ok(cid);
        }

        return Err(AppError::NotFound(format!("Creator profile '{}' not found in database", identifier)));
    }

    // In-memory unit test fallback (when pool is None)
    Ok(clean.to_string())
}

// ─── 1. Dynamic Availability Engine ──────────────────────────────────────────

pub async fn get_availability(
    State(state): State<AppState>,
    Path(creator_id): Path<String>,
    Query(query): Query<AvailabilityQuery>,
) -> Result<Json<MonthAvailabilityResponse>, AppError> {
    let pool = state.pool.as_ref();
    let resolved_cid = resolve_target_creator_id(&creator_id, pool).await?;

    let now = chrono::Utc::now();
    let current_month_str = format!("{:04}-{:02}", now.year(), now.month());
    let month_str = query.month.unwrap_or(current_month_str);
    let duration = query.duration_minutes.unwrap_or(120);

    tracing::info!(
        "📅 GET /api/calendar/{}/availability -> Resolved: {}, Month: {}, Duration: {}m",
        creator_id,
        resolved_cid,
        month_str,
        duration
    );

    // Parse month YYYY-MM
    let parts: Vec<&str> = month_str.split('-').collect();
    let (year, month_num) = if parts.len() == 2 {
        (
            parts[0].parse::<i32>().map_err(|_| AppError::BadRequest("Invalid year format".into()))?,
            parts[1].parse::<u32>().map_err(|_| AppError::BadRequest("Invalid month format".into()))?,
        )
    } else {
        (now.year(), now.month())
    };

    if month_num < 1 || month_num > 12 {
        return Err(AppError::BadRequest("Month must be between 1 and 12".into()));
    }

    let resp = fetch_month_availability_internal(pool, &resolved_cid, year, month_num, duration).await?;
    Ok(Json(resp))
}

pub async fn validate_slot(
    State(state): State<AppState>,
    Path(creator_id): Path<String>,
    Query(query): Query<ValidateSlotQuery>,
) -> Result<Json<SlotValidationResult>, AppError> {
    let pool = state.pool.as_ref();
    let resolved_cid = resolve_target_creator_id(&creator_id, pool).await?;

    let parsed_date = NaiveDate::parse_from_str(&query.date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid date format, expected YYYY-MM-DD".into()))?;

    let year = parsed_date.year();
    let month_num = parsed_date.month();
    let duration = query.duration.unwrap_or(120);

    let resp = fetch_month_availability_internal(pool, &resolved_cid, year, month_num, duration).await?;

    if let Some(day) = resp.days.get(&query.date) {
        if day.status == "blocked" {
            let r = day.reason.clone().unwrap_or_else(|| "Date is blocked by creator".into());
            return Ok(Json(SlotValidationResult {
                valid: false,
                reason: Some(r),
            }));
        }

        let requested_time = query.time.trim();
        let requested_time_clean = if requested_time.len() >= 5 {
            &requested_time[..5]
        } else {
            requested_time
        };

        if day.slots.iter().any(|s| s == requested_time_clean) {
            return Ok(Json(SlotValidationResult {
                valid: true,
                reason: None,
            }));
        } else {
            return Ok(Json(SlotValidationResult {
                valid: false,
                reason: Some("Selected time slot is no longer available. Please select another slot.".into()),
            }));
        }
    }

    Ok(Json(SlotValidationResult {
        valid: false,
        reason: Some("Date not found in creator's calendar".into()),
    }))
}

pub async fn fetch_month_availability_internal(
    pool: Option<&sqlx::PgPool>,
    resolved_cid: &str,
    year: i32,
    month_num: u32,
    duration: u32,
) -> Result<MonthAvailabilityResponse, AppError> {
    let month_str = format!("{:04}-{:02}", year, month_num);
    let mut slot_step = 60u32;
    let mut buffer = 30u32;
    let mut active_days: HashMap<u8, (u32, u32)> = HashMap::new();
    for day in 1..=6 {
        active_days.insert(day, (9 * 60, 19 * 60));
    }
    let mut blocked_dates: HashMap<String, bool> = HashMap::new();
    let mut custom_day_hours: HashMap<String, (u32, u32)> = HashMap::new();
    let mut override_reasons: HashMap<String, String> = HashMap::new();
    let mut custom_time_labels: HashMap<String, (String, String)> = HashMap::new();
    let mut booked_intervals: HashMap<String, Vec<(u32, u32)>> = HashMap::new();

    if let Some(pool) = pool {
        // 1. Fetch creator settings (buffer minutes, slot step)
        if let Ok(Some((step, buf))) = sqlx::query_as::<_, (i32, i32)>(
            "SELECT slot_step_minutes, buffer_minutes FROM creator_calendar_settings WHERE creator_id = $1::uuid",
        )
        .bind(resolved_cid)
        .fetch_optional(pool)
        .await
        {
            slot_step = step as u32;
            buffer = buf as u32;
        }

        // 2. Fetch custom weekly schedules
        if let Ok(schedules) = sqlx::query_as::<_, (i16, bool, chrono::NaiveTime, chrono::NaiveTime)>(
            "SELECT day_of_week, is_active, start_time, end_time FROM creator_schedules WHERE creator_id = $1::uuid",
        )
        .bind(resolved_cid)
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

        // 3. Fetch calendar overrides for this month
        let last_day = if month_num == 2 {
            if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 29 } else { 28 }
        } else if [4, 6, 9, 11].contains(&month_num) {
            30
        } else {
            31
        };
        let start_date_str = format!("{:04}-{:02}-01T00:00:00Z", year, month_num);
        let end_date_str = format!("{:04}-{:02}-{:02}T23:59:59Z", year, month_num, last_day);

        let overrides = sqlx::query_as::<_, (
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
        .bind(resolved_cid)
        .bind(&start_date_str)
        .bind(&end_date_str)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to query calendar overrides: {:?}", e);
            AppError::InternalServerError(format!("Database error querying overrides: {}", e))
        })?;

        for (start_dt, _, _, ovr_type, c_start_opt, c_end_opt, reason_opt) in overrides {
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
            blocked_dates.insert(date_k, true);
        }

        // 4. Fetch booked intervals
        let bookings = sqlx::query_as::<_, (chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>(
            r#"
            SELECT start_time, end_time FROM bookings
            WHERE creator_id = $1::uuid
              AND status IN ('confirmed', 'pending')
              AND start_time >= $2::timestamptz
              AND start_time <= $3::timestamptz
            "#
        )
        .bind(resolved_cid)
        .bind(&start_date_str)
        .bind(&end_date_str)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to query bookings: {:?}", e);
            AppError::InternalServerError(format!("Database error querying bookings: {}", e))
        })?;

        for (start_t, end_t) in bookings {
            let date_key = start_t.format("%Y-%m-%d").to_string();
            let s_mins = start_t.hour() * 60 + start_t.minute();
            let e_mins = end_t.hour() * 60 + end_t.minute();
            booked_intervals.entry(date_key).or_default().push((s_mins, e_mins));
        }
    }

    // 5. Compute days availability in memory
    let days = compute_month_slots_extended(
        year,
        month_num,
        duration,
        slot_step,
        buffer,
        false, // holiday_mode disabled
        &active_days,
        &blocked_dates,
        &booked_intervals,
        &custom_day_hours,
        &override_reasons,
        &custom_time_labels,
    );

    Ok(MonthAvailabilityResponse {
        creator_id: resolved_cid.to_string(),
        month: month_str,
        duration_minutes: duration,
        slot_step_minutes: slot_step,
        buffer_minutes: buffer,
        holiday_mode: false,
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

/// Continuous-window slot calculation helper.
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

        // Explicitly blocked override
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

        // Custom hours or weekly day-of-week schedule
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

        // Generate discrete slots inside remaining continuous free windows
        let mut valid_slots = Vec::new();
        let step = if slot_step_minutes == 0 { 60 } else { slot_step_minutes };

        for (f_start, f_end) in free_windows {
            if f_start + duration_minutes > f_end {
                continue;
            }

            let mut t = f_start;
            let rem = t % step;
            if rem != 0 {
                t += step - rem;
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

// ─── 2. Creator Settings & Overrides (PostgreSQL Wired) ──────────────────────

async fn get_my_calendar_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    tracing::info!("⚙️ GET /api/calendar/me/calendar-settings");
    let pool = state.pool.as_ref().ok_or_else(|| {
        AppError::InternalServerError("Database connection pool unavailable".into())
    })?;
    let cid = resolve_creator_id(&headers, Some(pool)).await.ok_or_else(|| {
        AppError::Unauthorized("Creator identity could not be resolved from headers (x-creator-id or Bearer token)".into())
    })?;

    // Fetch settings
    let settings = match sqlx::query_as::<_, (i32, i32, i32, String)>(
        r#"
        SELECT slot_step_minutes, buffer_minutes, min_notice_hours, calendar_token::text
        FROM creator_calendar_settings
        WHERE creator_id = $1::uuid
        "#
    )
    .bind(&cid)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error reading calendar settings: {}", e)))?
    {
        Some(s) => s,
        None => {
            sqlx::query(
                r#"
                INSERT INTO creator_calendar_settings (creator_id, slot_step_minutes, buffer_minutes, min_notice_hours)
                VALUES ($1::uuid, 60, 30, 24)
                ON CONFLICT (creator_id) DO NOTHING
                "#
            )
            .bind(&cid)
            .execute(pool)
            .await
            .map_err(|e| AppError::InternalServerError(format!("Database error initializing settings: {}", e)))?;

            (60, 30, 24, "ftc-token".to_string())
        }
    };

    // Fetch schedules
    let schedules_rows = sqlx::query_as::<_, (i16, bool, chrono::NaiveTime, chrono::NaiveTime)>(
        r#"
        SELECT day_of_week, is_active, start_time, end_time
        FROM creator_schedules
        WHERE creator_id = $1::uuid
        ORDER BY day_of_week
        "#
    )
    .bind(&cid)
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error reading schedules: {}", e)))?;

    let schedules = if !schedules_rows.is_empty() {
        schedules_rows.into_iter().map(|(dow, active, st, et)| {
            json!({
                "day_of_week": dow,
                "is_active": active,
                "start_time": st.format("%H:%M").to_string(),
                "end_time": et.format("%H:%M").to_string()
            })
        }).collect::<Vec<_>>()
    } else {
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
            .bind(&cid)
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
    };

    // Fetch overrides
    let overrides_rows = sqlx::query_as::<_, (
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
    .bind(&cid)
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Database error reading overrides: {}", e)))?;

    let overrides = overrides_rows.into_iter().map(|(id, s_dt, e_dt, reason, full, ovr_type, c_st, c_et)| {
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
    }).collect::<Vec<_>>();

    Ok(Json(json!({
        "creator_id": cid,
        "slot_step_minutes": settings.0,
        "buffer_minutes": settings.1,
        "min_notice_hours": settings.2,
        "schedules": schedules,
        "overrides": overrides
    })))
}

async fn update_my_calendar_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateCalendarSettingsPayload>,
) -> Result<Json<Value>, AppError> {
    tracing::info!("⚙️ POST /api/calendar/me/calendar-settings -> Updated: {:?}", payload);
    let pool = state.pool.as_ref().ok_or_else(|| {
        AppError::InternalServerError("Database connection pool unavailable".into())
    })?;
    let cid = resolve_creator_id(&headers, Some(pool)).await.ok_or_else(|| {
        AppError::Unauthorized("Creator identity could not be resolved from headers (x-creator-id or Bearer token)".into())
    })?;

    sqlx::query(
        r#"
        INSERT INTO creator_calendar_settings (creator_id, slot_step_minutes, buffer_minutes, min_notice_hours, updated_at)
        VALUES ($1::uuid, COALESCE($2, 60), COALESCE($3, 30), COALESCE($4, 24), NOW())
        ON CONFLICT (creator_id) DO UPDATE SET
            slot_step_minutes = COALESCE($2, creator_calendar_settings.slot_step_minutes),
            buffer_minutes = COALESCE($3, creator_calendar_settings.buffer_minutes),
            min_notice_hours = COALESCE($4, creator_calendar_settings.min_notice_hours),
            updated_at = NOW()
        "#
    )
    .bind(&cid)
    .bind(payload.slot_step_minutes.map(|v| v as i32))
    .bind(payload.buffer_minutes.map(|v| v as i32))
    .bind(payload.min_notice_hours.map(|v| v as i32))
    .execute(pool)
    .await
    .map_err(|e| AppError::InternalServerError(format!("Failed to save calendar settings: {}", e)))?;

    if let Some(ref scheds) = payload.schedules {
        for s in scheds {
            sqlx::query(
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
            .bind(&cid)
            .bind(s.day_of_week as i16)
            .bind(s.is_active)
            .bind(&s.start_time)
            .bind(&s.end_time)
            .execute(pool)
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to save schedule for day {}: {}", s.day_of_week, e)))?;
        }
    }

    Ok(Json(json!({ "success": true, "settings": payload })))
}

async fn create_override(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateOverridePayload>,
) -> Result<Json<Value>, AppError> {
    tracing::info!("🚫 POST /api/calendar/me/overrides -> {:?}", payload);
    let pool = state.pool.as_ref().ok_or_else(|| {
        AppError::InternalServerError("Database connection pool unavailable".into())
    })?;
    let cid = resolve_creator_id(&headers, Some(pool)).await.ok_or_else(|| {
        AppError::Unauthorized("Creator identity could not be resolved from headers (x-creator-id or Bearer token)".into())
    })?;

    // Clear any existing override on this date for this creator
    let _ = sqlx::query(
        "DELETE FROM calendar_overrides WHERE creator_id = $1::uuid AND DATE(start_datetime) = DATE($2::timestamptz)"
    )
    .bind(&cid)
    .bind(&payload.start_datetime)
    .execute(pool)
    .await;

    let id = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO calendar_overrides (
            creator_id, start_datetime, end_datetime, reason, is_full_day,
            override_type, custom_start_time, custom_end_time
        )
        VALUES ($1::uuid, $2::timestamptz, $3::timestamptz, $4, $5, $6, $7::time, $8::time)
        RETURNING id
        "#
    )
    .bind(&cid)
    .bind(&payload.start_datetime)
    .bind(&payload.end_datetime)
    .bind(&payload.reason)
    .bind(payload.is_full_day)
    .bind(&payload.override_type)
    .bind(&payload.custom_start_time)
    .bind(&payload.custom_end_time)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to insert calendar override into PostgreSQL: {:?}", e);
        AppError::InternalServerError(format!("Failed to persist calendar override: {}", e))
    })?;

    Ok(Json(json!({ "success": true, "id": id.to_string(), "override": payload })))
}

async fn delete_override(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    tracing::info!("🗑️ DELETE /api/calendar/me/overrides/{}", id);
    let pool = state.pool.as_ref().ok_or_else(|| {
        AppError::InternalServerError("Database connection pool unavailable".into())
    })?;
    let cid = resolve_creator_id(&headers, Some(pool)).await.ok_or_else(|| {
        AppError::Unauthorized("Creator identity could not be resolved from headers (x-creator-id or Bearer token)".into())
    })?;

    let uuid_val = uuid::Uuid::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid override UUID format".into()))?;

    let rows_affected = sqlx::query("DELETE FROM calendar_overrides WHERE id = $1::uuid AND creator_id = $2::uuid")
        .bind(uuid_val)
        .bind(&cid)
        .execute(pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Database error deleting override: {}", e)))?
        .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::NotFound("Override not found or unauthorized".into()));
    }

    Ok(Json(json!({ "success": true, "id": id })))
}
