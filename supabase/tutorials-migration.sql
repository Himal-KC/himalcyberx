-- HimalCyberX Tutorials migration
-- Run manually in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Beginner',
  estimated_time text,
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tutorials_slug_key ON public.tutorials (slug);

ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS requirements text;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS introduction text;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS key_takeaways text;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS security_notes text;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS featured_image text;

ALTER TABLE public.tutorials DROP CONSTRAINT IF EXISTS tutorials_status_check;
ALTER TABLE public.tutorials
  ADD CONSTRAINT tutorials_status_check
  CHECK (status IN ('draft', 'published'));

ALTER TABLE public.tutorials DROP CONSTRAINT IF EXISTS tutorials_difficulty_check;
ALTER TABLE public.tutorials
  ADD CONSTRAINT tutorials_difficulty_check
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
