-- HimalCyberX Cyber Labs migration
-- Run manually in the Supabase SQL Editor.
-- Inspects existing labs table and adds required columns without dropping legacy fields.

-- ---------------------------------------------------------------------------
-- Base table (safe if already exists from earlier schema)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Beginner',
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS labs_slug_key ON public.labs (slug);

-- ---------------------------------------------------------------------------
-- Required Cyber Lab content columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS estimated_time text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS learning_objectives text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS requirements_tools text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS introduction text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS expected_result text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS security_notes text;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS featured_image text;

-- ---------------------------------------------------------------------------
-- Constraints (run after columns exist)
-- ---------------------------------------------------------------------------

ALTER TABLE public.labs DROP CONSTRAINT IF EXISTS labs_status_check;
ALTER TABLE public.labs
  ADD CONSTRAINT labs_status_check
  CHECK (status IN ('draft', 'published'));

ALTER TABLE public.labs DROP CONSTRAINT IF EXISTS labs_difficulty_check;
ALTER TABLE public.labs
  ADD CONSTRAINT labs_difficulty_check
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
