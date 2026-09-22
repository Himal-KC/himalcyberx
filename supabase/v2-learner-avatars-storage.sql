-- HimalCyberX V2 — Learner avatar storage
-- =============================================================================
-- MANUAL DEPLOY ONLY. DO NOT APPLY until reviewed in staging.
--
-- Architecture decision: PUBLIC bucket (choice A)
-- -----------------------------------------------------------------------------
-- Avatars are public profile images. They may appear on learner-facing and
-- future community surfaces. They are not private account data; email stays
-- off the profiles table and is never stored in this bucket.
--
-- A public `avatars` bucket with owner-only writes is the simpler secure
-- model for HimalCyberX. Signed URLs would expire, require a proxy on every
-- render, and add no extra privacy for images intended to be shown publicly.
--
-- Object path contract: {auth.uid()}/avatar.{jpg|png|webp}
-- Public SELECT; authenticated owner-only INSERT/UPDATE/DELETE.
-- No admin-role bypass. This script does not alter other buckets or
-- existing article-images storage policies.
--
-- Apply only after v2-admin-rls-foundation.sql and v2-learner-auth-foundation.sql.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types
WHERE storage.buckets.id = 'avatars';

DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    name = (auth.uid()::text || '/avatar.jpg')
    OR name = (auth.uid()::text || '/avatar.png')
    OR name = (auth.uid()::text || '/avatar.webp')
  )
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    name = (auth.uid()::text || '/avatar.jpg')
    OR name = (auth.uid()::text || '/avatar.png')
    OR name = (auth.uid()::text || '/avatar.webp')
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    name = (auth.uid()::text || '/avatar.jpg')
    OR name = (auth.uid()::text || '/avatar.png')
    OR name = (auth.uid()::text || '/avatar.webp')
  )
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    name = (auth.uid()::text || '/avatar.jpg')
    OR name = (auth.uid()::text || '/avatar.png')
    OR name = (auth.uid()::text || '/avatar.webp')
  )
);
