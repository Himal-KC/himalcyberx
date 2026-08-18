-- Extend article-images storage policies for lab featured images
-- Run if you already applied supabase/storage-policies.sql with articles-only paths.

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete article images" ON storage.objects;

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] IN ('articles', 'labs')
);

CREATE POLICY "Authenticated users can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] IN ('articles', 'labs')
);
