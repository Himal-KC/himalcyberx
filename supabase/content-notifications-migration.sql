-- HimalCyberX content notification records (Stage 2B)
-- Run manually in the Supabase SQL Editor after review.
--
-- Tracks one-time "published" notification broadcasts per content item.
-- Server-side service role writes via trusted Next.js actions only.

CREATE TABLE IF NOT EXISTS public.content_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  notification_type text NOT NULL DEFAULT 'published',
  status text NOT NULL DEFAULT 'pending',
  attempted_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_notifications_content_type_check
    CHECK (content_type IN ('article', 'lab', 'tutorial')),
  CONSTRAINT content_notifications_notification_type_check
    CHECK (notification_type IN ('published')),
  CONSTRAINT content_notifications_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'partial', 'failed')),
  CONSTRAINT content_notifications_attempted_count_check
    CHECK (attempted_count >= 0),
  CONSTRAINT content_notifications_sent_count_check
    CHECK (sent_count >= 0),
  CONSTRAINT content_notifications_failed_count_check
    CHECK (failed_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS content_notifications_unique_broadcast
  ON public.content_notifications (content_type, content_id, notification_type);

CREATE INDEX IF NOT EXISTS content_notifications_status_idx
  ON public.content_notifications (status);

CREATE INDEX IF NOT EXISTS content_notifications_sent_at_idx
  ON public.content_notifications (sent_at);

ALTER TABLE public.content_notifications ENABLE ROW LEVEL SECURITY;

-- No public or authenticated policies: access is via server-only service role only.
