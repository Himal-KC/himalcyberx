-- HimalCyberX Storage policies for article-images bucket
-- Run manually in the Supabase SQL editor after creating the public bucket:
--   article-images
--
-- The bucket is public so published article images are readable without auth.
-- Upload and delete remain restricted to authenticated admin users.

-- ---------------------------------------------------------------------------
-- Authenticated upload (INSERT)
-- ---------------------------------------------------------------------------

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] = 'articles'
);

-- ---------------------------------------------------------------------------
-- Authenticated delete (for Remove Image in admin)
-- ---------------------------------------------------------------------------

CREATE POLICY "Authenticated users can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] = 'articles'
);

-- ---------------------------------------------------------------------------
-- Public read
-- ---------------------------------------------------------------------------
-- Public buckets allow anonymous SELECT on objects automatically.
-- No extra SELECT policy is required for public article image URLs.
