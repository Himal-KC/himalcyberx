import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "../agent/generation/types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  ARTICLE_AGENT_DRAFT_INSERT_FIELDS,
  ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS,
  buildArticleDraftInsertPayload,
  listUnexpectedArticleInsertFields,
} = (await import(pathToFileURL(join(testDir, "db-schema.ts")).href)) as typeof import("./db-schema");

const ARTICLE_DRAFT: ArticleGeneratedDraft = {
  contentType: "article",
  title: "CVE-2024-21412 Exploitation and Remediation Guidance",
  slug: "cve-2024-21412-exploitation-remediation-guidance",
  excerpt: "Grounded analysis of CVE-2024-21412.",
  content: "<p>CVE-2024-21412 is listed in CISA KEV.</p>",
  categoryRecommendation: "Vulnerabilities",
  primaryKeyword: "CVE-2024-21412",
  secondaryKeywords: ["CVSS"],
  keyTakeaways: ["CVE-2024-21412 is listed in CISA KEV."],
  seo: {
    seoTitle: "CVE-2024-21412 Exploitation and Remediation Guidance",
    seoDescription: "Grounded CVE-2024-21412 analysis.",
    seoKeywords: ["CVE-2024-21412"],
    ogTitle: "CVE-2024-21412 Exploitation and Remediation Guidance",
    ogDescription: "Grounded CVE-2024-21412 analysis.",
  },
  generationPlan: {
    contentAngle: "Defensive remediation",
    audience: "Security teams",
    intent: "Explain verified CVE evidence",
    sectionPlan: ["Overview", "Severity"],
  },
  sourceMappings: [],
  internalLinks: [],
  warnings: [],
};

describe("article agent INSERT contract", () => {
  it("uses only confirmed ARTICLE_AGENT_DRAFT_INSERT_FIELDS", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 88,
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.deepEqual(listUnexpectedArticleInsertFields(payload), []);
    assert.deepEqual(
      [...Object.keys(payload).sort()],
      [...ARTICLE_AGENT_DRAFT_INSERT_FIELDS].filter(
        (field) => field !== "category_id" || "category_id" in payload,
      ).sort(),
    );
  });

  it("never includes key_takeaways, read_time, or other forbidden fields", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 88,
      preparedContent: ARTICLE_DRAFT.content,
    });

    for (const field of ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS) {
      assert.equal(field in payload, false, `forbidden field present: ${field}`);
    }

    assert.equal("key_takeaways" in payload, false);
    assert.equal("read_time" in payload, false);
  });

  it("retains required agent metadata", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 88.4,
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.equal(payload.status, "draft");
    assert.equal(payload.ai_generated, true);
    assert.equal(payload.agent_run_id, "00000000-0000-4000-8000-000000000001");
    assert.equal(payload.fact_check_status, "pending");
    assert.equal(payload.quality_score, 88);
    assert.equal("published_at" in payload, false);
  });
});
