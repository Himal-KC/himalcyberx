-- HimalCyberX V2 — Learner auth + profile foundation
-- =============================================================================
-- MANUAL DEPLOY ONLY. Review in staging before production.
--
-- Prerequisites:
--   supabase/v2-admin-rls-foundation.sql MUST already be applied (profiles table,
--   owner-only RLS, is_hcx_admin()).
--
-- This script:
--   - Auto-creates an empty profiles row for new auth users
--   - Never assigns app_metadata.role (learners stay ordinary users)
--   - Tightens username format
--   - Maintains profiles.updated_at
--
-- DOES NOT grant admin, DOES NOT weaken CMS RLS, DOES NOT store email on profiles.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Username format (lowercase letters, numbers, underscore)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format CHECK (
        username IS NULL OR username ~ '^[a-z0-9_]{3,32}$'
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row for every new auth user (no admin role, no email copy)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Inserts an empty public.profiles row for new auth.users. Does not set app_metadata or copy email.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
