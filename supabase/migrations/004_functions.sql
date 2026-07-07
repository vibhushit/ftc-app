-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 004: Database Functions & Triggers
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. AUTO-PROVISION user row on auth.users insert ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  -- Extract from metadata (Google OAuth / phone OTP)
  v_name  := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  v_email := NEW.email;
  v_phone := NEW.phone;

  INSERT INTO public.users (id, name, email, phone, role)
  VALUES (NEW.id, v_name, v_email, v_phone, 'consumer')
  ON CONFLICT (id) DO NOTHING;

  -- Also create consumer profile stub
  INSERT INTO public.consumer_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. UPDATE creator stats after a review is inserted ──────────────────────
CREATE OR REPLACE FUNCTION public.update_creator_stats_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.creator_profiles
  SET
    avg_rating   = (SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id AND is_public = TRUE),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id AND is_public = TRUE)
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_creator_stats
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_stats_on_review();

-- ─── 3. UPDATE completed_jobs when booking is completed ──────────────────────
CREATE OR REPLACE FUNCTION public.update_completed_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.creator_profiles
    SET completed_jobs = completed_jobs + 1
    WHERE id = NEW.creator_id;

    UPDATE public.consumer_profiles
    SET bookings_count = bookings_count + 1
    WHERE id = NEW.consumer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_completed_jobs
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_completed_jobs();

-- ─── 4. TRUST SCORE recalculation ────────────────────────────────────────────
-- Score components (max 100):
--   Phone verified:     +10
--   ID verified:        +20
--   Vetted:             +10 (on top of ID)
--   First booking:      +10
--   Each 5 bookings:    +5  (max +20)
--   Avg rating ≥ 4.5:   +15
--   Avg rating ≥ 4.0:   +10
--   Reviews ≥ 10:       +10
--   No disputes:        +5

CREATE OR REPLACE FUNCTION public.recalculate_trust_score(p_user_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score SMALLINT := 0;
  v_cp    public.creator_profiles%ROWTYPE;
  v_user  public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  SELECT * INTO v_cp   FROM public.creator_profiles WHERE id = p_user_id;

  -- Verification bonus
  IF v_cp.verification = 'phone'  THEN v_score := v_score + 10; END IF;
  IF v_cp.verification = 'id'     THEN v_score := v_score + 30; END IF;
  IF v_cp.verification = 'vetted' THEN v_score := v_score + 40; END IF;

  -- Booking bonus (max 20)
  v_score := v_score + LEAST(20, (v_cp.completed_jobs / 5) * 5);

  -- Rating bonus
  IF v_cp.avg_rating >= 4.5 THEN v_score := v_score + 15;
  ELSIF v_cp.avg_rating >= 4.0 THEN v_score := v_score + 10;
  ELSIF v_cp.avg_rating >= 3.5 THEN v_score := v_score + 5;
  END IF;

  -- Review count bonus
  IF v_cp.review_count >= 10 THEN v_score := v_score + 10;
  ELSIF v_cp.review_count >= 3 THEN v_score := v_score + 5;
  END IF;

  -- No disputes bonus
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE creator_id = p_user_id AND status = 'disputed'
  ) THEN
    v_score := v_score + 5;
  END IF;

  v_score := LEAST(100, GREATEST(0, v_score));

  -- Update both tables
  UPDATE public.creator_profiles SET trust_score = v_score WHERE id = p_user_id;
  UPDATE public.users             SET trust_score = v_score WHERE id = p_user_id;

  RETURN v_score;
END;
$$;

-- ─── 5. AUTO-REFRESH creator_stats materialized view ─────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_creator_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.creator_stats;
  RETURN NULL;
END;
$$;

-- Refresh after any creator profile update (debounced via pg_cron in prod)
CREATE TRIGGER trg_refresh_creator_stats
  AFTER INSERT OR UPDATE ON public.creator_profiles
  FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_creator_stats();

