-- HimalCyberX Subscribers migration
-- Run manually in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'website',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_key ON public.subscribers (lower(email));

ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_status_check;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_status_check
  CHECK (status IN ('active', 'unsubscribed'));

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
