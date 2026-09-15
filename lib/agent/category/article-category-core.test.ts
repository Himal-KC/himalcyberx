import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  getPersistedArticleCategoryRecommendation,
  mapCategoryRowsToInventory,
  recommendArticleCategory,
  resolveApplicableArticleCategory,
  resolveValidatedArticleCategoryId,
} = (await import(pathToFileURL(join(testDir, "article-category-core.ts")).href)) as typeof import("./article-category-core");

const VALID_CATEGORY_ID = "00000000-0000-4000-8000-000000000101";
const STALE_CATEGORY_ID = "00000000-0000-4000-8000-000000000199";
const INVENTED_CATEGORY_ID = "00000000-0000-4000-8000-000000000188";

const SITE_CATEGORIES = mapCategoryRowsToInventory([
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "AI Security",
    slug: "ai-security",
    description: "Artificial intelligence security topics",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Forensics",
    slug: "forensics",
    description: "Digital forensics investigations",
  },
  {
    id: VALID_CATEGORY_ID,
    name: "Threat Intelligence",
    slug: "threat-intelligence",
    description: "Ransomware, threat actors, and adversary intelligence",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Vulnerabilities",
    slug: "vulnerabilities",
    description: "CVE advisories and vulnerability management",
  },
]);

describe("Article category assignment core", () => {
  it("assigns category_id when deterministic recommendation is confident", () => {
    const topic =
      "CISA ransomware preparedness guidance and threat actor intelligence";
    const categoryId = resolveValidatedArticleCategoryId({
      topic,
      categories: SITE_CATEGORIES,
    });

    assert.equal(categoryId, VALID_CATEGORY_ID);
  });

  it("returns a category id that exists in the loaded categories table", () => {
    const applicable = resolveApplicableArticleCategory({
      topic: "CVE-2024-21412 vulnerability advisory guidance",
      categories: SITE_CATEGORIES,
    });

    assert.ok(applicable?.id);
    assert.ok(
      SITE_CATEGORIES.some((entry) => entry.id === applicable?.id),
    );
  });

  it("rejects stale recommendations when id and name no longer match", () => {
    const categoryId = resolveValidatedArticleCategoryId({
      topic: "unrelated quantum gardening techniques",
      categories: SITE_CATEGORIES,
      persistedRecommendation: {
        id: STALE_CATEGORY_ID,
        name: "Threat Intelligence",
      },
    });

    assert.equal(categoryId, null);
  });

  it("leaves category_id null when no category matches confidently", () => {
    const categoryId = resolveValidatedArticleCategoryId({
      topic: "quantum gardening hydroponics",
      categories: SITE_CATEGORIES,
    });

    assert.equal(categoryId, null);
  });

  it("leaves category_id null when no recommendation exists", () => {
    assert.equal(
      getPersistedArticleCategoryRecommendation(null),
      null,
    );
    assert.equal(
      resolveValidatedArticleCategoryId({
        topic: "CISA ransomware guidance",
        categories: [],
      }),
      null,
    );
  });

  it("rejects invented category UUIDs not present in the categories table", () => {
    const categoryId = resolveValidatedArticleCategoryId({
      topic: "CISA ransomware guidance",
      categories: SITE_CATEGORIES,
      persistedRecommendation: {
        id: INVENTED_CATEGORY_ID,
        name: "Threat Intelligence",
      },
    });

    assert.equal(categoryId, null);
  });

  it("uses the same Phase 2 scorer for save-time resolution", () => {
    const topic = "CVE-2024-21412 vulnerability advisory";
    const fresh = recommendArticleCategory(topic, SITE_CATEGORIES);
    const resolved = resolveValidatedArticleCategoryId({
      topic,
      categories: SITE_CATEGORIES,
    });

    assert.equal(resolved, fresh.id);
  });

  it("validates persisted payload recommendation fields", () => {
    const recommendation = getPersistedArticleCategoryRecommendation({
      keyFindings: [],
      verifiedClaims: [],
      uncertainClaims: [],
      discoveryContexts: [],
      relatedHCXContent: [],
      researchConfidence: "high",
      researchQuality: "passed",
      canGenerateDraft: true,
      categoryRecommendation: "Threat Intelligence",
      categoryId: VALID_CATEGORY_ID,
      contentAwareness: {
        duplicateRisk: "low",
        similarContent: [],
        relatedContent: [],
        recommendedCategory: {
          id: VALID_CATEGORY_ID,
          name: "Threat Intelligence",
        },
        contentGapSummary: null,
      },
    });

    assert.equal(recommendation?.id, VALID_CATEGORY_ID);
    assert.equal(recommendation?.name, "Threat Intelligence");
  });

  it("does not add OpenAI or Tavily calls to category assignment modules", () => {
    const coreSource = readFileSync(join(testDir, "article-category-core.ts"), "utf8");
    const applySource = readFileSync(join(testDir, "apply-article-category.ts"), "utf8");
    const saveSource = readFileSync(
      join(testDir, "../generation/save-draft.ts"),
      "utf8",
    );

    for (const source of [coreSource, applySource, saveSource]) {
      assert.doesNotMatch(source, /openai|tavily|fetch\(/i);
    }
  });

  it("does not publish or send subscriber email from category assignment modules", () => {
    const applySource = readFileSync(join(testDir, "apply-article-category.ts"), "utf8");
    assert.doesNotMatch(applySource, /publishAgentContent|notifySubscriber|sendEmail/i);
    assert.match(applySource, /status !== "draft"/);
    assert.match(applySource, /category_id/);
  });
});

describe("Article category integration guards", () => {
  it("resolves category during article save-draft path", () => {
    const saveSource = readFileSync(
      join(testDir, "../generation/save-draft.ts"),
      "utf8",
    );
    assert.match(saveSource, /resolveArticleCategoryIdForAgentSave/);
    assert.match(saveSource, /validatedCategoryId/);
  });

  it("leaves tutorial and lab save paths unchanged", () => {
    const saveSource = readFileSync(
      join(testDir, "../generation/save-draft.ts"),
      "utf8",
    );
    assert.match(saveSource, /buildTutorialDraftInsertPayload/);
    assert.match(saveSource, /buildLabDraftInsertPayload/);
    assert.doesNotMatch(
      saveSource,
      /tutorial[\s\S]*resolveArticleCategoryIdForAgentSave/,
    );
  });

  it("does not mutate categories during resume hydration", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.match(resumeSource, /applicableArticleCategory/);
    assert.doesNotMatch(
      resumeSource,
      /hydratePersistedAgentRun[\s\S]*\.update\(\{ category_id/,
    );
  });

  it("keeps Phase 7 checking CMS category_id rather than recommendations", () => {
    const readinessSource = readFileSync(
      join(testDir, "../readiness/readiness-gate-core.ts"),
      "utf8",
    );
    assert.match(readinessSource, /CMS_CATEGORY_MISSING/);
    assert.match(readinessSource, /content\.categoryId/);
    assert.doesNotMatch(readinessSource, /categoryRecommendation/);
  });
});
