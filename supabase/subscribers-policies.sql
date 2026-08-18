-- HimalCyberX Subscribers RLS policies
-- Run after supabase/subscribers-migration.sql
--
-- Public visitors may only insert new subscriptions.
-- Authenticated HCX admins may manage subscribers.

CREATE POLICY "Public can subscribe"
ON public.subscribers
FOR INSERT
TO anon
WITH CHECK (
  status = 'active'
  AND source IN ('website', 'newsletter', 'modal')
);

CREATE POLICY "Authenticated users can read subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert subscribers"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update subscribers"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subscribers"
ON public.subscribers
FOR DELETE
TO authenticated
USING (true);
