-- HimalCyberX message replies + spam status migration
-- Run manually in the Supabase SQL Editor after review.
--
-- Adds:
--   1. message_replies table for outbound/inbound conversation history
--   2. spam status option on messages
--
-- Prerequisites:
--   - supabase/messages-migration.sql
--   - supabase/messages-policies.sql
--   - SUPABASE_SERVICE_ROLE_KEY configured in Next.js (server-only)
--
-- RLS model (matches content_notifications):
--   - RLS enabled on message_replies
--   - NO anon/authenticated policies (default deny at database layer)
--   - Trusted Next.js server actions verify admin via getAuthenticatedServerClient()
--     (requireAdminAuth + HCX_ADMIN_EMAIL allowlist when configured)
--   - message_replies reads/writes use createServiceServerClient() only
--
-- This is stricter than the broad "authenticated" policies on public.messages.
-- Generic Supabase authenticated users cannot SELECT/INSERT/UPDATE message_replies.

-- ---------------------------------------------------------------------------
-- Optional helper for future RLS tightening on other admin tables
-- (documented in supabase/security-hardening-recommended.sql)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_hcx_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'hcx_admin',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Extend message status values
-- ---------------------------------------------------------------------------

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_status_check
  CHECK (status IN ('new', 'read', 'archived', 'spam'));

-- ---------------------------------------------------------------------------
-- Message replies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  direction text NOT NULL,
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  body text NOT NULL,
  subject text,
  resend_email_id text,
  delivery_status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT message_replies_direction_check
    CHECK (direction IN ('outbound', 'inbound')),
  CONSTRAINT message_replies_delivery_status_check
    CHECK (delivery_status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS message_replies_message_id_created_at_idx
  ON public.message_replies (message_id, created_at);

CREATE INDEX IF NOT EXISTS message_replies_delivery_status_idx
  ON public.message_replies (delivery_status);

ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS: no public or authenticated policies (service role only)
-- Same pattern as public.content_notifications.
-- ---------------------------------------------------------------------------

-- Intentionally no CREATE POLICY statements here.
-- Before using admin replies in production, set app_metadata on your admin user:
--   { "role": "hcx_admin" }
-- Application-layer enforcement still uses HCX_ADMIN_EMAIL + requireAdminAuth.
