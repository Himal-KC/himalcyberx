-- HimalCyberX Site Settings migration
-- Run manually in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text,
  site_tagline text,
  public_author_name text,
  contact_email text,
  footer_description text,
  github_url text,
  linkedin_url text,
  x_url text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  location_display text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
