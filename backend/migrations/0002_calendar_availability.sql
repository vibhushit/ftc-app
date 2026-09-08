-- 0002_calendar_availability.sql
-- Calendar, schedules, overrides, and range-based bookings schema for FTC

-- 1. CREATOR RECURRING SCHEDULES (Weekly baseline)
CREATE TABLE IF NOT EXISTS creator_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '19:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (creator_id, day_of_week)
);

-- 2. CREATOR CALENDAR SETTINGS (Cadence, buffer, notice, holiday mode, iCal token)
CREATE TABLE IF NOT EXISTS creator_calendar_settings (
    creator_id UUID PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
    slot_step_minutes INT NOT NULL DEFAULT 60, -- 30, 60, 120, etc.
    buffer_minutes INT NOT NULL DEFAULT 30,    -- 0, 15, 30, 60
    min_notice_hours INT NOT NULL DEFAULT 24,  -- 0, 24, 48
    holiday_mode BOOLEAN NOT NULL DEFAULT FALSE,
    calendar_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CALENDAR OVERRIDES (Blocked dates, vacations, one-off availability)
CREATE TABLE IF NOT EXISTS calendar_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_full_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UPDATE BOOKINGS TABLE FOR DYNAMIC TIMESTAMPTZ RANGE & 24H REQUEST SLA
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- 5. INDEXES FOR HIGH PERFORMANCE RANGE QUERIES
CREATE INDEX IF NOT EXISTS idx_creator_schedules_cid ON creator_schedules(creator_id);
CREATE INDEX IF NOT EXISTS idx_calendar_overrides_cid_dates ON calendar_overrides(creator_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_dates ON bookings(creator_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