-- ─── 6. NOTIFICATION helpers ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id     UUID,
  p_type        notif_type,
  p_title       TEXT,
  p_body        TEXT,
  p_screen      TEXT DEFAULT NULL,
  p_data        JSONB DEFAULT NULL,
  p_urgent      BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, action_screen, action_data, is_urgent)
  VALUES (p_user_id, p_type, p_title, p_body, p_screen, p_data, p_urgent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 7. BOOKING status change → auto notify both parties ────────────────────
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_name TEXT;
  v_consumer_name TEXT;
BEGIN
  SELECT name INTO v_creator_name  FROM public.users WHERE id = NEW.creator_id;
  SELECT name INTO v_consumer_name FROM public.users WHERE id = NEW.consumer_id;

  IF NEW.status = 'confirmed' AND OLD.status = 'inquiry' THEN
    PERFORM public.create_notification(NEW.consumer_id, 'booking',
      'Booking confirmed',
      v_creator_name || ' accepted your request — ' || COALESCE(NEW.session_date::TEXT, 'date TBD'),
      'bookingDetail', jsonb_build_object('booking_id', NEW.id));

    PERFORM public.create_notification(NEW.creator_id, 'booking',
      'New booking — ' || v_consumer_name,
      'Session scheduled for ' || COALESCE(NEW.session_date::TEXT, 'TBD') || ' · ₹' || NEW.advance_amount || ' advance incoming.',
      'bookingDetail', jsonb_build_object('booking_id', NEW.id));

  ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    PERFORM public.create_notification(NEW.consumer_id, 'review',
      'Leave a review',
      'How was your session with ' || v_creator_name || '? It takes 30 seconds.',
      'reviews', jsonb_build_object('booking_id', NEW.id));

    PERFORM public.create_notification(NEW.creator_id, 'payment',
      'Payment released',
      '₹' || NEW.balance_amount || ' released from escrow to your account.',
      'payouts', jsonb_build_object('booking_id', NEW.id));

  ELSIF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    PERFORM public.create_notification(NEW.consumer_id, 'booking',
      'Booking cancelled',
      'Your booking with ' || v_creator_name || ' (#' || NEW.booking_ref || ') was cancelled.',
      'bookings', jsonb_build_object('booking_id', NEW.id));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();

-- ─── 8. COINS reward on first completed booking ──────────────────────────────
CREATE OR REPLACE FUNCTION public.award_coins_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Award 1% of booking value as coins (1 coin = ₹0.10)
    UPDATE public.users
    SET coins = coins + (NEW.total_price / 100)
    WHERE id = NEW.consumer_id;

    INSERT INTO public.transactions (booking_id, type, amount, to_user_id, description)
    VALUES (NEW.id, 'coins_credit', NEW.total_price / 100, NEW.consumer_id,
            'FTC Coins on booking #' || NEW.booking_ref);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_coins
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.award_coins_on_booking();

-- ─── 9. CAMPAIGN applicants_count update ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_campaign_applicants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.campaigns
  SET applicants_count = (SELECT COUNT(*) FROM public.deals WHERE campaign_id = NEW.campaign_id)
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_applicants
  AFTER INSERT OR DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_applicants();

-- ─── 10. Search function: creators ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_creators(
  p_query      TEXT DEFAULT NULL,
  p_discipline TEXT DEFAULT NULL,
  p_city       TEXT DEFAULT NULL,
  p_min_price  INTEGER DEFAULT NULL,
  p_max_price  INTEGER DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_available  BOOLEAN DEFAULT NULL,
  p_limit      INTEGER DEFAULT 20,
  p_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  handle          TEXT,
  avatar_url      TEXT,
  discipline      TEXT,
  city            TEXT,
  area            TEXT,
  starting_at     INTEGER,
  avg_rating      NUMERIC,
  review_count    INTEGER,
  completed_jobs  INTEGER,
  tier            creator_tier,
  trust_score     SMALLINT,
  available_today BOOLEAN,
  verification    verification_lvl,
  rank            REAL
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    u.name,
    cp.handle,
    u.avatar_url,
    cp.discipline,
    cp.city,
    cp.area,
    cp.starting_at,
    cp.avg_rating,
    cp.review_count,
    cp.completed_jobs,
    cp.tier,
    cp.trust_score,
    cp.available_today,
    cp.verification,
    CASE WHEN p_query IS NOT NULL
      THEN ts_rank(
        to_tsvector('english', cp.bio || ' ' || cp.tagline || ' ' || u.name),
        plainto_tsquery('english', p_query)
      )
      ELSE 1.0
    END AS rank
  FROM public.creator_profiles cp
  JOIN public.users u ON u.id = cp.id
  WHERE
    cp.is_published  = TRUE
    AND cp.holiday_mode = FALSE
    AND (p_discipline IS NULL OR cp.discipline = p_discipline)
    AND (p_city       IS NULL OR cp.city ILIKE '%' || p_city || '%')
    AND (p_min_price  IS NULL OR cp.starting_at >= p_min_price)
    AND (p_max_price  IS NULL OR cp.starting_at <= p_max_price)
    AND (p_min_rating IS NULL OR cp.avg_rating >= p_min_rating)
    AND (p_available  IS NULL OR cp.available_today = p_available)
    AND (
      p_query IS NULL
      OR to_tsvector('english', cp.bio || ' ' || cp.tagline || ' ' || u.name)
           @@ plainto_tsquery('english', p_query)
      OR cp.handle ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE WHEN p_query IS NOT NULL THEN ts_rank(
      to_tsvector('english', cp.bio || ' ' || cp.tagline || ' ' || u.name),
      plainto_tsquery('english', p_query)
    ) END DESC NULLS LAST,
    cp.trust_score DESC,
    cp.avg_rating DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;
