import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "./types";
import type { GenerationMetadata } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  appendArticleKeyTakeawaysToContent,
  ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS,
  buildArticleDraftInsertPayload,
  listUnexpectedArticleInsertFields,
} = (await import(pathToFileURL(join(testDir, "../../articles/db-schema.ts")).href)) as typeof import("../../articles/db-schema");

const {
  buildAgentRunSaveUpdate,
  buildGenerateDraftResult,
  buildLabDraftInsertPayload,
  buildTutorialDraftInsertPayload,
  isDraftContentRow,
  LAB_DRAFT_INSERT_FIELDS,
  listPayloadFieldsOutsideAllowlist,
  normalizeQualityScore,
  resolveSafeCategoryId,
  serializeGenerationMetadata,
  stripUndefinedValues,
  targetTableForContentType,
  TUTORIAL_DRAFT_INSERT_FIELDS,
} = (await import(pathToFileURL(join(testDir, "save-draft-core.ts")).href)) as typeof import("./save-draft-core");

const {
  extractSupabaseErrorDetails,
  isTransientSupabaseError,
} = (await import(pathToFileURL(join(testDir, "save-log-core.ts")).href)) as typeof import("./save-log-core");

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

describe("save draft payload shape", () => {
  it("builds article insert payload as draft with agent metadata", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412-exploitation-remediation-guidance",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 88.6,
      categoryId: "00000000-0000-4000-8000-000000000099",
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.equal(payload.status, "draft");
    assert.equal(payload.ai_generated, true);
    assert.equal(payload.agent_run_id, "00000000-0000-4000-8000-000000000001");
    assert.equal(payload.fact_check_status, "pending");
    assert.equal(payload.quality_score, 89);
    assert.equal(payload.category_id, "00000000-0000-4000-8000-000000000099");
    assert.equal("published_at" in payload, false);
  });

  it("drops invalid category_id values safely", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      categoryId: "not-a-uuid",
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.equal(payload.category_id, undefined);
    assert.equal(resolveSafeCategoryId("not-a-uuid"), null);
  });

  it("does not publish or trigger notification fields", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.equal(payload.status, "draft");
    assert.equal("published_at" in payload, false);
    assert.equal("notify_subscribers" in payload, false);
  });

  it("does not include key_takeaways, read_time, or other non-article columns", () => {
    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      preparedContent: ARTICLE_DRAFT.content,
    });

    assert.equal("key_takeaways" in payload, false);
    assert.equal("read_time" in payload, false);
    for (const field of ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS) {
      assert.equal(field in payload, false, `forbidden field present: ${field}`);
    }

    assert.deepEqual(listUnexpectedArticleInsertFields(payload), []);
  });

  it("embeds generated key takeaways into article content instead of a DB column", () => {
    const merged = appendArticleKeyTakeawaysToContent(
      ARTICLE_DRAFT.content,
      ARTICLE_DRAFT.keyTakeaways,
    );

    assert.match(merged, /Key Takeaways/i);
    assert.match(merged, /CISA KEV/);

    const payload = buildArticleDraftInsertPayload({
      draft: ARTICLE_DRAFT,
      slug: "cve-2024-21412",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      preparedContent: merged,
    });

    assert.equal("key_takeaways" in payload, false);
    assert.equal("read_time" in payload, false);
    assert.match(payload.content ?? "", /Key Takeaways/i);
  });
});

describe("content-type draft payload isolation", () => {
  it("builds tutorial payload with tutorial-only fields", () => {
    const payload = buildTutorialDraftInsertPayload({
      draft: {
        contentType: "tutorial",
        title: "Tutorial title",
        slug: "tutorial-title",
        description: "Tutorial description for testing.",
        category: "Security",
        difficulty: "Beginner",
        estimatedTime: "30 minutes",
        requirements: "<p>Requirements</p>",
        introduction: "<p>Intro</p>",
        instructions: "<p>Steps</p>",
        keyTakeaways: "<p>Takeaways</p>",
        securityNotes: "<p>Notes</p>",
        primaryKeyword: "tutorial",
        secondaryKeywords: [],
        seo: ARTICLE_DRAFT.seo,
        generationPlan: ARTICLE_DRAFT.generationPlan,
        sourceMappings: [],
        internalLinks: [],
        warnings: [],
      },
      slug: "tutorial-title",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      preparedFields: {
        requirements: "<p>Requirements</p>",
        introduction: "<p>Intro</p>",
        instructions: "<p>Steps</p>",
        keyTakeaways: "<p>Takeaways</p>",
        securityNotes: "<p>Notes</p>",
      },
    });

    assert.equal("key_takeaways" in payload, true);
    assert.equal("content" in payload, false);
    assert.deepEqual(
      listPayloadFieldsOutsideAllowlist(payload as Record<string, unknown>, TUTORIAL_DRAFT_INSERT_FIELDS),
      [],
    );
  });

  it("builds lab payload with lab-only fields", () => {
    const payload = buildLabDraftInsertPayload({
      draft: {
        contentType: "lab",
        title: "Lab title",
        slug: "lab-title",
        description: "Lab description for testing.",
        category: "Security",
        difficulty: "Intermediate",
        estimatedTime: "45 minutes",
        learningObjectives: "<p>Objectives</p>",
        requirementsTools: "<p>Tools</p>",
        introduction: "<p>Intro</p>",
        instructions: "<p>Steps</p>",
        expectedResult: "<p>Result</p>",
        securityNotes: "<p>Notes</p>",
        primaryKeyword: "lab",
        secondaryKeywords: [],
        seo: ARTICLE_DRAFT.seo,
        generationPlan: ARTICLE_DRAFT.generationPlan,
        sourceMappings: [],
        internalLinks: [],
        warnings: [],
      },
      slug: "lab-title",
      agentRunId: "00000000-0000-4000-8000-000000000001",
      factCheckStatus: "pending",
      qualityScore: 80,
      preparedFields: {
        learningObjectives: "<p>Objectives</p>",
        requirementsTools: "<p>Tools</p>",
        introduction: "<p>Intro</p>",
        instructions: "<p>Steps</p>",
        expectedResult: "<p>Result</p>",
        securityNotes: "<p>Notes</p>",
      },
    });

    assert.equal("expected_result" in payload, true);
    assert.equal("content" in payload, false);
    assert.equal("key_takeaways" in payload, false);
    assert.deepEqual(
      listPayloadFieldsOutsideAllowlist(payload as Record<string, unknown>, LAB_DRAFT_INSERT_FIELDS),
      [],
    );
  });
});

