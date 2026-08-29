-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 006: Safe Email Existence Check RPC
-- Allows anonymous frontend auth screens (signup & forgot password) to verify
-- if an email is already registered in auth.users without exposing full user data.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  IF lookup_email IS NULL OR TRIM(lookup_email) = '' THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  ) INTO user_exists;

  RETURN user_exists;
END;
$$;

-- Grant execution permissions to anonymous & authenticated roles
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated, service_role;
