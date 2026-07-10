# FTC (Find To Connect) — Product Document

## 1. What is FTC?

FTC is a two-sided marketplace app that connects **consumers** with **local creative professionals** ("creators": photographers, videographers, makeup artists, etc.) for bookable services, and separately connects **creators with brands** for sponsorship/collaboration deals.

Think: a mix of a local-services booking app (à la Urban Company) and a lightweight creator-brand deal board — packaged in a single mobile-style app.

---

## 2. Target Users / Personas

### Consumer
Wants to hire a verified local creator for an occasion (wedding, event, personal shoot, etc.), compare profiles, book a package, chat, pay securely, and leave a review.

### Creator (Individual professional)
Wants to build a public profile (portfolio, packages, pricing, availability), get discovered, manage inbound inquiries/bookings, send custom quotes, get paid with payout protection, and grow a trust score / tier over time.

### Brand / Sponsor
Wants to post a paid campaign/collaboration and receive applications ("deals") from creators, negotiate terms, track deliverables, and release payment on completion.

---

## 3. Core Value Proposition

| Problem | FTC Solution |
|---|---|
| Hard to find trustworthy local creators | Verified profiles (phone/ID/vetted), trust score, ratings, tiers (Rising → Silver → Gold → Platinum) |
| No standard booking/payment flow for freelance creative work | Structured booking flow with packages, escrow-based advance/balance payments |
| Payment risk for both sides | Escrow: advance held until job delivery, released via Edge Function or auto after N days |
| Creators juggle DMs for pricing | In-app chat with structured "quote" messages tied to bookings |
| Brand sponsorships are informal / no accountability | Campaign → Deal pipeline with contract terms, deliverables checklist, staged payments |

---

## 4. Key Flows

### 4.1 Onboarding & Auth
- Phone number + OTP (primary), Google OAuth, or magic link.
- New users choose a role: **Consumer** or **Creator** (`RoleScreen`).
- Creators go through a 5-step onboarding (`CreatorOnboard1`–`5` + review): basics, craft/discipline & sub-skills, portfolio upload, identity/KYC, socials — before their profile can be published.

### 4.2 Discovery (Consumer)
- `DiscoverScreen`: browse/search creators by discipline, city, sub-skills, languages, travel mode, gender, budget, rating, availability today.
- List or map view (`viewMode`).
- Save/favorite creators, compare up to 3 side-by-side (`CompareScreen`).

### 4.3 Creator Profile & Booking
- `CreatorDetailScreen`: portfolio, packages/services, pricing, reviews, availability calendar, "1-on-1" quick session option.
- `BookingScreen`: pick a package, date/time, location (studio/local/outstation), notes → creates a booking with `advance_amount` / `balance_amount` split (default 30% advance).
- Payment via Razorpay (order creation → signature verification → escrow hold).
- `ConfirmedScreen` → booking appears in `BookingsScreen` / `BookingDetailScreen`.

### 4.4 Creator CRM (Creator side)
- `CreatorPipelineHome` / booking tabs (`crmTab`: inquiry, upcoming, pending, completed).
- Manage inbound inquiries, send custom quotes via chat (`SEND_QUOTE`), accept/decline.
- Availability calendar management (`CalendarScreen`, `creatorAvailability`).

### 4.5 Chat
- `ChatScreen`: 1:1 threads between consumer and creator.
- Supports plain text, structured quote cards, and booking reference cards.

### 4.6 Payments & Payouts
- Escrow model: advance captured on booking confirm, balance released on completion.
- `WalletScreen`, `PayoutsScreen`, `PayoutSetupScreen` (UPI / bank account) for creators to withdraw earnings.
- Full audit trail via the `transactions` ledger (charge, escrow_hold, escrow_release, payout, refund, platform_fee).

### 4.7 Reviews & Trust
- Post-booking two-way reviews (`ReviewsScreen`), multi-category ratings (quality, communication, timeliness, value).
- Trust score recalculated server-side after reviews / completions / verification, surfaces as a badge and feeds into creator tier.

### 4.8 Sponsorships (Brand ↔ Creator)
- `SponsorshipsScreen`: browse open campaigns (posted by brands or creators looking for collabs).
- Creators apply to a campaign → creates a `Deal` (`applied` stage).
- `DealScreen`: negotiate, sign contract terms (scope, usage rights, exclusivity, revisions), track deliverables checklist, staged payments release as milestones complete.
- `SponsorComposeScreen`: post a new campaign.

### 4.9 Settings & Trust/Safety
- `SettingsScreen`, `LinkBioScreen` (public creator bio link), `SafetyScreen`, `LegalScreen`, `ReferralScreen`, `NotificationsScreen`.

---

## 5. Data Model (high level)

```
auth.users (Supabase managed)
    └── users (role: consumer | creator | both | admin)
            ├── creator_profiles ── services, availability_slots
            └── consumer_profiles
    bookings (consumer ↔ creator, via service)
            ├── payments (advance/balance/refund, escrow lifecycle)
            ├── transactions (immutable ledger)
            └── reviews
    chat_threads ── chat_messages, quotes
    campaigns (brand or creator posted) ── deals (applicant pipeline)
    favorites, notifications
```

Full schema: `@/supabase/migrations/001_schema.sql`. RLS policies restrict access so only booking parties, thread participants, and profile owners can read/write their data; payments are writable only via Edge Functions (`service_role`).

---

## 6. Monetization Hooks (present in schema, not necessarily all wired in UI)

- `platform_fee` column on bookings/transactions — commission per booking.
- `coins` balance on `users` — in-app currency/credits (referral rewards, promos).
- Creator `is_pro` flag — potential subscription/premium tier for boosted visibility.

---

## 7. Non-Functional Goals

- **Scale target**: 100,000+ users (per `SUPABASE_SETUP.md`) — achieved via composite indexes, a `creator_stats` materialized view for the discovery feed, denormalized rating/completed-job counts, and yearly partitioning of `notifications`.
- **Works without a backend**: the entire UI is navigable using local seed data (`src/data/`) when Supabase credentials are absent — useful for design review, demos, and frontend-only development.
- **Security**: Row Level Security on every table; sensitive mutations (payments, payouts, trust score) only via Edge Functions using the service role key, never directly from the client.

---

## 8. Out of Scope / Not Yet Implemented

- Several screens are intentionally stubbed (`StubScreens.tsx`) pending full backend wiring (e.g. `InboxScreen`, `MeScreen`, `FiltersScreen`, `NotificationsScreen`, `SavedScreen` may be partially static).
- Push notifications (`send-notification` Edge Function) requires FCM server key configuration.
- Auto-release of escrow after 7 days requires `pg_cron` setup (documented, not yet scheduled in this repo).

---

## 9. Glossary

| Term | Meaning |
|---|---|
| Creator | A service-providing professional user (photographer, MUA, etc.) |
| Consumer | A user booking a creator's services |
| Tier | Creator ranking: Rising → Silver → Gold → Platinum |
| Trust Score | 0–100 score reflecting verification + completed job history + reviews |
| Escrow | Payment held by the platform until job completion/delivery |
| Deal | An accepted/in-progress sponsorship arrangement between a brand and a creator, originating from a Campaign application |
| Booking Ref | Human-readable booking ID, format `FTC####` |
