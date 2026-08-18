-- HimalCyberX Labs RLS policies
-- Run after supabase/labs-migration.sql

-- Authenticated admin access (matches articles/categories pattern)
CREATE POLICY "Authenticated users can read all labs"
ON public.labs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert labs"
ON public.labs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update labs"
ON public.labs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete labs"
ON public.labs
FOR DELETE
TO authenticated
USING (true);

-- Public read for published labs only
CREATE POLICY "Public can read published labs"
ON public.labs
FOR SELECT
TO anon
USING (status = 'published');