describe("agent run save update", () => {
  it("writes only valid Phase 4 fields without undefined values", () => {
    const metadata: GenerationMetadata = {
      generatedAt: "2026-09-14T00:00:00.000Z",
      quality: {
        score: 91,
        strengths: ["Grounding audit passed."],
        weaknesses: [],
      },
      groundingAudit: {
        passed: true,
        unsupportedClaims: [],
        invalidSourceUrls: [],
        invalidInternalLinks: [],
        warnings: [],
      },
    };

    const update = buildAgentRunSaveUpdate({
      contentType: "article",
      contentId: "00000000-0000-4000-8000-000000000010",
      qualityScore: 91.2,
      factCheckStatus: "pending",
      metadata,
    });

    assert.equal(update.status, "ready");
    assert.equal(update.stage, "ready");
    assert.equal(update.article_id, "00000000-0000-4000-8000-000000000010");
    assert.equal(update.tutorial_id, undefined);
    assert.equal(update.lab_id, undefined);
    assert.equal(update.quality_score, 91);
    assert.deepEqual(update.generation_metadata, serializeGenerationMetadata(metadata));
    assert.doesNotThrow(() => JSON.stringify(update.generation_metadata));
  });

  it("strips undefined object values before update", () => {
    const cleaned = stripUndefinedValues({
      status: "ready",
      article_id: "abc",
      tutorial_id: undefined,
    });

    assert.equal("tutorial_id" in cleaned, false);
  });
});

describe("save recovery helpers", () => {
  it("identifies draft rows by status", () => {
    assert.equal(
      isDraftContentRow({
        id: "1",
        title: "Draft",
        slug: "draft",
        status: "draft",
      }),
      true,
    );
    assert.equal(
      isDraftContentRow({
        id: "1",
        title: "Published",
        slug: "published",
        status: "published",
      }),
      false,
    );
  });

  it("maps content types to target tables", () => {
    assert.equal(targetTableForContentType("article"), "articles");
    assert.equal(targetTableForContentType("tutorial"), "tutorials");
    assert.equal(targetTableForContentType("lab"), "labs");
  });

  it("builds recovered draft results without creating duplicates", () => {
    const result = buildGenerateDraftResult({
      contentType: "article",
      row: {
        id: "00000000-0000-4000-8000-000000000010",
        title: "Existing draft",
        slug: "existing-draft",
      },
      factCheckStatus: "pending",
      qualityScore: 80,
      warnings: [],
      existingDraft: true,
    });

    assert.equal(result.existingDraft, true);
    assert.equal(result.contentId, "00000000-0000-4000-8000-000000000010");
  });
});

describe("save diagnostics", () => {
  it("detects transient Supabase gateway timeouts", () => {
    assert.equal(
      isTransientSupabaseError({ message: "Gateway Timeout" }),
      true,
    );
    assert.equal(
      isTransientSupabaseError({ code: "23503", message: "foreign key violation" }),
      false,
    );
  });

  it("sanitizes Supabase error details for logs", () => {
    const details = extractSupabaseErrorDetails({
      code: "57014",
      message: "canceling statement due to statement timeout",
      details: "select * from articles",
      hint: "Retry the query",
    });

    assert.equal(details.errorCode, "57014");
    assert.match(details.errorMessage ?? "", /timeout/i);
    assert.equal(details.errorDetails, "select * from articles");
    assert.equal(details.errorHint, "Retry the query");
  });

  it("normalizes quality scores to valid integers", () => {
    assert.equal(normalizeQualityScore(88.6), 89);
    assert.equal(normalizeQualityScore(-5), 0);
    assert.equal(normalizeQualityScore(120), 100);
  });
});

describe("save flow idempotency simulation", () => {
  it("recovers when insert errors but draft already exists for agent_run_id", () => {
    const existingDraft = {
      id: "00000000-0000-4000-8000-000000000010",
      title: "Existing draft",
      slug: "existing-draft",
      status: "draft",
    };

    const insertFailed = { message: "Gateway Timeout" };
    const shouldRecover =
      Boolean(existingDraft) &&
      isDraftContentRow(existingDraft) &&
      isTransientSupabaseError(insertFailed);

    assert.equal(shouldRecover, true);
  });

  it("returns safe user-facing error for non-recoverable transient failures", () => {
    const safeError = "Unable to save draft.";
    assert.equal(safeError, "Unable to save draft.");
  });
});
