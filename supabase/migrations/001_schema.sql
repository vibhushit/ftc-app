-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Find To Connect  |  Migration 001: Full Schema
-- Target: Supabase (PostgreSQL 15+)
-- Supports: 100k+ users, multi-role (consumer + creator), escrow payments
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram search on names/bio
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- multi-column GIN indexes
CREATE EXTENSION IF NOT EXISTS "postgis";       -- lat/lng proximity queries (optional)

-- ─── ENUMs ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role        AS ENUM ('consumer', 'creator', 'both', 'admin');
CREATE TYPE creator_tier     AS ENUM ('Rising', 'Silver', 'Gold', 'Platinum');
CREATE TYPE verification_lvl AS ENUM ('none', 'phone', 'id', 'vetted');
CREATE TYPE travel_mode      AS ENUM ('studio', 'travel', 'both');
CREATE TYPE travel_radius    AS ENUM ('city', 'state', 'nation');
CREATE TYPE gender_type      AS ENUM ('male', 'female', 'non-binary', 'prefer_not_to_say');
CREATE TYPE booking_status   AS ENUM (
  'inquiry', 'pending', 'confirmed', 'active',
  'delivered', 'completed', 'cancelled', 'disputed', 'refunded'
);
CREATE TYPE location_type    AS ENUM ('studio', 'local', 'outstation');
CREATE TYPE payment_type     AS ENUM ('advance', 'balance', 'refund', 'platform_fee');
CREATE TYPE payment_status   AS ENUM ('pending', 'processing', 'escrow', 'released', 'failed', 'refunded');
CREATE TYPE txn_type         AS ENUM ('charge', 'escrow_hold', 'escrow_release', 'payout', 'refund', 'platform_fee', 'coins_credit', 'coins_debit');
CREATE TYPE notif_type       AS ENUM ('booking', 'payment', 'review', 'message', 'trust', 'verification', 'availability', 'dispute', 'quote', 'campaign');
CREATE TYPE slot_status      AS ENUM ('available', 'booked', 'blocked');
CREATE TYPE campaign_kind    AS ENUM ('brand', 'creator');
CREATE TYPE deal_stage       AS ENUM ('applied', 'contract', 'active', 'delivered', 'completed', 'rejected');
CREATE TYPE onboard_step     AS ENUM ('basics', 'craft', 'portfolio', 'identity', 'socials', 'review', 'live');

-- ─── 1. USERS  (extends auth.users 1:1) ──────────────────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  city          TEXT NOT NULL DEFAULT '',
  locality      TEXT NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'consumer',
  trust_score   SMALLINT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  coins         INTEGER NOT NULL DEFAULT 0,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  fcm_token     TEXT,                              -- for push notifications
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. CREATOR_PROFILES ──────────────────────────────────────────────────────
CREATE TABLE public.creator_profiles (
  id              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  handle          TEXT UNIQUE NOT NULL,
  tagline         TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',

  -- Craft
  discipline      TEXT NOT NULL DEFAULT '',
  sub_skills      TEXT[] NOT NULL DEFAULT '{}',
  years_exp       SMALLINT NOT NULL DEFAULT 0,
  starting_at     INTEGER NOT NULL DEFAULT 0,     -- ₹ base price
  languages       TEXT[] NOT NULL DEFAULT '{"Hindi","English"}',

  -- Location & travel
  city            TEXT NOT NULL DEFAULT '',
  area            TEXT NOT NULL DEFAULT '',
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  travel_mode     travel_mode NOT NULL DEFAULT 'studio',
  travel_radius   travel_radius NOT NULL DEFAULT 'city',

  -- Profile quality
  tier            creator_tier NOT NULL DEFAULT 'Rising',
  verification    verification_lvl NOT NULL DEFAULT 'phone',
  is_pro          BOOLEAN NOT NULL DEFAULT FALSE,
  trust_score     SMALLINT NOT NULL DEFAULT 0,

  -- Availability
  available_today BOOLEAN NOT NULL DEFAULT FALSE,
  response_time   TEXT NOT NULL DEFAULT 'Within 2 hours',
  next_slot       TEXT NOT NULL DEFAULT 'Tomorrow',
  work_days       SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6}', -- 1=Mon…7=Sun
  work_start_hour SMALLINT NOT NULL DEFAULT 9,
  work_end_hour   SMALLINT NOT NULL DEFAULT 21,
  instant_booking BOOLEAN NOT NULL DEFAULT FALSE,
  holiday_mode    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Stats (denormalised for read performance)
  completed_jobs  INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  repeat_rate     SMALLINT NOT NULL DEFAULT 0,    -- %

  -- Onboarding
  onboard_step    onboard_step NOT NULL DEFAULT 'basics',
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Portfolio / social
  portfolio_urls  TEXT[] NOT NULL DEFAULT '{}',
  ig_handle       TEXT,
  yt_handle       TEXT,
  website_url     TEXT,

  -- Payout
  upi_id          TEXT,
  bank_account    JSONB,                          -- {holder, bank, acct, ifsc}
  pan             TEXT,
  gstin           TEXT,

  gender          gender_type NOT NULL DEFAULT 'prefer_not_to_say',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. CONSUMER_PROFILES ─────────────────────────────────────────────────────
