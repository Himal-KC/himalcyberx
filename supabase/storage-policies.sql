-- HimalCyberX Storage policies for article-images bucket
-- Run manually in the Supabase SQL editor after creating the public bucket:
--   article-images
--
-- Apply v2-admin-rls-foundation.sql for production (HCX admin write/delete only).
-- Requires public.is_hcx_admin().

CREATE POLICY "HCX admin can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] = 'articles'
  AND public.is_hcx_admin()
);

CREATE POLICY "HCX admin can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (storage.foldername(name))[1] = 'articles'
  AND public.is_hcx_admin()
);
