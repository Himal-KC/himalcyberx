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

const sql = readRepoFile("supabase/saved-content-migration.sql");
const operations = readRepoFile("lib/bookmarks/operations.ts");
const core = readRepoFile("lib/bookmarks/core.ts");
const actions = readRepoFile("lib/actions/bookmarks.ts");
const button = readRepoFile("components/bookmarks/SaveContentButton.tsx");
const learnerSignIn = readRepoFile("lib/bookmarks/learner-sign-in.ts");
const authActions = readRepoFile("lib/actions/auth.ts");
const adminRls = readRepoFile("supabase/v2-admin-rls-foundation.sql");

describe("saved_content SQL contract", () => {
  it("is manual-only and not a polymorphic content_id design", () => {
    assert.match(sql, /MANUAL DEPLOY ONLY/);
    assert.match(sql, /Do NOT apply automatically/);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.saved_content/);
    assert.match(sql, /REFERENCES auth\.users \(id\) ON DELETE CASCADE/);
    assert.match(sql, /REFERENCES public\.articles \(id\) ON DELETE CASCADE/);
    assert.match(sql, /REFERENCES public\.tutorials \(id\) ON DELETE CASCADE/);
    assert.match(sql, /REFERENCES public\.labs \(id\) ON DELETE CASCADE/);
    assert.match(sql, /saved_content_one_target/);
    assert.doesNotMatch(sql, /content_type text/);
    assert.doesNotMatch(sql, /content_id uuid/);
  });

  it("prevents duplicates and indexes user retrieval", () => {
    assert.match(sql, /saved_content_user_article_uidx/);
    assert.match(sql, /saved_content_user_tutorial_uidx/);
    assert.match(sql, /saved_content_user_lab_uidx/);
    assert.match(sql, /saved_content_user_created_idx/);
    assert.match(sql, /user_id, created_at DESC/);
  });

  it("enforces owner-only RLS without admin or anon writes", () => {
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.saved_content FROM anon/);
    assert.match(sql, /GRANT SELECT, INSERT, DELETE ON TABLE public\.saved_content TO authenticated/);
    assert.match(sql, /Users can read own saved content/);
    assert.match(sql, /Users can insert own saved content/);
    assert.match(sql, /Users can delete own saved content/);
    assert.match(sql, /auth\.uid\(\) = user_id/);
    assert.doesNotMatch(sql, /FOR UPDATE/);
    assert.doesNotMatch(sql, /TO anon/);
    assert.doesNotMatch(sql, /is_hcx_admin\(\)/);
  });

  it("rejects unpublished content at the database layer", () => {
    assert.match(sql, /saved_content_require_published/);
    assert.match(sql, /status = 'published'/);
    assert.match(sql, /published_at <= now\(\)/);
    assert.match(sql, /saved_content_unpublished_or_missing/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.saved_content_require_published\(\) FROM authenticated/);
  });

  it("does not alter Task A admin RLS foundation", () => {
    assert.doesNotMatch(adminRls, /saved_content/);
  });
});

describe("bookmark application security contracts", () => {
  it("never accepts user_id from the client in operations or actions", () => {
    assert.match(core, /getSessionUser/);
    assert.match(operations, /getLearnerServerClient/);
    assert.doesNotMatch(core, /userIdFromClient|input\.user_id|input\.userId/);
    assert.doesNotMatch(actions, /user_id/);
    assert.match(core, /Extra fields such as user_id are ignored/);
    assert.match(operations, /insert\(payload\)/);
    assert.doesNotMatch(
      operations,
      /insert\(\{[\s\S]*user_id/,
    );
  });

  it("does not expose service role or CMS write paths", () => {
    for (const source of [operations, actions, core]) {
      assert.doesNotMatch(source, /createServiceServerClient/);
      assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE/);
      assert.doesNotMatch(source, /requireAdminAuth/);
      assert.doesNotMatch(source, /isAllowedAdminUser/);
      assert.doesNotMatch(source, /\.from\(["']articles["']\)\s*\.\s*(insert|update|delete)/);
      assert.doesNotMatch(source, /\.from\(["']tutorials["']\)\s*\.\s*(insert|update|delete)/);
      assert.doesNotMatch(source, /\.from\(["']labs["']\)\s*\.\s*(insert|update|delete)/);
    }
    assert.match(operations, /isPublishedAtPubliclyAvailable/);
    assert.match(operations, /from\("saved_content"\)\.insert/);
    assert.match(operations, /from\("saved_content"\)[\s\S]*\.delete\(\)/);
  });

  it("does not modify Task B auth/profile implementation files", () => {
    assert.doesNotMatch(authActions, /saved_content/);
    assert.match(learnerSignIn, /buildLoginRedirectPath/);
    assert.match(learnerSignIn, /Does not implement authentication/);
  });

  it("wires the reusable Save button to article, tutorial, and lab pages", () => {
    const articlePage = readRepoFile("app/articles/[slug]/page.tsx");
    const tutorialPage = readRepoFile("app/tutorials/[slug]/page.tsx");
    const labPage = readRepoFile("app/cyber-lab/[slug]/page.tsx");

    assert.match(button, /Sign in to save/);
    assert.match(button, /saved \? "Saved" : "Save"/);
    assert.match(button, /learnerSignInHref/);
    assert.match(articlePage, /contentType="article"/);
    assert.match(tutorialPage, /contentType="tutorial"/);
    assert.match(labPage, /contentType="lab"/);
  });
});