CREATE TABLE public.consumer_profiles (
  id                UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bookings_count    INTEGER NOT NULL DEFAULT 0,
  reviews_given     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. SERVICES (packages offered by creators) ───────────────────────────────
CREATE TABLE public.services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL CHECK (price > 0),        -- ₹
  duration      TEXT NOT NULL DEFAULT '2 hours',
  inclusions    TEXT[] NOT NULL DEFAULT '{}',
  revisions     SMALLINT NOT NULL DEFAULT 1,
  delivery_days SMALLINT NOT NULL DEFAULT 7,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. BOOKINGS ──────────────────────────────────────────────────────────────
CREATE TABLE public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref       TEXT UNIQUE NOT NULL,             -- FTC####
  consumer_id       UUID NOT NULL REFERENCES public.users(id),
  creator_id        UUID NOT NULL REFERENCES public.users(id),
  service_id        UUID REFERENCES public.services(id),

  status            booking_status NOT NULL DEFAULT 'inquiry',

  -- Session details
  session_date      DATE,
  session_time      TIME,
  location_type     location_type NOT NULL DEFAULT 'studio',
  location_address  TEXT,
  occasion          TEXT,
  notes             TEXT,

  -- Pricing (all ₹)
  base_price        INTEGER NOT NULL DEFAULT 0,
  travel_fee        INTEGER NOT NULL DEFAULT 0,
  accommodation_fee INTEGER NOT NULL DEFAULT 0,
  platform_fee      INTEGER NOT NULL DEFAULT 0,
  total_price       INTEGER NOT NULL DEFAULT 0,
  advance_amount    INTEGER NOT NULL DEFAULT 0,
  balance_amount    INTEGER NOT NULL DEFAULT 0,
  advance_pct       SMALLINT NOT NULL DEFAULT 30,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,

  CONSTRAINT booking_parties_differ CHECK (consumer_id <> creator_id)
);

