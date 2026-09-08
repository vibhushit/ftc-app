-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 007: Calendar Schedules, Overrides & Booking SLA
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. CREATOR RECURRING SCHEDULES (Weekly baseline)
CREATE TABLE IF NOT EXISTS public.creator_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '19:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (creator_id, day_of_week)
);

-- 2. CREATOR CALENDAR SETTINGS (Cadence, buffer, notice, holiday mode, iCal token)
CREATE TABLE IF NOT EXISTS public.creator_calendar_settings (
    creator_id UUID PRIMARY KEY REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    slot_step_minutes INT NOT NULL DEFAULT 60,
    buffer_minutes INT NOT NULL DEFAULT 30,
    min_notice_hours INT NOT NULL DEFAULT 24,
    holiday_mode BOOLEAN NOT NULL DEFAULT FALSE,
    calendar_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CALENDAR OVERRIDES (Blocked dates, vacations, one-off availability)
CREATE TABLE IF NOT EXISTS public.calendar_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_full_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UPDATE BOOKINGS TABLE FOR DYNAMIC TIMESTAMPTZ RANGE & 24H REQUEST SLA
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.creator_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_overrides        ENABLE ROW LEVEL SECURITY;

-- Schedules: Anyone can read; creators can manage their own
DROP POLICY IF EXISTS "schedules_select_public" ON public.creator_schedules;
CREATE POLICY "schedules_select_public" ON public.creator_schedules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "schedules_manage_own" ON public.creator_schedules;
CREATE POLICY "schedules_manage_own" ON public.creator_schedules FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Calendar Settings: Anyone can read (for slot step/buffer computation); creators manage their own
DROP POLICY IF EXISTS "calendar_settings_select_public" ON public.creator_calendar_settings;
CREATE POLICY "calendar_settings_select_public" ON public.creator_calendar_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "calendar_settings_manage_own" ON public.creator_calendar_settings;
CREATE POLICY "calendar_settings_manage_own" ON public.creator_calendar_settings FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Overrides: Anyone can read; creators manage their own
DROP POLICY IF EXISTS "overrides_select_public" ON public.calendar_overrides;
CREATE POLICY "overrides_select_public" ON public.calendar_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "overrides_manage_own" ON public.calendar_overrides;
CREATE POLICY "overrides_manage_own" ON public.calendar_overrides FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_creator_schedules_cid ON public.creator_schedules(creator_id);
CREATE INDEX IF NOT EXISTS idx_calendar_overrides_cid_dates ON public.calendar_overrides(creator_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_dates ON public.bookings(creator_id, start_time, end_time);
