// backend/src/calendar_tests.rs
// Comprehensive unit and integration test suite for Calendar, Availability Engine, iCal, and 24h SLA

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use chrono::Utc;
    use serde_json::Value;
    use tower::ServiceExt;

    use crate::create_app;
    use crate::models::booking::CreateBookingPayload;
    use crate::routes::calendar::compute_month_slots;
    use crate::state::AppState;

    fn mock_active_weekdays(start_h: u32, end_h: u32) -> HashMap<u8, (u32, u32)> {
        let mut map = HashMap::new();
        for d in 1..=6 {
            // Monday(1) to Saturday(6)
            map.insert(d, (start_h * 60, end_h * 60));
        }
        map
    }

    // ─── 1. ALGORITHMIC WINDOW & BUFFER TESTS ──────────────────────────────────

    #[test]
    fn test_multiple_busy_intervals_in_single_day() {
        let active_days = mock_active_weekdays(9, 19); // 09:00 to 19:00
        let blocked_dates = HashMap::new();
        let mut booked = HashMap::new();

        // Two bookings on Friday, May 15, 2026:
        // Booking 1: 10:00 - 12:00 (600m - 720m)
        // Booking 2: 15:00 - 17:00 (900m - 1020m)
        booked.insert(
            "2026-05-15".to_string(),
            vec![(10 * 60, 12 * 60), (15 * 60, 17 * 60)],
        );

        // Test with 60-min session, 60-min step, and 30-min buffer
        // Buffer expands booking 1 to: 09:30 - 12:30 (570m - 750m)
        // Buffer expands booking 2 to: 14:30 - 17:30 (870m - 1050m)
        // Free intervals:
        // 1) 09:00 - 09:30 (30m free) -> 60m session does NOT fit
        // 2) 12:30 - 14:30 (120m free) -> 13:00 fits (13:00 - 14:00)
        // 3) 17:30 - 19:00 (90m free) -> 18:00 fits (18:00 - 19:00)
        let custom_hours = HashMap::new();
        let slots = compute_month_slots(
            2026,
            5,
            60,  // 1 hour
            60,  // 60m step
            30,  // 30m buffer
            false,
            &active_days,
            &blocked_dates,
            &booked,
            &custom_hours,
        );

        let day = slots.get("2026-05-15").unwrap();
        assert_eq!(day.status, "available");
        assert!(!day.slots.contains(&"09:00".to_string()));
        assert!(!day.slots.contains(&"10:00".to_string()));
        assert!(!day.slots.contains(&"11:00".to_string()));
        assert!(!day.slots.contains(&"12:00".to_string()));
        assert!(day.slots.contains(&"13:00".to_string()));
        assert!(!day.slots.contains(&"14:00".to_string())); // 14:00 + 60m = 15:00 > 14:30
        assert!(!day.slots.contains(&"17:00".to_string()));
        assert!(day.slots.contains(&"18:00".to_string()));
    }

    #[test]
    fn test_exact_window_boundary_fit() {
        let active_days = mock_active_weekdays(10, 12); // Exactly 2 hours: 10:00 to 12:00
        let blocked = HashMap::new();
        let booked = HashMap::new();
        let custom_hours = HashMap::new();

        // 120-minute package should fit exactly at 10:00
        let fit_slots = compute_month_slots(
            2026,
            5,
            120,
            60,
            0,
            false,
            &active_days,
            &blocked,
            &booked,
            &custom_hours,
        );
        let fit_day = fit_slots.get("2026-05-04").unwrap(); // Monday
        assert_eq!(fit_day.slots, vec!["10:00"]);

        // 121-minute package should NOT fit
        let no_fit_slots = compute_month_slots(
            2026,
            5,
            121,
            60,
            0,
            false,
            &active_days,
            &blocked,
            &booked,
            &custom_hours,
        );
        let no_fit_day = no_fit_slots.get("2026-05-04").unwrap();
        assert!(no_fit_day.slots.is_empty());
        assert_eq!(no_fit_day.status, "blocked");
    }

    #[test]
    fn test_zero_underflow_and_24h_overflow_safety() {
        let mut active_days = HashMap::new();
        active_days.insert(1, (0, 24 * 60)); // 24 hours open

        let blocked = HashMap::new();
        let mut booked = HashMap::new();
        let custom_hours = HashMap::new();
        // Booking right at midnight (00:00 - 01:00) with 60m buffer (saturates at 00:00)
        // Booking right at night end (23:00 - 24:00) with 60m buffer (clamps at 1440m)
        booked.insert(
            "2026-05-04".to_string(),
            vec![(0, 60), (23 * 60, 24 * 60)],
        );

        let slots = compute_month_slots(
            2026,
            5,
            60,
            60,
            60, // 60m buffer
            false,
            &active_days,
            &blocked,
            &booked,
            &custom_hours,
        );

        let day = slots.get("2026-05-04").unwrap();
        assert_eq!(day.status, "available");
        // Must not panic and must produce slots in between (e.g. 03:00 to 21:00)
        assert!(day.slots.contains(&"12:00".to_string()));
        assert!(!day.slots.contains(&"00:00".to_string()));
        assert!(!day.slots.contains(&"01:00".to_string()));
        assert!(!day.slots.contains(&"23:00".to_string()));
    }

    #[test]
    fn test_leap_year_february_dates() {
        let active_days = mock_active_weekdays(9, 18);
        let blocked = HashMap::new();
        let booked = HashMap::new();
        let custom_hours = HashMap::new();

        // 2028 is a leap year -> 29 days
        let leap = compute_month_slots(2028, 2, 60, 60, 0, false, &active_days, &blocked, &booked, &custom_hours);
        assert_eq!(leap.len(), 29);
        assert!(leap.contains_key("2028-02-29"));

        // 2026 is NOT a leap year -> 28 days
        let non_leap = compute_month_slots(2026, 2, 60, 60, 0, false, &active_days, &blocked, &booked, &custom_hours);
        assert_eq!(non_leap.len(), 28);
        assert!(!non_leap.contains_key("2026-02-29"));
        assert!(non_leap.contains_key("2026-02-28"));
    }

    #[test]
    fn test_date_override_blocks_specific_date() {
        let active_days = mock_active_weekdays(9, 18);
        let mut blocked = HashMap::new();
        blocked.insert("2026-05-20".to_string(), true); // Wednesday blocked

        let booked = HashMap::new();
        let custom_hours = HashMap::new();

        let slots = compute_month_slots(2026, 5, 60, 60, 0, false, &active_days, &blocked, &booked, &custom_hours);

        let blocked_day = slots.get("2026-05-20").unwrap();
        assert_eq!(blocked_day.status, "blocked");
        assert_eq!(blocked_day.reason, Some("Blocked by creator".into()));

        let open_day = slots.get("2026-05-21").unwrap(); // Thursday
        assert_eq!(open_day.status, "available");
        assert!(!open_day.slots.is_empty());
    }

    #[test]
    fn test_custom_hours_override_on_specific_date() {
        // Regular weekdays: 09:00 - 18:00. Sunday (05-17) is day off.
        let active_days = mock_active_weekdays(9, 18);
        let blocked = HashMap::new();
        let booked = HashMap::new();
        let mut custom_hours = HashMap::new();
        // Creator opens custom night hours on Sunday May 17, 2026 from 18:00 to 22:00
        custom_hours.insert("2026-05-17".to_string(), (18 * 60, 22 * 60));

        let slots = compute_month_slots(2026, 5, 60, 60, 0, false, &active_days, &blocked, &booked, &custom_hours);

        let sunday = slots.get("2026-05-17").unwrap();
        assert_eq!(sunday.status, "available");
        assert_eq!(sunday.is_custom_hours, Some(true));
        assert!(sunday.slots.contains(&"18:00".to_string()));
        assert!(sunday.slots.contains(&"19:00".to_string()));
        assert!(sunday.slots.contains(&"20:00".to_string()));
        assert!(sunday.slots.contains(&"21:00".to_string()));
        assert!(!sunday.slots.contains(&"09:00".to_string()));
    }

    // ─── 2. REQUEST-TO-BOOK & 24H SLA UNIT TESTS ──────────────────────────────

    #[tokio::test]
    async fn test_request_booking_24h_sla_expiry() {
        let payload = CreateBookingPayload {
            creator_id: "c1".into(),
            pkg_name: "Standard Fashion Shoot".into(),
            date_time: "May 15 at 10:00 AM".into(),
            location_type: "Studio".into(),
            start_time: Some("2026-05-15T10:00:00Z".into()),
            end_time: Some("2026-05-15T14:00:00Z".into()),
            client_notes: Some("Need 2 background colors".into()),
        };

        let app_state = AppState::new(None);
        let app = create_app(app_state);

        let req = Request::builder()
            .method("POST")
            .uri("/api/bookings/request")
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::to_string(&payload).unwrap()))
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let val: Value = serde_json::from_slice(&body_bytes).unwrap();

        assert_eq!(val["status"], "pending_approval");
        assert_eq!(val["creator_id"], "c1");
        assert!(val["id"].as_str().unwrap().starts_with("FTC-REQ-"));

        // Verify request_expires_at is approximately 24 hours from now
        let expires_str = val["request_expires_at"].as_str().unwrap();
        let expires_dt = chrono::DateTime::parse_from_rfc3339(expires_str).unwrap().with_timezone(&Utc);
        let diff = expires_dt - Utc::now();
        assert!(diff.num_hours() >= 23 && diff.num_hours() <= 24);
    }

    #[tokio::test]
    async fn test_accept_and_decline_booking_endpoints() {
        let app_state = AppState::new(None);
        let app = create_app(app_state);

        // Test Accept
        let req_accept = Request::builder()
            .method("POST")
            .uri("/api/bookings/FTC-REQ-9999/accept")
            .body(Body::empty())
            .unwrap();

        let res_accept = app.clone().oneshot(req_accept).await.unwrap();
        assert_eq!(res_accept.status(), StatusCode::OK);
        let b = axum::body::to_bytes(res_accept.into_body(), usize::MAX).await.unwrap();
        let v: Value = serde_json::from_slice(&b).unwrap();
        assert_eq!(v["success"], true);
        assert_eq!(v["status"], "confirmed");

        // Test Decline
        let req_decline = Request::builder()
            .method("POST")
            .uri("/api/bookings/FTC-REQ-9999/decline")
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({ "reason": "Shooting out of station" }).to_string()))
            .unwrap();

        let res_decline = app.oneshot(req_decline).await.unwrap();
        assert_eq!(res_decline.status(), StatusCode::OK);
        let b2 = axum::body::to_bytes(res_decline.into_body(), usize::MAX).await.unwrap();
        let v2: Value = serde_json::from_slice(&b2).unwrap();
        assert_eq!(v2["success"], true);
        assert_eq!(v2["status"], "declined");
        assert_eq!(v2["escrow_status"], "refunded_to_client");
    }

    // ─── 4. HTTP ROUTE INTEGRATION TESTS ──────────────────────────────────────

    #[tokio::test]
    async fn test_http_availability_endpoint() {
        let app_state = AppState::new(None);
        let app = create_app(app_state);

        let req = Request::builder()
            .method("GET")
            .uri("/api/calendar/c1/availability?month=2026-05&duration_minutes=120")
            .body(Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let val: Value = serde_json::from_slice(&body_bytes).unwrap();

        assert_eq!(val["creator_id"], "c1");
        assert_eq!(val["month"], "2026-05");
        assert_eq!(val["duration_minutes"], 120);
        assert!(val["days"].is_object());
        assert!(val["days"]["2026-05-15"].is_object());
    }

    #[tokio::test]
    async fn test_http_validate_slot_endpoint() {
        let app_state = AppState::new(None);
        let app = create_app(app_state);

        // Test valid slot (Friday 2026-05-15 at 10:00)
        let req = Request::builder()
            .method("GET")
            .uri("/api/calendar/c1/validate-slot?date=2026-05-15&time=10:00&duration=120")
            .body(Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let val: Value = serde_json::from_slice(&body_bytes).unwrap();
        assert_eq!(val["valid"], true);
        assert!(val["reason"].is_null());

        // Test invalid/blocked slot (Sunday 2026-05-17 is off by default)
        let app2 = create_app(AppState::new(None));
        let req2 = Request::builder()
            .method("GET")
            .uri("/api/calendar/c1/validate-slot?date=2026-05-17&time=10:00&duration=120")
            .body(Body::empty())
            .unwrap();

        let res2 = app2.oneshot(req2).await.unwrap();
        assert_eq!(res2.status(), StatusCode::OK);

        let body_bytes2 = axum::body::to_bytes(res2.into_body(), usize::MAX).await.unwrap();
        let val2: Value = serde_json::from_slice(&body_bytes2).unwrap();
        assert_eq!(val2["valid"], false);
        assert_eq!(val2["reason"], "Day off");
    }

    #[tokio::test]
    async fn test_http_filters_endpoint() {
        let app_state = AppState::new(None);
        let app = create_app(app_state);

        let req = Request::builder()
            .method("GET")
            .uri("/api/filters")
            .body(Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let val: Value = serde_json::from_slice(&body_bytes).unwrap();

        assert!(val["disciplines"].is_array());
        assert!(val["cities"].is_array());
        assert!(val["price_range"]["min"].as_u64().unwrap() > 0);
    }

    // ─── 5. DOMAIN ENUMS & PLATFORM CONFIG TESTS ─────────────────────────────

    #[test]
    fn test_domain_enums_serialization() {
        use crate::models::enums::*;

        // Discipline
        assert_eq!(serde_json::to_string(&Discipline::Photography).unwrap(), "\"photography\"");
        assert_eq!(serde_json::to_string(&Discipline::MakeupHair).unwrap(), "\"makeup_hair\"");
        let parsed_disc: Discipline = serde_json::from_str("\"videography\"").unwrap();
        assert_eq!(parsed_disc, Discipline::Videography);

        // BookingStatus
        assert_eq!(serde_json::to_string(&BookingStatus::PendingApproval).unwrap(), "\"pending_approval\"");
        assert_eq!(serde_json::to_string(&BookingStatus::Confirmed).unwrap(), "\"confirmed\"");
        let parsed_status: BookingStatus = serde_json::from_str("\"declined\"").unwrap();
        assert_eq!(parsed_status, BookingStatus::Declined);

        // CreatorTier
        assert_eq!(serde_json::to_string(&CreatorTier::Rising).unwrap(), "\"rising\"");
        assert_eq!(serde_json::to_string(&CreatorTier::Elite).unwrap(), "\"elite\"");

        // LocationType & TravelMode
        assert_eq!(serde_json::to_string(&LocationType::Studio).unwrap(), "\"studio\"");
        assert_eq!(serde_json::to_string(&TravelMode::Both).unwrap(), "\"both\"");
    }

    #[tokio::test]
    async fn test_http_config_endpoint() {
        let app_state = AppState::new(None);
        let app = create_app(app_state);

        let req = Request::builder()
            .method("GET")
            .uri("/api/config")
            .body(Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let val: Value = serde_json::from_slice(&body_bytes).unwrap();

        assert_eq!(val["sla_hours"], 24);
        assert_eq!(val["default_advance_pct"], 50);
        assert_eq!(val["default_platform_fee_pct"], 10);
        assert_eq!(val["default_slot_step_minutes"], 60);
        assert_eq!(val["default_buffer_minutes"], 30);
        assert!(val["cities"].is_array());
        assert!(val["disciplines"].is_array());
        assert!(val["price_range"]["min"].as_u64().unwrap() > 0);
    }
}
