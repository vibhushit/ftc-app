-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 008: Booking Completion OTP Columns & Lockout
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completion_otp_hash TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS last_otp_attempt_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_generation_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS last_otp_generated_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS creator_locked_until TIMESTAMPTZ;
