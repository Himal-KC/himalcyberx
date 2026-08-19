-- HimalCyberX article publishing workflow
-- Review and run manually in Supabase SQL Editor.
-- Adds per-article SEO fields, featured image alt text, and supports scheduled publishing
-- via the existing published_at column (no new status enum required).

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS featured_image_alt text;

COMMENT ON COLUMN public.articles.seo_title IS
  'Optional meta title. Falls back to title when blank.';
COMMENT ON COLUMN public.articles.seo_description IS
  'Optional meta description. Falls back to excerpt when blank.';
COMMENT ON COLUMN public.articles.og_title IS
  'Optional Open Graph title. Falls back to seo_title, then title.';
COMMENT ON COLUMN public.articles.og_description IS
  'Optional Open Graph description. Falls back to seo_description, then excerpt.';
COMMENT ON COLUMN public.articles.featured_image_alt IS
  'Optional featured image alt text. Falls back to article title when blank.';

-- Optional hardening: hide scheduled articles from anonymous API reads.
-- The app also filters by published_at in public queries.
-- Uncomment if you want database-level enforcement too.
--
-- DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
-- CREATE POLICY "Public can read published articles"
--   ON public.articles
--   FOR SELECT
--   TO anon
--   USING (
--     status = 'published'
--     AND (published_at IS NULL OR published_at <= now())
--   );