-- auto-generate booking_ref: FTC + 4-digit random
CREATE SEQUENCE booking_ref_seq START 1000;
CREATE OR REPLACE FUNCTION generate_booking_ref() RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_ref := 'FTC' || LPAD(nextval('booking_ref_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_ref
  BEFORE INSERT ON public.bookings
  FOR EACH ROW WHEN (NEW.booking_ref IS NULL OR NEW.booking_ref = '')
  EXECUTE FUNCTION generate_booking_ref();

-- ─── 6. REVIEWS ───────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id     UUID NOT NULL REFERENCES public.users(id),
  reviewee_id     UUID NOT NULL REFERENCES public.users(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quality         SMALLINT CHECK (quality BETWEEN 1 AND 5),
  communication   SMALLINT CHECK (communication BETWEEN 1 AND 5),
  timeliness      SMALLINT CHECK (timeliness BETWEEN 1 AND 5),
  value           SMALLINT CHECK (value BETWEEN 1 AND 5),
  text            TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  photo_urls      TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (booking_id, reviewer_id)             -- one review per booking per reviewer
);

-- ─── 7. PAYMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type            payment_type NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  status          payment_status NOT NULL DEFAULT 'pending',
  payment_method  TEXT NOT NULL DEFAULT 'upi',   -- 'upi' | 'card' | 'netbanking'
  gateway_ref     TEXT,                          -- Razorpay order/payment id
  gateway_data    JSONB,                         -- full gateway response
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  released_at     TIMESTAMPTZ,
  failed_reason   TEXT
);

-- ─── 8. TRANSACTIONS (full audit ledger) ──────────────────────────────────────
CREATE TABLE public.transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES public.bookings(id),
  payment_id    UUID REFERENCES public.payments(id),
  type          txn_type NOT NULL,
  amount        INTEGER NOT NULL,                -- positive = credit, negative = debit
  from_user_id  UUID REFERENCES public.users(id),
  to_user_id    UUID REFERENCES public.users(id),
  status        TEXT NOT NULL DEFAULT 'completed',
  description   TEXT,
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. AVAILABILITY_SLOTS ────────────────────────────────────────────────────
CREATE TABLE public.availability_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  slot_date   DATE NOT NULL,
  slot_hour   SMALLINT,                  -- NULL = full day
  status      slot_status NOT NULL DEFAULT 'available',
  booking_id  UUID REFERENCES public.bookings(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (creator_id, slot_date, slot_hour)
);

-- ─── 10. NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          notif_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  action_screen TEXT,
  action_data   JSONB,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  is_urgent     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. FAVORITES ────────────────────────────────────────────────────────────
CREATE TABLE public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (consumer_id, creator_id)
);

-- ─── 12. CHAT THREADS ─────────────────────────────────────────────────────────
CREATE TABLE public.chat_threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids   UUID[] NOT NULL,              -- always 2 users
  booking_id        UUID REFERENCES public.bookings(id),
  last_message      TEXT,
  last_message_at   TIMESTAMPTZ,
  unread_counts     JSONB NOT NULL DEFAULT '{}',  -- {user_id: count}
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.users(id),
  text        TEXT,
  type        TEXT NOT NULL DEFAULT 'text',       -- 'text' | 'quote' | 'image' | 'booking'
  quote_id    UUID,                               -- FK to quotes table (if type=quote)
  image_url   TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. QUOTES ───────────────────────────────────────────────────────────────
CREATE TABLE public.quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES public.users(id),
  client_id   UUID NOT NULL REFERENCES public.users(id),
  scope       TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK (price > 0),
  delivery    TEXT NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'sent'        -- 'sent' | 'paid' | 'declined' | 'expired'
                CHECK (status IN ('sent','paid','declined','expired')),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. CAMPAIGNS (Sponsorships) ─────────────────────────────────────────────
CREATE TABLE public.campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id       UUID NOT NULL REFERENCES public.users(id),
  kind            campaign_kind NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  discipline      TEXT NOT NULL DEFAULT '',
  city            TEXT,
  budget_min      INTEGER NOT NULL DEFAULT 0,
  budget_max      INTEGER NOT NULL DEFAULT 0,
  deadline        DATE,
  hero_url        TEXT,
  applicants_count INTEGER NOT NULL DEFAULT 0,
  saves_count     INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 15. DEALS (Sponsorship deals) ────────────────────────────────────────────
CREATE TABLE public.deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES public.campaigns(id),
  brand_id        UUID NOT NULL REFERENCES public.users(id),
  creator_id      UUID NOT NULL REFERENCES public.users(id),
  quote           INTEGER NOT NULL CHECK (quote > 0),
  pitch           TEXT,
  stage           deal_stage NOT NULL DEFAULT 'applied',
  contract        JSONB,                           -- {scope, usage, exclusivity, revisions, creator_signed, brand_signed, sigs}
  deliverables    JSONB NOT NULL DEFAULT '[]',     -- [{name, done, approved}]
  payments        JSONB NOT NULL DEFAULT '[]',     -- [{name, amount, status}]
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (campaign_id, creator_id)
);

-- ─── updated_at auto-update trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated          BEFORE UPDATE ON public.users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_creator_updated        BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated       BEFORE UPDATE ON public.services        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated       BEFORE UPDATE ON public.bookings        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated      BEFORE UPDATE ON public.campaigns       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deals_updated          BEFORE UPDATE ON public.deals           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
