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

const sql = readRepoFile("supabase/v2-learning-progress-migration.sql");
const operations = readRepoFile("lib/learning/operations.ts");
const operationsCore = readRepoFile("lib/learning/operations-core.ts");
const actions = readRepoFile("lib/actions/learning-progress.ts");
const core = readRepoFile("lib/learning/progress-core.ts");
const controls = readRepoFile(
  "components/learning/LearningProgressControls.tsx",
);
const authActions = readRepoFile("lib/actions/auth.ts");
const profileActions = readRepoFile("lib/actions/profile.ts");
const adminRls = readRepoFile("supabase/v2-admin-rls-foundation.sql");

describe("learning_progress SQL contract", () => {
  it("is manual-only with exclusive-arc FKs and no article tracking", () => {
    assert.match(sql, /MANUAL DEPLOY ONLY/);
    assert.match(sql, /Do NOT apply automatically/);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.learning_progress/);
    assert.match(sql, /REFERENCES auth\.users \(id\) ON DELETE CASCADE/);
    assert.match(sql, /REFERENCES public\.tutorials \(id\) ON DELETE CASCADE/);
    assert.match(sql, /REFERENCES public\.labs \(id\) ON DELETE CASCADE/);
    assert.match(sql, /learning_progress_one_target/);
    assert.match(sql, /status IN \('not_started', 'in_progress', 'completed'\)/);
    assert.match(sql, /progress_percent BETWEEN 0 AND 100/);
    assert.doesNotMatch(sql, /article_id/);
    assert.doesNotMatch(sql, /content_id uuid/);
  });

  it("prevents duplicates and indexes continue-learning retrieval", () => {
    assert.match(sql, /learning_progress_user_tutorial_uidx/);
    assert.match(sql, /learning_progress_user_lab_uidx/);
    assert.match(sql, /learning_progress_continue_idx/);
    assert.match(sql, /WHERE status = 'in_progress'/);
  });

  it("enforces owner-only RLS without admin or anon writes", () => {
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.learning_progress FROM anon/);
    assert.match(
      sql,
      /GRANT SELECT, INSERT, UPDATE ON TABLE public\.learning_progress TO authenticated/,
    );
    assert.match(sql, /Users can read own learning progress/);
    assert.match(sql, /Users can insert own learning progress/);
    assert.match(sql, /Users can update own learning progress/);
    assert.match(sql, /auth\.uid\(\) = user_id/);
    assert.doesNotMatch(sql, /GRANT DELETE/);
    assert.doesNotMatch(sql, /TO anon/);
    assert.doesNotMatch(sql, /is_hcx_admin\(\)/);
  });

  it("rejects unpublished content and keeps identity immutable", () => {
    assert.match(sql, /learning_progress_require_published/);
    assert.match(sql, /status = 'published'/);
    assert.match(sql, /published_at <= now\(\)/);
    assert.match(sql, /learning_progress_unpublished_or_missing/);
    assert.match(sql, /learning_progress_identity_immutable/);
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.learning_progress_require_published\(\) FROM authenticated/,
    );
  });

  it("does not alter Task A admin RLS or Task C bookmarks schema", () => {
    assert.doesNotMatch(adminRls, /learning_progress/);
    assert.doesNotMatch(sql, /DROP POLICY IF EXISTS "HCX admin can insert articles"/);
    assert.doesNotMatch(sql, /ALTER TABLE public\.profiles/);
    assert.doesNotMatch(sql, /ALTER TABLE public\.saved_content/);
  });
});

describe("learning progress application security contracts", () => {
  it("never accepts user_id from the client in operations or actions", () => {
    assert.match(operationsCore, /getSessionUser/);
    assert.match(operations, /getLearnerServerClient/);
    assert.doesNotMatch(operationsCore, /userIdFromClient|input\.user_id|input\.userId/);
    assert.doesNotMatch(actions, /user_id/);
    assert.match(core, /Extra fields such as user_id are ignored/);
    assert.match(operations, /\.insert\(payload\)/);
    assert.doesNotMatch(operations, /insert\(\{[\s\S]*user_id/);
  });

  it("does not expose service role or CMS write paths", () => {
    for (const source of [operations, operationsCore, actions, core]) {
      assert.doesNotMatch(source, /createServiceServerClient/);
      assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE/);
      assert.doesNotMatch(source, /requireAdminAuth/);
      assert.doesNotMatch(source, /isAllowedAdminUser/);
      assert.doesNotMatch(
        source,
        /\.from\(["']articles["']\)\s*\.\s*(insert|update|delete)/,
      );
      assert.doesNotMatch(
        source,
        /\.from\(["']tutorials["']\)\s*\.\s*(insert|update|delete)/,
      );
      assert.doesNotMatch(
        source,
        /\.from\(["']labs["']\)\s*\.\s*(insert|update|delete)/,
      );
    }
    assert.match(operations, /from\("learning_progress"\)[\s\S]*\.insert/);
    assert.match(operations, /from\("learning_progress"\)[\s\S]*\.update/);
    assert.match(
      operations,
      /tutorials\(\$\{CONTENT_FIELDS\}\), labs\(\$\{CONTENT_FIELDS\}\)/,
    );
  });

  it("does not modify Task B auth/profile implementation files", () => {
    assert.doesNotMatch(authActions, /learning_progress/);
    assert.doesNotMatch(profileActions, /learning_progress/);
  });

  it("wires reusable progress controls to tutorial and lab pages only", () => {
    const tutorialPage = readRepoFile("app/tutorials/[slug]/page.tsx");
    const labPage = readRepoFile("app/cyber-lab/[slug]/page.tsx");
    const articlePage = readRepoFile("app/articles/[slug]/page.tsx");

    assert.match(controls, /Start Tutorial/);
    assert.match(controls, /Start Lab/);
    assert.match(controls, /Mark Complete/);
    assert.match(controls, /Completed ✓/);
    assert.match(tutorialPage, /LearningProgressControls/);
    assert.match(labPage, /LearningProgressControls/);
    assert.doesNotMatch(articlePage, /LearningProgressControls/);
  });
});
