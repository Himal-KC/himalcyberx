import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildArticleReviewFingerprintFields,
  buildDraftFingerprint,
  buildLabReviewFingerprintFields,
  buildTutorialReviewFingerprintFields,
  normalizeReviewTextForFingerprint,
} = (await import(pathToFileURL(join(testDir, "fingerprint-core.ts")).href)) as typeof import("./fingerprint-core");

const { validateLinkedDraftBelongsToRun } = (await import(
  pathToFileURL(join(testDir, "load-draft-core.ts")).href
)) as typeof import("./load-draft-core");

const VALID_RUN_ID = "00000000-0000-4000-8000-000000000001";
const VALID_CONTENT_ID = "00000000-0000-4000-8000-000000000010";

function buildArticleRow(content: string) {
  return {
    title: "CISA ransomware guidance",
    slug: "cisa-ransomware-guidance",
    excerpt: "Preparedness overview.",
    content: `<p>${content}</p>`,
    category_id: "00000000-0000-4000-8000-000000000099",
    seo_title: "CISA ransomware guidance",
    seo_description: "Preparedness overview.",
    og_title: "CISA ransomware guidance",
    og_description: "Preparedness overview.",
    seo_keywords: ["ransomware", "preparedness"],
  };
}

function buildSnapshotFromArticleContent(content: string) {
  const fields = buildArticleReviewFingerprintFields({
    row: buildArticleRow(content),
    metadata: {
      sourceMappings: [],
      internalLinks: [],
      generationWarnings: [],
    },
  });

  return {
    contentId: VALID_CONTENT_ID,
    contentType: "article" as const,
    agentRunId: VALID_RUN_ID,
    title: "CISA ransomware guidance",
    slug: "cisa-ransomware-guidance",
    status: "draft",
    publishedAt: null,
    draft: {
      contentType: "article" as const,
      title: "CISA ransomware guidance",
      slug: "cisa-ransomware-guidance",
      excerpt: "Preparedness overview.",
      content: `<p>${content}</p>`,
      categoryRecommendation: "Threat Intelligence",
      primaryKeyword: "ransomware",
      secondaryKeywords: [],
      keyTakeaways: [],
      seo: {
        seoTitle: "CISA ransomware guidance",
        seoDescription: "Preparedness overview.",
        seoKeywords: ["ransomware"],
        ogTitle: "CISA ransomware guidance",
        ogDescription: "Preparedness overview.",
      },
      generationPlan: {
        contentAngle: "Preparedness",
        audience: "Defenders",
        intent: "Guide",
        sectionPlan: ["Overview"],
      },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
    },
    sourceMappings: [],
    internalLinks: [],
    generationWarnings: [],
    reviewFingerprintFields: fields,
  };
}

