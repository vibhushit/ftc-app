// backend/src/models/enums.rs
// Production-grade domain enums representing platform-wide single sources of truth.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/Discipline.ts")]
#[serde(rename_all = "snake_case")]
pub enum Discipline {
    Photography,
    Videography,
    Styling,
    MakeupHair,
    CreativeDirection,
    PodcastStudio,
    PostProduction,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/CreatorTier.ts")]
#[serde(rename_all = "snake_case")]
pub enum CreatorTier {
    Rising,
    Established,
    Platinum,
    Elite,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/VerificationLevel.ts")]
#[serde(rename_all = "snake_case")]
pub enum VerificationLevel {
    Unverified,
    Phone,
    GovId,
    ProVerified,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/BookingStatus.ts")]
#[serde(rename_all = "snake_case")]
pub enum BookingStatus {
    Inquiry,
    PendingApproval,
    Confirmed,
    Active,
    Delivered,
    Completed,
    Declined,
    Cancelled,
    Refunded,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/EscrowStatus.ts")]
#[serde(rename_all = "snake_case")]
pub enum EscrowStatus {
    HeldInEscrow,
    ReleasedToCreator,
    RefundedToClient,
    Disputed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/LocationType.ts")]
#[serde(rename_all = "snake_case")]
pub enum LocationType {
    Studio,
    OnLocation,
    ClientLocation,
    Outdoor,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/bindings/TravelMode.ts")]
#[serde(rename_all = "snake_case")]
pub enum TravelMode {
    Studio,
    ClientTravel,
    Both,
}
