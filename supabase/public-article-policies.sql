-- HimalCyberX public article read policies
-- Run manually in the Supabase SQL editor. Do NOT disable RLS.
--
-- REVIEW REQUIRED: This grants anonymous (public) visitors read-only access to
-- published articles only. Draft and archived rows remain hidden from anon.
-- Do NOT add anon INSERT, UPDATE, or DELETE policies.

CREATE POLICY "Public can read categories"
ON public.categories
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can read published articles"
ON public.articles
FOR SELECT
TO anon
USING (status = 'published');
