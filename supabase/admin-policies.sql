-- HimalCyberX admin RLS policies
-- Run manually in the Supabase SQL editor. Do NOT disable RLS.
--
-- IMPORTANT: For production hardening, prefer the idempotent bundle:
--   supabase/v2-admin-rls-foundation.sql
-- (requires app_metadata.role = hcx_admin on admin users — see v2-admin-role-setup.sql)
--
-- Fresh installs: run is_hcx_admin() creation from v2-admin-rls-foundation.sql FIRST,
-- then apply the HCX admin policies below (or run the full v2 bundle).

-- ---------------------------------------------------------------------------
-- Categories (admin CRUD; public/learner SELECT via public-article-policies + v2 learner read)
-- ---------------------------------------------------------------------------

CREATE POLICY "HCX admin can read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (public.is_hcx_admin());

CREATE POLICY "HCX admin can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_hcx_admin());

CREATE POLICY "HCX admin can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_hcx_admin())
WITH CHECK (public.is_hcx_admin());

CREATE POLICY "HCX admin can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_hcx_admin());

-- ---------------------------------------------------------------------------
-- Articles (admin CRUD — public anon read in public-article-policies.sql)
-- ---------------------------------------------------------------------------

CREATE POLICY "HCX admin can read all articles"
ON public.articles
FOR SELECT
TO authenticated
USING (public.is_hcx_admin());

CREATE POLICY "HCX admin can insert articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (public.is_hcx_admin());

CREATE POLICY "HCX admin can update articles"
ON public.articles
FOR UPDATE
TO authenticated
USING (public.is_hcx_admin())
WITH CHECK (public.is_hcx_admin());

CREATE POLICY "HCX admin can delete articles"
ON public.articles
FOR DELETE
TO authenticated
USING (public.is_hcx_admin());
