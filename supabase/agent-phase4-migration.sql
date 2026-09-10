-- HimalCyberX HCX Content Agent — Phase 4 (research payload + generation metadata)
-- Run manually in the Supabase SQL Editor after review.
--
-- Adds JSON persistence for grounded draft generation without changing Phase 3 logic.

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS research_payload jsonb NULL,
  ADD COLUMN IF NOT EXISTS generation_metadata jsonb NULL;

CREATE INDEX IF NOT EXISTS agent_runs_research_payload_idx
  ON public.agent_runs ((research_payload IS NOT NULL));
