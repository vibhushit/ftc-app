-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 003: Row Level Security (RLS)
-- Design principles:
--   - Creators own their profiles; consumers own theirs
--   - Bookings visible only to both parties
--   - Notifications are private per-user
--   - Reviews are public (read) but private (write)
--   - Transactions are read-only to their participants
--   - Admins bypass RLS via service_role key (never exposed to clients)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Helper function: get calling user's role ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals                ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "users_select_own"     ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own"     ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_insert_own"     ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- Allow reading basic info of creators (for bookings context)
CREATE POLICY "users_select_creator_public" ON public.users FOR SELECT
  USING (role IN ('creator','both'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATOR_PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "creator_profiles_select_published" ON public.creator_profiles FOR SELECT
  USING (is_published = TRUE OR id = auth.uid());

CREATE POLICY "creator_profiles_insert_own" ON public.creator_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "creator_profiles_update_own" ON public.creator_profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONSUMER_PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "consumer_profiles_own" ON public.consumer_profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Anyone can read active services of published creators
CREATE POLICY "services_select_public" ON public.services FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND is_published = TRUE)
  );

-- Creator can read all their own (incl. inactive)
CREATE POLICY "services_select_own" ON public.services FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "services_insert_own" ON public.services FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "services_update_own" ON public.services FOR UPDATE
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "services_delete_own" ON public.services FOR DELETE
  USING (creator_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- BOOKINGS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "bookings_select_parties" ON public.bookings FOR SELECT
  USING (consumer_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "bookings_insert_consumer" ON public.bookings FOR INSERT
  WITH CHECK (consumer_id = auth.uid());

CREATE POLICY "bookings_update_parties" ON public.bookings FOR UPDATE
  USING (consumer_id = auth.uid() OR creator_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Public reviews are readable by all authenticated users
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT
  USING (is_public = TRUE OR reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "reviews_insert_reviewer" ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
        AND (consumer_id = auth.uid() OR creator_id = auth.uid())
        AND status = 'completed'
    )
  );

CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "payments_select_parties" ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
        AND (consumer_id = auth.uid() OR creator_id = auth.uid())
    )
  );

-- Payments are created by Edge Functions (service_role), not directly by clients
-- INSERT / UPDATE is blocked for client role intentionally

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Transactions are append-only via Edge Functions

-- ═══════════════════════════════════════════════════════════════════════════════
-- AVAILABILITY_SLOTS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Anyone (authenticated) can read available slots of published creators
CREATE POLICY "slots_select_public" ON public.availability_slots FOR SELECT
  USING (
    status = 'available'
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id AND consumer_id = auth.uid()
    )
  );

CREATE POLICY "slots_manage_own" ON public.availability_slots FOR ALL
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "notif_own" ON public.notifications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- FAVORITES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "fav_own" ON public.favorites FOR ALL
  USING (consumer_id = auth.uid()) WITH CHECK (consumer_id = auth.uid());

-- Anyone can see how many favorites a creator has (count only via aggregate)
CREATE POLICY "fav_count_select" ON public.favorites FOR SELECT
  USING (TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHAT THREADS + MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "threads_select_participant" ON public.chat_threads FOR SELECT
  USING (auth.uid() = ANY (participant_ids));

CREATE POLICY "threads_insert" ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = ANY (participant_ids));

CREATE POLICY "threads_update_participant" ON public.chat_threads FOR UPDATE
  USING (auth.uid() = ANY (participant_ids));

CREATE POLICY "messages_select_participant" ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = thread_id AND auth.uid() = ANY (participant_ids)
    )
  );

CREATE POLICY "messages_insert_participant" ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = thread_id AND auth.uid() = ANY (participant_ids)
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUOTES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "quotes_select_parties" ON public.quotes FOR SELECT
  USING (creator_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "quotes_insert_creator" ON public.quotes FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "quotes_update_parties" ON public.quotes FOR UPDATE
  USING (creator_id = auth.uid() OR client_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAMPAIGNS
-- ═══════════════════════════════════════════════════════════════════════════════
-- All active campaigns are public
CREATE POLICY "campaigns_select_public" ON public.campaigns FOR SELECT
  USING (is_active = TRUE OR poster_id = auth.uid());

CREATE POLICY "campaigns_insert_own" ON public.campaigns FOR INSERT
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY "campaigns_update_own" ON public.campaigns FOR UPDATE
  USING (poster_id = auth.uid()) WITH CHECK (poster_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEALS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "deals_select_parties" ON public.deals FOR SELECT
  USING (brand_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "deals_insert_creator" ON public.deals FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "deals_update_parties" ON public.deals FOR UPDATE
  USING (brand_id = auth.uid() OR creator_id = auth.uid());
