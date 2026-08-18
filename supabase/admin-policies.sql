-- HimalCyberX admin RLS policies
-- Run manually in the Supabase SQL editor. Do NOT disable RLS.
--
-- REVIEW REQUIRED: Read each policy below before executing. These grant
-- authenticated Supabase users broad access to admin tables. Replace with
-- role-based policies (e.g. app_metadata.role = 'admin') before production.
--
-- TODO: Replace broad authenticated-user access with role-based policies
-- (e.g. app_metadata.role = 'admin' or an admin_profiles table) before
-- allowing multiple user accounts into the admin portal.

-- ---------------------------------------------------------------------------
-- Categories (admin CRUD for authenticated users at this stage)
-- ---------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- Articles (full admin CRUD for authenticated users at this stage)
-- ---------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read all articles"
ON public.articles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
ON public.articles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
ON public.articles
FOR DELETE
TO authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- Public read access (published articles only)
-- Apply when the public site reads from Supabase instead of local data.
-- ---------------------------------------------------------------------------

-- CREATE POLICY "Public can read published articles"
-- ON public.articles
-- FOR SELECT
-- TO anon
-- USING (status = 'published');

-- ---------------------------------------------------------------------------
-- Required columns (if not already present)
-- ---------------------------------------------------------------------------

-- ALTER TABLE public.articles
--   ADD COLUMN IF NOT EXISTS content text,
--   ADD COLUMN IF NOT EXISTS featured_image text;

-- Ensure status supports archived values:
-- ALTER TABLE public.articles
--   DROP CONSTRAINT IF EXISTS articles_status_check;
--
-- ALTER TABLE public.articles
--   ADD CONSTRAINT articles_status_check
--   CHECK (status IN ('draft', 'published', 'archived'));
