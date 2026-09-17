-- HimalCyberX V2 — Admin RLS + role security foundation
-- =============================================================================
-- MANUAL DEPLOY ONLY. Review in staging before production.
--
-- DEPLOYMENT ORDER (required):
--   1. Assign app_metadata.role = "hcx_admin" to existing admin user(s) FIRST
--      (see final runbook / v2-admin-role-setup.sql comments).
--   2. Run this script in the Supabase SQL editor.
--   3. Verify HCX Admin login + one CMS operation + public site read + forms.
--
-- DO NOT enable public learner signup until this script is applied and verified.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Admin role helper (JWT app_metadata.role = hcx_admin)
-- Clients cannot set app_metadata; only service role / Auth admin API can.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_hcx_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'hcx_admin',
    false
  );
$$;

COMMENT ON FUNCTION public.is_hcx_admin() IS
  'True when the current JWT carries app_metadata.role = hcx_admin.';

-- ---------------------------------------------------------------------------
-- Profiles (V2 foundation — owner-only RLS, no email column)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NULL,
  username text NULL,
  avatar_url text NULL,
  bio text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_length CHECK (
    username IS NULL OR char_length(username) BETWEEN 3 AND 32
  ),
  CONSTRAINT profiles_display_name_length CHECK (
    display_name IS NULL OR char_length(display_name) <= 80
  ),
  CONSTRAINT profiles_bio_length CHECK (
    bio IS NULL OR char_length(bio) <= 500
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

DROP POLICY IF EXISTS "HCX admin can read categories" ON public.categories;
CREATE POLICY "HCX admin can read categories"
ON public.categories FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read categories for learners" ON public.categories;
CREATE POLICY "Authenticated users can read categories for learners"
ON public.categories FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "HCX admin can insert categories" ON public.categories;
CREATE POLICY "HCX admin can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update categories" ON public.categories;
CREATE POLICY "HCX admin can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete categories" ON public.categories;
CREATE POLICY "HCX admin can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read all articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.articles;

DROP POLICY IF EXISTS "HCX admin can read all articles" ON public.articles;
CREATE POLICY "HCX admin can read all articles"
ON public.articles FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read published articles" ON public.articles;
CREATE POLICY "Authenticated users can read published articles"
ON public.articles FOR SELECT TO authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "HCX admin can insert articles" ON public.articles;
CREATE POLICY "HCX admin can insert articles"
ON public.articles FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update articles" ON public.articles;
CREATE POLICY "HCX admin can update articles"
ON public.articles FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete articles" ON public.articles;
CREATE POLICY "HCX admin can delete articles"
ON public.articles FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Tutorials
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read all tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Authenticated users can insert tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Authenticated users can update tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Authenticated users can delete tutorials" ON public.tutorials;

DROP POLICY IF EXISTS "HCX admin can read all tutorials" ON public.tutorials;
CREATE POLICY "HCX admin can read all tutorials"
ON public.tutorials FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read published tutorials" ON public.tutorials;
CREATE POLICY "Authenticated users can read published tutorials"
ON public.tutorials FOR SELECT TO authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "HCX admin can insert tutorials" ON public.tutorials;
CREATE POLICY "HCX admin can insert tutorials"
ON public.tutorials FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update tutorials" ON public.tutorials;
CREATE POLICY "HCX admin can update tutorials"
ON public.tutorials FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete tutorials" ON public.tutorials;
CREATE POLICY "HCX admin can delete tutorials"
ON public.tutorials FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Labs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read all labs" ON public.labs;
DROP POLICY IF EXISTS "Authenticated users can insert labs" ON public.labs;
DROP POLICY IF EXISTS "Authenticated users can update labs" ON public.labs;
DROP POLICY IF EXISTS "Authenticated users can delete labs" ON public.labs;

DROP POLICY IF EXISTS "HCX admin can read all labs" ON public.labs;
CREATE POLICY "HCX admin can read all labs"
ON public.labs FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read published labs" ON public.labs;
CREATE POLICY "Authenticated users can read published labs"
ON public.labs FOR SELECT TO authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "HCX admin can insert labs" ON public.labs;
CREATE POLICY "HCX admin can insert labs"
ON public.labs FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update labs" ON public.labs;
CREATE POLICY "HCX admin can update labs"
ON public.labs FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete labs" ON public.labs;
CREATE POLICY "HCX admin can delete labs"
ON public.labs FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Subscribers (keep public subscribe; admin manage only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can delete subscribers" ON public.subscribers;

DROP POLICY IF EXISTS "HCX admin can read subscribers" ON public.subscribers;
CREATE POLICY "HCX admin can read subscribers"
ON public.subscribers FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can insert subscribers" ON public.subscribers;
CREATE POLICY "HCX admin can insert subscribers"
ON public.subscribers FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update subscribers" ON public.subscribers;
CREATE POLICY "HCX admin can update subscribers"
ON public.subscribers FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete subscribers" ON public.subscribers;
CREATE POLICY "HCX admin can delete subscribers"
ON public.subscribers FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Messages (keep public send; admin read/update only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.messages;

DROP POLICY IF EXISTS "HCX admin can read messages" ON public.messages;
CREATE POLICY "HCX admin can read messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update messages" ON public.messages;
CREATE POLICY "HCX admin can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Site settings (keep public read; admin insert/update only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON public.site_settings;

DROP POLICY IF EXISTS "HCX admin can insert site settings" ON public.site_settings;
CREATE POLICY "HCX admin can insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update site settings" ON public.site_settings;
CREATE POLICY "HCX admin can update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- HCX Agent tables
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Authenticated users can insert agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Authenticated users can update agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Authenticated users can delete agent runs" ON public.agent_runs;

DROP POLICY IF EXISTS "HCX admin can read agent runs" ON public.agent_runs;
CREATE POLICY "HCX admin can read agent runs"
ON public.agent_runs FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can insert agent runs" ON public.agent_runs;
CREATE POLICY "HCX admin can insert agent runs"
ON public.agent_runs FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update agent runs" ON public.agent_runs;
CREATE POLICY "HCX admin can update agent runs"
ON public.agent_runs FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete agent runs" ON public.agent_runs;
CREATE POLICY "HCX admin can delete agent runs"
ON public.agent_runs FOR DELETE TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read agent sources" ON public.agent_sources;
DROP POLICY IF EXISTS "Authenticated users can insert agent sources" ON public.agent_sources;
DROP POLICY IF EXISTS "Authenticated users can update agent sources" ON public.agent_sources;
DROP POLICY IF EXISTS "Authenticated users can delete agent sources" ON public.agent_sources;

DROP POLICY IF EXISTS "HCX admin can read agent sources" ON public.agent_sources;
CREATE POLICY "HCX admin can read agent sources"
ON public.agent_sources FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can insert agent sources" ON public.agent_sources;
CREATE POLICY "HCX admin can insert agent sources"
ON public.agent_sources FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update agent sources" ON public.agent_sources;
CREATE POLICY "HCX admin can update agent sources"
ON public.agent_sources FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete agent sources" ON public.agent_sources;
CREATE POLICY "HCX admin can delete agent sources"
ON public.agent_sources FOR DELETE TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "Authenticated users can read agent reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert agent reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Authenticated users can update agent reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete agent reviews" ON public.agent_reviews;

DROP POLICY IF EXISTS "HCX admin can read agent reviews" ON public.agent_reviews;
CREATE POLICY "HCX admin can read agent reviews"
ON public.agent_reviews FOR SELECT TO authenticated
USING (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can insert agent reviews" ON public.agent_reviews;
CREATE POLICY "HCX admin can insert agent reviews"
ON public.agent_reviews FOR INSERT TO authenticated
WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can update agent reviews" ON public.agent_reviews;
CREATE POLICY "HCX admin can update agent reviews"
ON public.agent_reviews FOR UPDATE TO authenticated
USING (public.is_hcx_admin()) WITH CHECK (public.is_hcx_admin());

DROP POLICY IF EXISTS "HCX admin can delete agent reviews" ON public.agent_reviews;
CREATE POLICY "HCX admin can delete agent reviews"
ON public.agent_reviews FOR DELETE TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Storage: article-images bucket (admin write/delete only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete article images" ON storage.objects;

DROP POLICY IF EXISTS "HCX admin can upload article images" ON storage.objects;
CREATE POLICY "HCX admin can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] IN ('articles', 'labs', 'tutorials')
  AND public.is_hcx_admin()
);

DROP POLICY IF EXISTS "HCX admin can delete article images" ON storage.objects;
CREATE POLICY "HCX admin can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] IN ('articles', 'labs', 'tutorials')
  AND public.is_hcx_admin()
);

-- content_notifications, message_replies: intentionally unchanged (service role only)
