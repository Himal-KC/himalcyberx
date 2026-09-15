-- HimalCyberX HCX Content Agent — Phase 5 (independent fact-check review)
-- Run manually in the Supabase SQL Editor after review.
--
-- Adds persistent independent review results for generated drafts.

CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  status text NOT NULL,
  fact_check_status text NOT NULL,
  review_model text NOT NULL,
  review_version text NOT NULL DEFAULT 'phase5-v1',
  draft_fingerprint text NOT NULL,
  quality_score integer NOT NULL,
  summary text NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  unsupported_claims jsonb NOT NULL DEFAULT '[]'::jsonb,
  conflicting_claims jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_integrity jsonb NOT NULL DEFAULT '{}'::jsonb,
  internal_link_integrity jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_review jsonb NULL,
  readability_review jsonb NULL,
  originality_review jsonb NULL,
  safety_review jsonb NULL,
  publication_recommendation text NULL,
  warnings text[] NULL,
  review_metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_reviews_content_type_check
    CHECK (content_type IN ('article', 'tutorial', 'lab')),
  CONSTRAINT agent_reviews_status_check
    CHECK (status IN ('pass', 'needs_review', 'fail')),
  CONSTRAINT agent_reviews_fact_check_status_check
    CHECK (
      fact_check_status IN ('pending', 'passed', 'failed', 'needs_review')
    ),
  CONSTRAINT agent_reviews_quality_score_check
    CHECK (quality_score >= 0 AND quality_score <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_reviews_run_fingerprint_uidx
  ON public.agent_reviews (agent_run_id, draft_fingerprint);

CREATE INDEX IF NOT EXISTS agent_reviews_agent_run_id_idx
  ON public.agent_reviews (agent_run_id);

CREATE INDEX IF NOT EXISTS agent_reviews_content_id_idx
  ON public.agent_reviews (content_id);

ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agent reviews"
ON public.agent_reviews
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert agent reviews"
ON public.agent_reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update agent reviews"
ON public.agent_reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agent reviews"
ON public.agent_reviews
FOR DELETE
TO authenticated
USING (true);
