-- HimalCyberX Messages RLS policies
-- Run after supabase/messages-migration.sql
--
-- Public visitors may only insert new contact messages.
-- Authenticated HCX admins may read and update messages.

CREATE POLICY "Public can send messages"
ON public.messages
FOR INSERT
TO anon
WITH CHECK (status = 'new');

CREATE POLICY "Authenticated users can read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
