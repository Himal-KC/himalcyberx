-- HimalCyberX Tutorials RLS policies
-- Run after supabase/tutorials-migration.sql

CREATE POLICY "Authenticated users can read all tutorials"
ON public.tutorials
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert tutorials"
ON public.tutorials
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tutorials"
ON public.tutorials
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tutorials"
ON public.tutorials
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public can read published tutorials"
ON public.tutorials
FOR SELECT
TO anon
USING (status = 'published');
