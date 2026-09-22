import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..");

const signup = (await import(
  pathToFileURL(join(testDir, "signup.ts")).href
)) as typeof import("./signup");

const callback = (await import(
  pathToFileURL(join(testDir, "callback.ts")).href
)) as typeof import("./callback");

const avatars = (await import(
  pathToFileURL(join(testDir, "..", "storage", "avatars.ts")).href
)) as typeof import("../storage/avatars");

const learnerAuthSource = readFileSync(
  join(repoRoot, "lib", "actions", "learner-auth.ts"),
  "utf8",
);
const profileActionSource = readFileSync(
  join(repoRoot, "lib", "actions", "profile.ts"),
  "utf8",
);
const adminAuthSource = readFileSync(
  join(repoRoot, "lib", "actions", "auth.ts"),
  "utf8",
);
const headerSource = readFileSync(
  join(repoRoot, "components", "Header.tsx"),
  "utf8",
);
const middlewareSource = readFileSync(
  join(repoRoot, "lib", "supabase", "middleware.ts"),
  "utf8",
);
const proxySource = readFileSync(join(repoRoot, "proxy.ts"), "utf8");
const learnerSql = readFileSync(
  join(repoRoot, "supabase", "v2-learner-auth-foundation.sql"),
  "utf8",
);
const avatarSql = readFileSync(
  join(repoRoot, "supabase", "v2-learner-avatars-storage.sql"),
  "utf8",
);
const profileQuerySource = readFileSync(
  join(repoRoot, "lib", "supabase", "profiles.ts"),
  "utf8",
);
const adminAccessSource = readFileSync(
  join(repoRoot, "lib", "supabase", "admin-access.ts"),
  "utf8",
);

describe("learner signup cannot become hcx_admin", () => {
  it("builds sign-up requests without app_metadata or admin role", () => {
    const request = signup.buildLearnerSignUpRequest({
      email: "learner@example.com",
      password: "correct-horse",
      displayName: "Ada",
      emailRedirectTo: "http://localhost:3000/auth/callback?next=/profile",
    });

    assert.equal(signup.learnerSignUpAssignsAdminRole(request), false);
    assert.equal("app_metadata" in request.options, false);
    assert.equal(request.options.data.display_name, "Ada");
    assert.doesNotMatch(JSON.stringify(request), /hcx_admin/);
  });

  it("learner auth actions never assign app_metadata.role", () => {
    assert.doesNotMatch(learnerAuthSource, /app_metadata/);
    assert.doesNotMatch(learnerAuthSource, /HCX_ADMIN_ROLE/);
    assert.match(learnerAuthSource, /buildLearnerSignUpRequest/);
  });
});

describe("learner profile ownership and privacy", () => {
  it("profile queries never select or write email", () => {
    assert.doesNotMatch(profileQuerySource, /\bemail\b/);
    assert.match(profileQuerySource, /eq\("user_id", userId\)/);
    assert.doesNotMatch(profileActionSource, /formData\.get\("email"\)/);
    assert.doesNotMatch(profileActionSource, /app_metadata/);
  });

  it("SQL trigger does not copy email or grant admin", () => {
    assert.match(learnerSql, /INSERT INTO public\.profiles \(user_id\)/);
    const fnStart = learnerSql.indexOf("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    const fnEnd = learnerSql.indexOf("COMMENT ON FUNCTION public.handle_new_user()");
    const fnBody = learnerSql.slice(fnStart, fnEnd);
    assert.doesNotMatch(fnBody, /raw_app_meta_data/);
    assert.doesNotMatch(fnBody, /hcx_admin/);
    assert.doesNotMatch(fnBody, /NEW\.email/);
  });
});

describe("learner cannot access admin surfaces", () => {
  it("middleware still requires isAllowedAdminUser for /admin", () => {
    assert.match(middlewareSource, /isAllowedAdminUser/);
    assert.match(middlewareSource, /admin\/login/);
    assert.match(middlewareSource, /isLearnerProtectedPath/);
  });

  it("does not expose HCX Admin in the public header", () => {
    assert.doesNotMatch(headerSource, /\/admin/);
    assert.doesNotMatch(headerSource, /HCX Admin/);
    assert.match(headerSource, /HeaderAuthNav/);
  });

  it("keeps HCX Admin login on a separate action", () => {
    assert.match(adminAuthSource, /isAllowedAdminUser/);
    assert.match(adminAuthSource, /redirect\("\/admin"\)/);
    assert.match(adminAuthSource, /redirect\("\/admin\/login"\)/);
    assert.match(adminAccessSource, /app_metadata/);
  });
});

describe("auth callback and avatar path safety", () => {
  it("resolves redirects against the app origin", () => {
    const url = callback.resolveAuthRedirectUrl(
      "http://localhost:3000/auth/callback",
      "//evil.example",
    );
    assert.equal(url, "http://localhost:3000/profile");
    assert.equal(callback.isAllowedAuthCallbackCode("abc.def-ghi"), true);
    assert.equal(callback.isAllowedAuthCallbackCode("https://evil"), false);
  });

  it("scopes avatar storage paths to the signed-in user", () => {
    const ownerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    assert.equal(
      avatars.buildAvatarStoragePath(ownerId, "image/png"),
      `${ownerId}/avatar.png`,
    );
    assert.equal(
      avatars.isOwnedAvatarUrl(
        `https://xyz.supabase.co/storage/v1/object/public/avatars/${ownerId}/avatar.png`,
        "https://xyz.supabase.co",
        ownerId,
      ),
      true,
    );
    assert.equal(
      avatars.isOwnedAvatarUrl(
        "https://xyz.supabase.co/storage/v1/object/public/avatars/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/avatar.png",
        "https://xyz.supabase.co",
        ownerId,
      ),
      false,
    );
    assert.equal(
      avatars.isOwnedAvatarUrl(
        "javascript:alert(1)",
        "https://xyz.supabase.co",
        ownerId,
      ),
      false,
    );
  });

  it("avatar storage SQL is owner-scoped and marked do-not-apply", () => {
    assert.match(avatarSql, /DO NOT APPLY/);
    assert.match(avatarSql, /auth\.uid\(\)::text/);
    assert.match(avatarSql, /bucket_id = 'avatars'/);
    assert.doesNotMatch(avatarSql, /bucket_id = 'article-images'/);
  });

  it("proxy matcher covers learner auth without dropping admin", () => {
    assert.match(proxySource, /\/admin\/:path\*/);
    assert.match(proxySource, /\/login/);
    assert.match(proxySource, /\/profile/);
    assert.match(proxySource, /\/dashboard/);
    assert.match(proxySource, /\/auth\/:path\*/);
  });
});