describe("Phase 5 canonical review fingerprint", () => {
  it("changes fingerprint when article content text changes", () => {
    const before = buildDraftFingerprint(
      buildSnapshotFromArticleContent(
        "Ransomware events can require decisions outside normal working hours.",
      ),
    );
    const after = buildDraftFingerprint(
      buildSnapshotFromArticleContent(
        "Organizations should maintain tested recovery plans.",
      ),
    );

    assert.notEqual(before, after);
  });

  it("changes fingerprint when a factual sentence is removed", () => {
    const withSentence = buildDraftFingerprint(
      buildSnapshotFromArticleContent(
        "Alpha guidance. Ransomware events can require decisions outside normal working hours. Beta guidance.",
      ),
    );
    const withoutSentence = buildDraftFingerprint(
      buildSnapshotFromArticleContent("Alpha guidance. Beta guidance."),
    );

    assert.notEqual(withSentence, withoutSentence);
  });

  it("reuses cached review only when canonical fingerprint matches exactly", () => {
    const snapshot = buildSnapshotFromArticleContent("Stable draft body.");
    const first = buildDraftFingerprint(snapshot);
    const second = buildDraftFingerprint(snapshot);
    assert.equal(first, second);
  });

  it("does not hide semantic text changes behind formatting-only normalization", () => {
    const htmlA = normalizeReviewTextForFingerprint(
      "<p>Ransomware events can require decisions outside normal working hours.</p>",
    );
    const htmlB = normalizeReviewTextForFingerprint(
      "<p>Organizations should maintain tested recovery plans.</p>",
    );
    assert.notEqual(htmlA, htmlB);
  });

  it("keeps formatting-only HTML changes stable when semantic text is unchanged", () => {
    const a = buildDraftFingerprint(
      buildSnapshotFromArticleContent("Same factual sentence."),
    );
    const fields = buildArticleReviewFingerprintFields({
      row: buildArticleRow("<strong>Same factual sentence.</strong>"),
      metadata: null,
    });
    const b = buildDraftFingerprint({
      ...buildSnapshotFromArticleContent("Same factual sentence."),
      reviewFingerprintFields: fields,
    });
    assert.equal(a, b);
  });

  it("includes SEO fields in article fingerprint", () => {
    const base = buildDraftFingerprint(buildSnapshotFromArticleContent("Body."));
    const changedSeo = buildDraftFingerprint({
      ...buildSnapshotFromArticleContent("Body."),
      reviewFingerprintFields: buildArticleReviewFingerprintFields({
        row: {
          ...buildArticleRow("Body."),
          seo_title: "Changed SEO title",
        },
        metadata: null,
      }),
    });
    assert.notEqual(base, changedSeo);
  });

  it("includes category_id in article fingerprint", () => {
    const base = buildDraftFingerprint(buildSnapshotFromArticleContent("Body."));
    const changedCategory = buildDraftFingerprint({
      ...buildSnapshotFromArticleContent("Body."),
      reviewFingerprintFields: buildArticleReviewFingerprintFields({
        row: {
          ...buildArticleRow("Body."),
          category_id: "00000000-0000-4000-8000-000000000888",
        },
        metadata: null,
      }),
    });
    assert.notEqual(base, changedCategory);
  });

  it("changes tutorial fingerprint when review-relevant content changes", () => {
    const baseFields = buildTutorialReviewFingerprintFields({
      row: {
        title: "Tutorial",
        slug: "tutorial",
        description: "Desc",
        category: "Security",
        difficulty: "Beginner",
        estimated_time: "30m",
        requirements: "Req",
        introduction: "Intro",
        instructions: "Step one",
        key_takeaways: "Takeaway",
        security_notes: "Notes",
        seo_title: "Tutorial",
        seo_description: "Desc",
        og_title: "Tutorial",
        og_description: "Desc",
        seo_keywords: ["security"],
      },
      metadata: null,
    });
    const changedFields = buildTutorialReviewFingerprintFields({
      row: {
        title: "Tutorial",
        slug: "tutorial",
        description: "Desc",
        category: "Security",
        difficulty: "Beginner",
        estimated_time: "30m",
        requirements: "Req",
        introduction: "Intro",
        instructions: "Step two",
        key_takeaways: "Takeaway",
        security_notes: "Notes",
        seo_title: "Tutorial",
        seo_description: "Desc",
        og_title: "Tutorial",
        og_description: "Desc",
        seo_keywords: ["security"],
      },
      metadata: null,
    });

    assert.notEqual(
      buildDraftFingerprint({
        contentId: VALID_CONTENT_ID,
        contentType: "tutorial",
        agentRunId: VALID_RUN_ID,
        title: "Tutorial",
        slug: "tutorial",
        status: "draft",
        publishedAt: null,
        draft: {} as never,
        sourceMappings: [],
        internalLinks: [],
        generationWarnings: [],
        reviewFingerprintFields: baseFields,
      }),
      buildDraftFingerprint({
        contentId: VALID_CONTENT_ID,
        contentType: "tutorial",
        agentRunId: VALID_RUN_ID,
        title: "Tutorial",
        slug: "tutorial",
        status: "draft",
        publishedAt: null,
        draft: {} as never,
        sourceMappings: [],
        internalLinks: [],
        generationWarnings: [],
        reviewFingerprintFields: changedFields,
      }),
    );
  });

  it("changes lab fingerprint when review-relevant content changes", () => {
    const baseFields = buildLabReviewFingerprintFields({
      row: {
        title: "Lab",
        slug: "lab",
        description: "Desc",
        category: "Forensics",
        difficulty: "Intermediate",
        estimated_time: "45m",
        learning_objectives: "Objective A",
        requirements_tools: "Tools",
        introduction: "Intro",
        instructions: "Do step A",
        expected_result: "Result",
        security_notes: "Notes",
        seo_title: "Lab",
        seo_description: "Desc",
        og_title: "Lab",
        og_description: "Desc",
        seo_keywords: ["forensics"],
      },
      metadata: null,
    });
    const changedFields = buildLabReviewFingerprintFields({
      row: {
        title: "Lab",
        slug: "lab",
        description: "Desc",
        category: "Forensics",
        difficulty: "Intermediate",
        estimated_time: "45m",
        learning_objectives: "Objective B",
        requirements_tools: "Tools",
        introduction: "Intro",
        instructions: "Do step A",
        expected_result: "Result",
        security_notes: "Notes",
        seo_title: "Lab",
        seo_description: "Desc",
        og_title: "Lab",
        og_description: "Desc",
        seo_keywords: ["forensics"],
      },
      metadata: null,
    });

    assert.notEqual(
      buildDraftFingerprint({
        contentId: VALID_CONTENT_ID,
        contentType: "lab",
        agentRunId: VALID_RUN_ID,
        title: "Lab",
        slug: "lab",
        status: "draft",
        publishedAt: null,
        draft: {} as never,
        sourceMappings: [],
        internalLinks: [],
        generationWarnings: [],
        reviewFingerprintFields: baseFields,
      }),
      buildDraftFingerprint({
        contentId: VALID_CONTENT_ID,
        contentType: "lab",
        agentRunId: VALID_RUN_ID,
        title: "Lab",
        slug: "lab",
        status: "draft",
        publishedAt: null,
        draft: {} as never,
        sourceMappings: [],
        internalLinks: [],
        generationWarnings: [],
        reviewFingerprintFields: changedFields,
      }),
    );
  });

  it("rejects wrong agent_run_id relationships during draft load validation", () => {
    assert.equal(
      validateLinkedDraftBelongsToRun({
        agentRunId: VALID_RUN_ID,
        contentAgentRunId: "00000000-0000-4000-8000-000000000099",
      }),
      false,
    );
    assert.equal(
      validateLinkedDraftBelongsToRun({
        agentRunId: VALID_RUN_ID,
        contentAgentRunId: VALID_RUN_ID,
      }),
      true,
    );
  });

  it("does not accept browser-supplied fingerprint values in review engine", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    const actionSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );
    assert.doesNotMatch(engineSource, /formData\.get\(["']draftFingerprint/);
    assert.doesNotMatch(actionSource, /formData\.get\(["']draftFingerprint/);
    assert.match(engineSource, /buildDraftFingerprint\(snapshotResult\.snapshot\)/);
  });

  it("reloads CMS draft server-side before fingerprinting", () => {
    const loadSource = readFileSync(join(testDir, "load-draft.ts"), "utf8");
    assert.match(loadSource, /unstable_noStore/);
    assert.match(loadSource, /\.from\("articles"\)/);
    assert.match(loadSource, /validateLinkedDraftBelongsToRun/);
  });

  it("does not mutate review history during resume hydration", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.doesNotMatch(resumeSource, /insertAgentReview/);
    assert.doesNotMatch(resumeSource, /updateAgentReview/);
  });

  it("marks Phase 5 stale in Phase 7 when draft fingerprint differs", () => {
    const readinessSource = readFileSync(
      join(testDir, "../readiness/readiness-gate-core.ts"),
      "utf8",
    );
    assert.match(readinessSource, /REVIEW_STALE/);
    assert.match(readinessSource, /draftFingerprint !== input\.currentDraftFingerprint/);
  });

  it("does not call research or publish APIs during fingerprinting", () => {
    const fingerprintSource = readFileSync(join(testDir, "fingerprint-core.ts"), "utf8");
    assert.doesNotMatch(fingerprintSource, /openai|tavily|publishAgentContent|notifySubscriber/i);
  });

  it("uses the same draft fingerprint builder for readiness draft hash input", () => {
    const snapshot = buildSnapshotFromArticleContent("Shared body.");
    const draftFingerprint = buildDraftFingerprint(snapshot);
    assert.match(draftFingerprint, /^[a-f0-9]{64}$/);
  });
});
