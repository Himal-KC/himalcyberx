-- HimalCyberX V2 — Learning progress + continue-learning foundation
-- =============================================================================
-- MANUAL DEPLOY ONLY. Do NOT apply automatically. Do NOT run against production
-- from application code or CI.
--
-- Review in staging after Task A (admin RLS) is present.
-- Depends on: public.tutorials, public.labs, auth.users
-- Does not modify: profiles, saved_content, admin CMS policies, agent,
-- notifications, publishing, or email.
--
-- Articles are intentionally excluded. Bookmarks (Task C) cover saved articles.
--
-- Future (do not implement in this script):
--   learning paths, XP, achievements, quizzes, skills, completion certificates
--   can attach to user_id + these completion rows without rewriting this table.
-- =============================================================================

-- Exclusive-arc design (not a weak polymorphic content_type/content_id pair):
-- one nullable FK per learnable table, CHECK that exactly one is set.
-- Real foreign keys reject forged IDs; ON DELETE CASCADE removes stale progress.

CREATE TABLE IF NOT EXISTS public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  tutorial_id uuid NULL REFERENCES public.tutorials (id) ON DELETE CASCADE,
  lab_id uuid NULL REFERENCES public.labs (id) ON DELETE CASCADE,
  content_type text GENERATED ALWAYS AS (
    CASE
      WHEN tutorial_id IS NOT NULL THEN 'tutorial'
      WHEN lab_id IS NOT NULL THEN 'lab'
      ELSE NULL
    END
  ) STORED,
  status text NOT NULL DEFAULT 'in_progress',
  progress_percent smallint NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learning_progress_one_target CHECK (
    (tutorial_id IS NOT NULL)::int + (lab_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT learning_progress_status_check CHECK (
    status IN ('not_started', 'in_progress', 'completed')
  ),
  CONSTRAINT learning_progress_percent_check CHECK (
    progress_percent BETWEEN 0 AND 100
  ),
  CONSTRAINT learning_progress_completed_consistency CHECK (
    (
      status = 'completed'
      AND completed_at IS NOT NULL
      AND progress_percent = 100
    )
    OR (
      status IN ('not_started', 'in_progress')
      AND completed_at IS NULL
    )
  )
);

COMMENT ON TABLE public.learning_progress IS
  'Learner tutorial/lab progress. Owner-only RLS. Exclusive-arc FKs. Absence of a row means not_started. Articles are not tracked here.';

COMMENT ON COLUMN public.learning_progress.status IS
  'API statuses: not_started (typically no row), in_progress, completed. Persisted rows are in_progress or completed.';

CREATE UNIQUE INDEX IF NOT EXISTS learning_progress_user_tutorial_uidx
  ON public.learning_progress (user_id, tutorial_id)
  WHERE tutorial_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS learning_progress_user_lab_uidx
  ON public.learning_progress (user_id, lab_id)
  WHERE lab_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS learning_progress_continue_idx
  ON public.learning_progress (user_id, last_activity_at DESC)
  WHERE status = 'in_progress';

-- ---------------------------------------------------------------------------
-- Reject unpublished / missing / scheduled targets even when a UUID exists.
-- FK existence checks do not consider RLS; this trigger closes that gap.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.learning_progress_require_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tutorial_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.tutorials
      WHERE id = NEW.tutorial_id
        AND status = 'published'
        AND (published_at IS NULL OR published_at <= now())
    ) THEN
      RAISE EXCEPTION 'learning_progress_unpublished_or_missing'
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
      RAISE EXCEPTION 'learning_progress_unpublished_or_missing'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.learning_progress_require_published() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.learning_progress_require_published() FROM anon;
REVOKE ALL ON FUNCTION public.learning_progress_require_published() FROM authenticated;

DROP TRIGGER IF EXISTS learning_progress_require_published_trg ON public.learning_progress;
CREATE TRIGGER learning_progress_require_published_trg
BEFORE INSERT OR UPDATE OF tutorial_id, lab_id ON public.learning_progress
FOR EACH ROW
EXECUTE FUNCTION public.learning_progress_require_published();

-- ---------------------------------------------------------------------------
-- Identity columns are immutable; updated_at is maintained on write.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.learning_progress_before_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.tutorial_id IS DISTINCT FROM OLD.tutorial_id
     OR NEW.lab_id IS DISTINCT FROM OLD.lab_id THEN
    RAISE EXCEPTION 'learning_progress_identity_immutable'
      USING ERRCODE = '23514';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS learning_progress_before_update_trg ON public.learning_progress;
CREATE TRIGGER learning_progress_before_update_trg
BEFORE UPDATE ON public.learning_progress
FOR EACH ROW
EXECUTE FUNCTION public.learning_progress_before_update();

-- ---------------------------------------------------------------------------
-- Grants: authenticated read/create/update own rows only. No anon access.
-- No DELETE. Admins do not get unrestricted access (no is_hcx_admin policies).
-- ---------------------------------------------------------------------------

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.learning_progress FROM PUBLIC;
REVOKE ALL ON TABLE public.learning_progress FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.learning_progress TO authenticated;

DROP POLICY IF EXISTS "Users can read own learning progress" ON public.learning_progress;
CREATE POLICY "Users can read own learning progress"
ON public.learning_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own learning progress" ON public.learning_progress;
CREATE POLICY "Users can insert own learning progress"
ON public.learning_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own learning progress" ON public.learning_progress;
CREATE POLICY "Users can update own learning progress"
ON public.learning_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
