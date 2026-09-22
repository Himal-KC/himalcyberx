import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const avatarSql = readRepoFile("supabase/v2-learner-avatars-storage.sql");
const articleStorageSql = readRepoFile("supabase/storage-policies.sql");
const adminRlsSql = readRepoFile("supabase/v2-admin-rls-foundation.sql");
const tutorialsStorageSql = readRepoFile("supabase/tutorials-storage-policy.sql");
const labsStorageSql = readRepoFile("supabase/labs-storage-policy.sql");
const profileActions = readRepoFile("lib/actions/profile.ts");
const avatarStore = readRepoFile("lib/storage/avatar-store.ts");
const avatarCore = readRepoFile("lib/storage/avatar-upload-core.ts");
const avatars = readRepoFile("lib/storage/avatars.ts");
const profileForm = readRepoFile("components/auth/ProfileForm.tsx");
const profileValidation = readRepoFile("lib/auth/profile-validation.ts");
const nextConfig = readRepoFile("next.config.ts");

describe("avatar storage SQL contract", () => {
  it("is manual-only, public-read, and owner-scoped", () => {
    assert.match(avatarSql, /DO NOT APPLY/);
    assert.match(avatarSql, /MANUAL DEPLOY ONLY/);
    assert.match(avatarSql, /PUBLIC bucket \(choice A\)/);
    assert.match(avatarSql, /file_size_limit/);
    assert.match(avatarSql, /1048576/);
    assert.match(avatarSql, /image\/jpeg/);
    assert.match(avatarSql, /image\/png/);
    assert.match(avatarSql, /image\/webp/);
    assert.match(avatarSql, /bucket_id = 'avatars'/);
    assert.match(avatarSql, /auth\.uid\(\)::text \|\| '\/avatar\.jpg'/);
    assert.match(avatarSql, /TO authenticated/);
    assert.match(avatarSql, /TO public/);
    assert.match(avatarSql, /FOR SELECT/);
    assert.match(avatarSql, /FOR INSERT/);
    assert.match(avatarSql, /FOR UPDATE/);
    assert.match(avatarSql, /FOR DELETE/);
    assert.match(avatarSql, /ON CONFLICT \(id\) DO UPDATE/);
  });

  it("does not add an admin bypass or touch article-images policies", () => {
    assert.doesNotMatch(avatarSql, /is_hcx_admin\s*\(/);
    assert.doesNotMatch(avatarSql, /bucket_id = 'article-images'/);
    assert.doesNotMatch(avatarSql, /DROP POLICY IF EXISTS "HCX admin can upload article images"/);
    assert.doesNotMatch(avatarSql, /DROP POLICY IF EXISTS "HCX admin can delete article images"/);
    assert.match(articleStorageSql, /bucket_id = 'article-images'/);
    assert.match(articleStorageSql, /public\.is_hcx_admin\(\)/);
    assert.match(adminRlsSql, /bucket_id = 'article-images'/);
    assert.match(tutorialsStorageSql, /bucket_id = 'article-images'/);
    assert.match(labsStorageSql, /bucket_id = 'article-images'/);
  });
});

describe("avatar application security contracts", () => {
  it("derives identity from the session and ignores client-owned paths", () => {
    assert.match(avatarCore, /getSessionUser/);
    assert.match(avatarCore, /claimedUserId/);
    assert.match(avatarCore, /void input\.claimedUserId/);
    assert.match(profileActions, /auth\.user\.id/);
    assert.match(profileActions, /getAvatarFileFromFormData/);
    assert.doesNotMatch(profileActions, /instanceof File/);
    assert.doesNotMatch(profileActions, /formData\.get\("user_id"\)/);
    assert.doesNotMatch(profileActions, /formData\.get\("avatar_url"\)/);
    assert.doesNotMatch(profileActions, /formData\.get\("path"\)/);
    assert.match(avatars, /AVATAR_FORM_FIELD/);
    assert.match(profileForm, /encType="multipart\/form-data"/);
    assert.match(profileForm, /validateAvatarMetadata/);
  });

  it("does not use the service role or assign hcx_admin", () => {
    for (const source of [profileActions, avatarStore, avatarCore, avatars]) {
      assert.doesNotMatch(source, /createServiceServerClient/);
      assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE/);
      assert.doesNotMatch(source, /hcx_admin/);
      assert.doesNotMatch(source, /app_metadata/);
      assert.doesNotMatch(source, /requireAdminAuth/);
    }
  });

  it("keeps display name, username, and bio updates independent of avatar URLs", () => {
    assert.match(profileActions, /updateLearnerProfile/);
    assert.match(profileActions, /validateProfileFields/);
    assert.match(profileActions, /buildProfileUpdatePayload\(validated\.values\)/);
    assert.match(profileValidation, /includeAvatar/);
    assert.doesNotMatch(
      profileActions,
      /buildProfileUpdatePayload\([\s\S]*includeAvatar:\s*true/,
    );
    assert.match(nextConfig, /bodySizeLimit:\s*"2mb"/);
  });
});
