-- HimalCyberX V2 — Saved content / bookmarks
-- =============================================================================
-- MANUAL DEPLOY ONLY. Do NOT apply automatically. Do NOT run against production
-- from application code or CI.
--
-- Review in staging after Task A (admin RLS) is present.
-- Depends on: public.articles, public.tutorials, public.labs, auth.users
-- Does not modify: profiles, learning_progress, admin CMS policies, agent,
-- notifications, publishing, or email.
-- =============================================================================

-- Exclusive-arc design (not polymorphic content_type/content_id):
-- one nullable FK per content table, CHECK that exactly one is set.
-- Real foreign keys reject forged IDs; ON DELETE CASCADE removes stale saves.

CREATE TABLE IF NOT EXISTS public.saved_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id uuid NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  tutorial_id uuid NULL REFERENCES public.tutorials (id) ON DELETE CASCADE,
  lab_id uuid NULL REFERENCES public.labs (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_content_one_target CHECK (
    (article_id IS NOT NULL)::int
    + (tutorial_id IS NOT NULL)::int
    + (lab_id IS NOT NULL)::int
    = 1
  )
);

COMMENT ON TABLE public.saved_content IS
  'Learner bookmarks. Owner-only RLS. Exclusive-arc FKs to articles, tutorials, and labs.';

CREATE UNIQUE INDEX IF NOT EXISTS saved_content_user_article_uidx
  ON public.saved_content (user_id, article_id)
  WHERE article_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS saved_content_user_tutorial_uidx
  ON public.saved_content (user_id, tutorial_id)
  WHERE tutorial_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS saved_content_user_lab_uidx
  ON public.saved_content (user_id, lab_id)
  WHERE lab_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS saved_content_user_created_idx
  ON public.saved_content (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Reject unpublished / missing targets even when a UUID exists as a draft.
-- FK existence checks do not consider RLS; this trigger closes that gap.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.saved_content_require_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.article_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.articles
      WHERE id = NEW.article_id
        AND status = 'published'
        AND (published_at IS NULL OR published_at <= now())
    ) THEN
      RAISE EXCEPTION 'saved_content_unpublished_or_missing'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.tutorial_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.tutorials
      WHERE id = NEW.tutorial_id
        AND status = 'published'
        AND (published_at IS NULL OR published_at <= now())
    ) THEN
      RAISE EXCEPTION 'saved_content_unpublished_or_missing'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.lab_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.labs
      WHERE id = NEW.lab_id
        AND status = 'published'
        AND (published_at IS NULL OR published_at <= now())
    ) THEN
      RAISE EXCEPTION 'saved_content_unpublished_or_missing'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.saved_content_require_published() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.saved_content_require_published() FROM anon;
REVOKE ALL ON FUNCTION public.saved_content_require_published() FROM authenticated;

DROP TRIGGER IF EXISTS saved_content_require_published_trg ON public.saved_content;
CREATE TRIGGER saved_content_require_published_trg
BEFORE INSERT ON public.saved_content
FOR EACH ROW
EXECUTE FUNCTION public.saved_content_require_published();

-- ---------------------------------------------------------------------------
-- Grants: authenticated read/create/delete own rows only. No anon writes.
-- No UPDATE. Admins do not get unrestricted access (no is_hcx_admin policies).
-- ---------------------------------------------------------------------------

ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.saved_content FROM PUBLIC;
REVOKE ALL ON TABLE public.saved_content FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_content TO authenticated;

DROP POLICY IF EXISTS "Users can read own saved content" ON public.saved_content;
CREATE POLICY "Users can read own saved content"
ON public.saved_content
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved content" ON public.saved_content;
CREATE POLICY "Users can insert own saved content"
ON public.saved_content
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved content" ON public.saved_content;
CREATE POLICY "Users can delete own saved content"
ON public.saved_content
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
