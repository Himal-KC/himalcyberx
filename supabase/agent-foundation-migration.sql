-- HimalCyberX HCX Content Agent — Phase 1 foundation (content-type aware)
-- Run manually in the Supabase SQL Editor after review.
--
-- Adds:
--   1. agent_runs — pipeline run persistence (article / tutorial / lab)
--   2. agent_sources — research sources per run
--   3. Article agent metadata + seo_keywords columns
--
-- Safety:
--   - Does NOT delete or rename existing data
--   - Does NOT change article/tutorial/lab status values or publishing logic
--   - Does NOT expose agent tables to anon/public access
--
-- Prerequisites:
--   - public.articles, public.tutorials, public.labs tables exist
--   - supabase/admin-policies.sql (authenticated admin pattern)

-- ---------------------------------------------------------------------------
-- agent_runs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  content_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  stage text NOT NULL DEFAULT 'queued',
  article_id uuid NULL REFERENCES public.articles(id) ON DELETE SET NULL,
  tutorial_id uuid NULL REFERENCES public.tutorials(id) ON DELETE SET NULL,
  lab_id uuid NULL REFERENCES public.labs(id) ON DELETE SET NULL,
  research_summary text NULL,
  recommended_angle text NULL,
  primary_keyword text NULL,
  secondary_keywords text[] NULL,
  quality_score integer NULL,
  fact_check_status text NULL,
  error_message text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_runs_content_type_check
    CHECK (content_type IN ('article', 'tutorial', 'lab')),
  CONSTRAINT agent_runs_status_check
    CHECK (status IN ('queued', 'running', 'ready', 'completed', 'failed', 'cancelled')),
  CONSTRAINT agent_runs_stage_check
    CHECK (stage IN (
      'queued',
      'research',
      'planning',
      'writing',
      'seo',
      'fact_check',
      'quality',
      'image',
      'saving',
      'ready',
      'publishing',
      'completed',
      'failed'
    )),
  CONSTRAINT agent_runs_fact_check_status_check
    CHECK (
      fact_check_status IS NULL
      OR fact_check_status IN ('pending', 'passed', 'failed', 'needs_review')
    ),
  CONSTRAINT agent_runs_quality_score_check
    CHECK (
      quality_score IS NULL
      OR (quality_score >= 0 AND quality_score <= 100)
    ),
  CONSTRAINT agent_runs_content_link_check
    CHECK (
      (
        content_type = 'article'
        AND tutorial_id IS NULL
        AND lab_id IS NULL
      )
      OR (
        content_type = 'tutorial'
        AND article_id IS NULL
        AND lab_id IS NULL
      )
      OR (
        content_type = 'lab'
        AND article_id IS NULL
        AND tutorial_id IS NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS agent_runs_status_idx
  ON public.agent_runs (status);

CREATE INDEX IF NOT EXISTS agent_runs_stage_idx
  ON public.agent_runs (stage);

CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx
  ON public.agent_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS agent_runs_content_type_idx
  ON public.agent_runs (content_type);

CREATE INDEX IF NOT EXISTS agent_runs_article_id_idx
  ON public.agent_runs (article_id);

CREATE INDEX IF NOT EXISTS agent_runs_tutorial_id_idx
  ON public.agent_runs (tutorial_id);

CREATE INDEX IF NOT EXISTS agent_runs_lab_id_idx
  ON public.agent_runs (lab_id);

-- ---------------------------------------------------------------------------
-- agent_sources
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  publisher text NULL,
  source_type text NOT NULL DEFAULT 'secondary',
  published_at timestamptz NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  supports_claims text[] NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_sources_source_type_check
    CHECK (source_type IN ('primary', 'secondary', 'official', 'research'))
);

CREATE INDEX IF NOT EXISTS agent_sources_agent_run_id_idx
  ON public.agent_sources (agent_run_id);

CREATE INDEX IF NOT EXISTS agent_sources_source_type_idx
  ON public.agent_sources (source_type);

CREATE INDEX IF NOT EXISTS agent_sources_sort_order_idx
  ON public.agent_sources (agent_run_id, sort_order);

-- ---------------------------------------------------------------------------
-- Article agent metadata + SEO keywords
-- ---------------------------------------------------------------------------

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NULL,
  ADD COLUMN IF NOT EXISTS agent_run_id uuid NULL,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_score integer NULL,
  ADD COLUMN IF NOT EXISTS fact_check_status text NULL,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_agent_run_id_fkey'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_agent_run_id_fkey
      FOREIGN KEY (agent_run_id)
      REFERENCES public.agent_runs(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_quality_score_check'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_quality_score_check
      CHECK (
        quality_score IS NULL
        OR (quality_score >= 0 AND quality_score <= 100)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_fact_check_status_check'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_fact_check_status_check
      CHECK (
        fact_check_status IS NULL
        OR fact_check_status IN ('pending', 'passed', 'failed', 'needs_review')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS articles_agent_run_id_idx
  ON public.articles (agent_run_id);

COMMENT ON COLUMN public.articles.seo_keywords IS
  'Optional per-article SEO keywords array.';
COMMENT ON COLUMN public.articles.agent_run_id IS
  'Optional link to the HCX Content Agent run that created or last prepared this article.';
COMMENT ON COLUMN public.articles.ai_generated IS
  'Whether this article was created or materially drafted by the HCX Content Agent.';
COMMENT ON COLUMN public.articles.quality_score IS
  'Optional agent quality score from 0 to 100.';
COMMENT ON COLUMN public.articles.fact_check_status IS
  'Optional agent fact-check outcome for this article.';
COMMENT ON COLUMN public.articles.last_verified_at IS
  'When agent fact-checking or verification last completed for this article.';

-- ---------------------------------------------------------------------------
-- Tutorial agent metadata + SEO fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS agent_run_id uuid NULL,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_score integer NULL,
  ADD COLUMN IF NOT EXISTS fact_check_status text NULL,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS seo_title text NULL,
  ADD COLUMN IF NOT EXISTS seo_description text NULL,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NULL,
  ADD COLUMN IF NOT EXISTS og_title text NULL,
  ADD COLUMN IF NOT EXISTS og_description text NULL,
  ADD COLUMN IF NOT EXISTS featured_image_alt text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tutorials_agent_run_id_fkey'
  ) THEN
    ALTER TABLE public.tutorials
      ADD CONSTRAINT tutorials_agent_run_id_fkey
      FOREIGN KEY (agent_run_id)
      REFERENCES public.agent_runs(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tutorials_quality_score_check'
  ) THEN
    ALTER TABLE public.tutorials
      ADD CONSTRAINT tutorials_quality_score_check
      CHECK (
        quality_score IS NULL
        OR (quality_score >= 0 AND quality_score <= 100)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tutorials_fact_check_status_check'
  ) THEN
    ALTER TABLE public.tutorials
      ADD CONSTRAINT tutorials_fact_check_status_check
      CHECK (
        fact_check_status IS NULL
        OR fact_check_status IN ('pending', 'passed', 'failed', 'needs_review')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tutorials_agent_run_id_idx
  ON public.tutorials (agent_run_id);

COMMENT ON COLUMN public.tutorials.agent_run_id IS
  'Optional link to the HCX Content Agent run that created or last prepared this tutorial.';
COMMENT ON COLUMN public.tutorials.ai_generated IS
  'Whether this tutorial was created or materially drafted by the HCX Content Agent.';
COMMENT ON COLUMN public.tutorials.quality_score IS
  'Optional agent quality score from 0 to 100.';
COMMENT ON COLUMN public.tutorials.fact_check_status IS
  'Optional agent fact-check outcome for this tutorial.';
COMMENT ON COLUMN public.tutorials.last_verified_at IS
  'When agent fact-checking or verification last completed for this tutorial.';
COMMENT ON COLUMN public.tutorials.seo_title IS
  'Optional meta title. Falls back to title when blank.';
COMMENT ON COLUMN public.tutorials.seo_description IS
  'Optional meta description. Falls back to description when blank.';
COMMENT ON COLUMN public.tutorials.seo_keywords IS
  'Optional per-tutorial SEO keywords array.';
COMMENT ON COLUMN public.tutorials.og_title IS
  'Optional Open Graph title.';
COMMENT ON COLUMN public.tutorials.og_description IS
  'Optional Open Graph description.';
COMMENT ON COLUMN public.tutorials.featured_image_alt IS
  'Optional featured image alt text. Falls back to title when blank.';

-- ---------------------------------------------------------------------------
-- Lab agent metadata + SEO fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.labs
  ADD COLUMN IF NOT EXISTS agent_run_id uuid NULL,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_score integer NULL,
  ADD COLUMN IF NOT EXISTS fact_check_status text NULL,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS seo_title text NULL,
  ADD COLUMN IF NOT EXISTS seo_description text NULL,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NULL,
  ADD COLUMN IF NOT EXISTS og_title text NULL,
  ADD COLUMN IF NOT EXISTS og_description text NULL,
  ADD COLUMN IF NOT EXISTS featured_image_alt text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'labs_agent_run_id_fkey'
  ) THEN
    ALTER TABLE public.labs
      ADD CONSTRAINT labs_agent_run_id_fkey
      FOREIGN KEY (agent_run_id)
      REFERENCES public.agent_runs(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'labs_quality_score_check'
  ) THEN
    ALTER TABLE public.labs
      ADD CONSTRAINT labs_quality_score_check
      CHECK (
        quality_score IS NULL
        OR (quality_score >= 0 AND quality_score <= 100)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'labs_fact_check_status_check'
  ) THEN
    ALTER TABLE public.labs
      ADD CONSTRAINT labs_fact_check_status_check
      CHECK (
        fact_check_status IS NULL
        OR fact_check_status IN ('pending', 'passed', 'failed', 'needs_review')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS labs_agent_run_id_idx
  ON public.labs (agent_run_id);

COMMENT ON COLUMN public.labs.agent_run_id IS
  'Optional link to the HCX Content Agent run that created or last prepared this lab.';
COMMENT ON COLUMN public.labs.ai_generated IS
  'Whether this lab was created or materially drafted by the HCX Content Agent.';
COMMENT ON COLUMN public.labs.quality_score IS
  'Optional agent quality score from 0 to 100.';
COMMENT ON COLUMN public.labs.fact_check_status IS
  'Optional agent fact-check outcome for this lab.';
COMMENT ON COLUMN public.labs.last_verified_at IS
  'When agent fact-checking or verification last completed for this lab.';
COMMENT ON COLUMN public.labs.seo_title IS
  'Optional meta title. Falls back to title when blank.';
COMMENT ON COLUMN public.labs.seo_description IS
  'Optional meta description. Falls back to description when blank.';
COMMENT ON COLUMN public.labs.seo_keywords IS
  'Optional per-lab SEO keywords array.';
COMMENT ON COLUMN public.labs.og_title IS
  'Optional Open Graph title.';
COMMENT ON COLUMN public.labs.og_description IS
  'Optional Open Graph description.';
COMMENT ON COLUMN public.labs.featured_image_alt IS
  'Optional featured image alt text. Falls back to title when blank.';

-- ---------------------------------------------------------------------------
-- RLS: authenticated admin access (same pattern as articles/categories)
-- No anon or public policies on agent tables.
-- ---------------------------------------------------------------------------

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agent runs"
ON public.agent_runs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert agent runs"
ON public.agent_runs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update agent runs"
ON public.agent_runs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agent runs"
ON public.agent_runs
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read agent sources"
ON public.agent_sources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert agent sources"
ON public.agent_sources
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update agent sources"
ON public.agent_sources
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agent sources"
ON public.agent_sources
FOR DELETE
TO authenticated
USING (true);
