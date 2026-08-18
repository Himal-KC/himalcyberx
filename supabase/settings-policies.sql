-- HimalCyberX Site Settings RLS policies
-- Run after supabase/settings-migration.sql
--
-- Public users may read site settings.
-- Authenticated HCX admins may read, insert, and update settings.

CREATE POLICY "Public can read site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
