-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 0004: Verified Reviews & Constraints
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID,
    creator_id UUID,
    client_id UUID,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add columns if table already existed from earlier schema
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Safely handle legacy columns (reviewer_id, reviewee_id, text) if present
DO $$ 
BEGIN 
    -- If legacy column 'text' exists, backfill 'comment' and drop not null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'text') THEN 
        UPDATE public.reviews SET comment = text WHERE comment IS NULL AND text IS NOT NULL;
        ALTER TABLE public.reviews ALTER COLUMN text DROP NOT NULL;
    END IF;

    -- If legacy column 'reviewee_id' exists, backfill 'creator_id' and drop not null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewee_id') THEN 
        UPDATE public.reviews SET creator_id = reviewee_id WHERE creator_id IS NULL AND reviewee_id IS NOT NULL;
        ALTER TABLE public.reviews ALTER COLUMN reviewee_id DROP NOT NULL;
    END IF;

    -- If legacy column 'reviewer_id' exists, backfill 'client_id' and drop not null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewer_id') THEN 
        UPDATE public.reviews SET client_id = reviewer_id WHERE client_id IS NULL AND reviewer_id IS NOT NULL;
        ALTER TABLE public.reviews ALTER COLUMN reviewer_id DROP NOT NULL;
    END IF;

    -- Ensure booking_id has unique constraint for exactly 1 review per booking
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.reviews'::regclass 
          AND contype = 'u' 
          AND conname IN ('reviews_booking_id_key', 'reviews_booking_id_unique')
    ) THEN 
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);
    END IF;
END $$;

-- 4. Sync trigger: Keep legacy and modern column names synchronized
CREATE OR REPLACE FUNCTION public.sync_reviews_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.creator_id IS NULL AND NEW.reviewee_id IS NOT NULL THEN
        NEW.creator_id := NEW.reviewee_id;
    END IF;
    IF NEW.reviewee_id IS NULL AND NEW.creator_id IS NOT NULL THEN
        NEW.reviewee_id := NEW.creator_id;
    END IF;
    IF NEW.client_id IS NULL AND NEW.reviewer_id IS NOT NULL THEN
        NEW.client_id := NEW.reviewer_id;
    END IF;
    IF NEW.reviewer_id IS NULL AND NEW.client_id IS NOT NULL THEN
        NEW.reviewer_id := NEW.client_id;
    END IF;
    IF NEW.comment IS NULL AND NEW.text IS NOT NULL THEN
        NEW.comment := NEW.text;
    END IF;
    IF NEW.text IS NULL AND NEW.comment IS NOT NULL THEN
        NEW.text := NEW.comment;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_reviews_columns ON public.reviews;
CREATE TRIGGER trg_sync_reviews_columns
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_reviews_columns();

-- 5. Ensure creator_profiles has review tracking columns
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3, 2) DEFAULT 5.0;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS completed_jobs INT DEFAULT 0;

-- 6. High-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON public.reviews(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);

-- 7. Calendar overrides columns (ensures full parity)
ALTER TABLE public.calendar_overrides ADD COLUMN IF NOT EXISTS override_type TEXT NOT NULL DEFAULT 'blocked';
ALTER TABLE public.calendar_overrides ADD COLUMN IF NOT EXISTS custom_start_time TIME;
ALTER TABLE public.calendar_overrides ADD COLUMN IF NOT EXISTS custom_end_time TIME;
