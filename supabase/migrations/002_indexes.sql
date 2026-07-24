-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 002: Performance Indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Optimised for 100k users, key query patterns:
--   - Creator discovery (discipline + city + tier + availability)
--   - Booking lookups by consumer and creator
--   - Notification feed by user (unread first)
--   - Full-text search on creator name / bio
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_role        ON public.users (role);
CREATE INDEX idx_users_phone       ON public.users (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_email       ON public.users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_created_at  ON public.users (created_at DESC);

-- ─── creator_profiles ─────────────────────────────────────────────────────────
-- Primary discovery query: discipline + city + tier + published
CREATE INDEX idx_creator_discovery ON public.creator_profiles
  (discipline, city, tier, is_published)
  WHERE is_published = TRUE AND holiday_mode = FALSE;

-- Price range filter
CREATE INDEX idx_creator_price     ON public.creator_profiles (starting_at)
  WHERE is_published = TRUE;

-- Availability filter
CREATE INDEX idx_creator_today     ON public.creator_profiles (available_today)
  WHERE is_published = TRUE AND available_today = TRUE;

-- Handle lookups (link-in-bio)
CREATE UNIQUE INDEX idx_creator_handle ON public.creator_profiles (LOWER(handle));

-- Trust score leaderboard
CREATE INDEX idx_creator_trust     ON public.creator_profiles (trust_score DESC)
  WHERE is_published = TRUE;

-- Avg rating sort
CREATE INDEX idx_creator_rating    ON public.creator_profiles (avg_rating DESC)
  WHERE is_published = TRUE;

-- Geo proximity (PostGIS — enable if PostGIS extension is active)
-- CREATE INDEX idx_creator_geo ON public.creator_profiles USING GIST (
--   ST_SetSRID(ST_MakePoint(lng, lat), 4326)
-- ) WHERE is_published = TRUE;

-- Full-text search: name (from users join) + bio + tagline
CREATE INDEX idx_creator_fts ON public.creator_profiles
  USING GIN (to_tsvector('english'::regconfig, bio || ' ' || tagline));

-- Trigram search for "starts-with" handle/name
CREATE INDEX idx_creator_handle_trgm ON public.creator_profiles USING GIN (handle gin_trgm_ops);

-- ─── services ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_services_creator  ON public.services (creator_id, sort_order) WHERE is_active = TRUE;
CREATE INDEX idx_services_price    ON public.services (price) WHERE is_active = TRUE;

-- ─── bookings ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_bookings_consumer  ON public.bookings (consumer_id, created_at DESC);
CREATE INDEX idx_bookings_creator   ON public.bookings (creator_id,  created_at DESC);
CREATE INDEX idx_bookings_status    ON public.bookings (status, session_date);
CREATE INDEX idx_bookings_ref       ON public.bookings (booking_ref);
CREATE INDEX idx_bookings_date      ON public.bookings (session_date) WHERE status IN ('confirmed','active');

-- ─── reviews ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_reviews_reviewee   ON public.reviews (reviewee_id, created_at DESC);
CREATE INDEX idx_reviews_reviewer   ON public.reviews (reviewer_id, created_at DESC);
CREATE INDEX idx_reviews_booking    ON public.reviews (booking_id);
CREATE INDEX idx_reviews_public     ON public.reviews (reviewee_id, rating DESC) WHERE is_public = TRUE;

-- ─── payments ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_payments_booking   ON public.payments (booking_id);
CREATE INDEX idx_payments_status    ON public.payments (status) WHERE status NOT IN ('released','refunded');

-- ─── transactions ─────────────────────────────────────────────────────────────
CREATE INDEX idx_txn_from_user  ON public.transactions (from_user_id, created_at DESC);
CREATE INDEX idx_txn_to_user    ON public.transactions (to_user_id, created_at DESC);
CREATE INDEX idx_txn_booking    ON public.transactions (booking_id);
CREATE INDEX idx_txn_type       ON public.transactions (type, created_at DESC);

-- ─── availability_slots ───────────────────────────────────────────────────────
CREATE INDEX idx_slots_creator_date ON public.availability_slots (creator_id, slot_date);
CREATE INDEX idx_slots_status       ON public.availability_slots (creator_id, status) WHERE status = 'available';

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE INDEX idx_notif_user_unread ON public.notifications (user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notif_user_all    ON public.notifications (user_id, created_at DESC);

-- ─── favorites ────────────────────────────────────────────────────────────────
CREATE INDEX idx_fav_consumer   ON public.favorites (consumer_id);
CREATE INDEX idx_fav_creator    ON public.favorites (creator_id);

-- ─── chat ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_thread_participants ON public.chat_threads USING GIN (participant_ids);
CREATE INDEX idx_thread_updated      ON public.chat_threads (last_message_at DESC NULLS LAST);
CREATE INDEX idx_messages_thread     ON public.chat_messages (thread_id, created_at DESC);
CREATE INDEX idx_messages_sender     ON public.chat_messages (sender_id);

-- ─── campaigns ────────────────────────────────────────────────────────────────
CREATE INDEX idx_campaigns_active     ON public.campaigns (created_at DESC) WHERE is_active = TRUE;
CREATE INDEX idx_campaigns_discipline ON public.campaigns (discipline) WHERE is_active = TRUE;
CREATE INDEX idx_campaigns_poster     ON public.campaigns (poster_id);

-- ─── deals ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_deals_campaign  ON public.deals (campaign_id);
CREATE INDEX idx_deals_creator   ON public.deals (creator_id, stage);
CREATE INDEX idx_deals_brand     ON public.deals (brand_id, stage);

-- ─── Materialised view: creator_stats (refreshed by trigger) ─────────────────
CREATE MATERIALIZED VIEW public.creator_stats AS
SELECT
  cp.id,
  cp.discipline,
  cp.city,
  cp.tier,
  cp.starting_at,
  cp.avg_rating,
  cp.review_count,
  cp.completed_jobs,
  cp.trust_score,
  cp.is_published,
  cp.available_today,
  u.name,
  u.avatar_url
FROM public.creator_profiles cp
JOIN public.users u ON u.id = cp.id
WHERE cp.is_published = TRUE;

CREATE UNIQUE INDEX idx_creator_stats_id ON public.creator_stats (id);
CREATE INDEX idx_creator_stats_disc_city ON public.creator_stats (discipline, city);
