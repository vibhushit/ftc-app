// backend/src/constants.rs
// Platform-wide constants, presets, and category defaults

use crate::models::filter::{DisciplineFilterOption, PriceRangeConfig, SortOption};

/// Default operational cities (used as fallback or seeds)
pub const DEFAULT_OPERATIONAL_CITIES: &[&str] = &[
    "Delhi NCR",
    "Mumbai",
    "Bengaluru",
    "Goa",
    "Hyderabad",
    "Jaipur",
    "Pune",
    "Chennai",
    "Kolkata",
    "Chandigarh",
];

/// Price range filter boundaries (in INR)
pub const DEFAULT_PRICE_RANGE: PriceRangeConfig = PriceRangeConfig {
    min: 1000,
    max: 200000,
    step: 1000,
    default_min: 5000,
    default_max: 100000,
};

/// 24-hour Request-to-Book SLA in hours
pub const BOOKING_REQUEST_SLA_HOURS: i64 = 24;

/// Default booking advance deposit percentage (e.g. 50% held in escrow)
pub const DEFAULT_ADVANCE_PCT: u32 = 50;

/// Default platform commission fee percentage (e.g. 10%)
pub const DEFAULT_PLATFORM_FEE_PCT: u32 = 10;

/// Default scheduling time step (cadence) in minutes
pub const DEFAULT_SLOT_STEP_MINUTES: u32 = 60;

/// Default buffer time between sessions in minutes
pub const DEFAULT_BUFFER_MINUTES: u32 = 30;

/// Default minimum advance notice hours
pub const DEFAULT_MIN_NOTICE_HOURS: u32 = 24;

/// Category presets defining default time step (cadence) and buffer minutes
pub fn get_discipline_presets() -> Vec<DisciplineFilterOption> {
    vec![
        DisciplineFilterOption {
            id: "photography".into(),
            name: "Photography".into(),
            icon: "camera".into(),
            sub_skills: vec![
                "Portraits".into(),
                "Fashion".into(),
                "Editorial".into(),
                "Product".into(),
                "Wedding".into(),
                "Automotive".into(),
            ],
            default_step_minutes: 60,
            default_buffer_minutes: 30,
        },
        DisciplineFilterOption {
            id: "videography".into(),
            name: "Videography".into(),
            icon: "film".into(),
            sub_skills: vec![
                "Commercial".into(),
                "Reels / Social".into(),
                "Music Video".into(),
                "Drone".into(),
                "Documentary".into(),
            ],
            default_step_minutes: 120,
            default_buffer_minutes: 60,
        },
        DisciplineFilterOption {
            id: "studio".into(),
            name: "Podcast / Studio".into(),
            icon: "mic".into(),
            sub_skills: vec![
                "Audio Podcast".into(),
                "Video Podcast".into(),
                "Voiceover".into(),
                "Audiobook".into(),
            ],
            default_step_minutes: 60,
            default_buffer_minutes: 15,
        },
        DisciplineFilterOption {
            id: "editing".into(),
            name: "Post-Production / Editing".into(),
            icon: "scissors".into(),
            sub_skills: vec![
                "Color Grading".into(),
                "VFX".into(),
                "Sound Design".into(),
                "Reel Cut".into(),
                "Long Form".into(),
            ],
            default_step_minutes: 480, // Daily block (8 hours)
            default_buffer_minutes: 0,
        },
        DisciplineFilterOption {
            id: "styling".into(),
            name: "Hair, Makeup & Styling".into(),
            icon: "sparkles".into(),
            sub_skills: vec![
                "Bridal Makeup".into(),
                "Editorial Glam".into(),
                "Fashion Styling".into(),
                "SFX Makeup".into(),
            ],
            default_step_minutes: 90,
            default_buffer_minutes: 30,
        },
    ]
}

/// Supported sorting options for creator discovery
pub fn get_sort_options() -> Vec<SortOption> {
    vec![
        SortOption {
            id: "rating".into(),
            label: "Highest Rated".into(),
        },
        SortOption {
            id: "price_low".into(),
            label: "Price: Low to High".into(),
        },
        SortOption {
            id: "price_high".into(),
            label: "Price: High to Low".into(),
        },
        SortOption {
            id: "popularity".into(),
            label: "Most Popular".into(),
        },
    ]
}
