-- ─── 009_clean_creator_handles.sql ──────────────────────────────────────────
-- One-time data cleanup: strip any legacy leading '@' from creator handles
-- and add a CHECK constraint to guarantee no '@' can ever be inserted again.

-- 1. One-time cleanup for any existing rows with leading '@'
UPDATE public.creator_profiles 
SET handle = TRIM(LEADING '@' FROM handle) 
WHERE handle LIKE '@%';

-- 2. Add CHECK constraint to enforce zero-@ and valid handle format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_handle_no_at'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD CONSTRAINT check_handle_no_at
      CHECK (handle NOT LIKE '@%' AND handle ~ '^[a-zA-Z0-9._]+$');
  END IF;
END $$;

