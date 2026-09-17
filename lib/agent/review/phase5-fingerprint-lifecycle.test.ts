import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AgentReviewRecord } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const fp = (await import(pathToFileURL(join(testDir, "fingerprint-core.ts")).href)) as typeof import("./fingerprint-core");
const workflow = (await import(
  pathToFileURL(join(testDir, "phase5-workflow-ui-core.ts")).href
)) as typeof import("./phase5-workflow-ui-core");
const revisionCore = (await import(
  pathToFileURL(join(testDir, "automatic-revision-core.ts")).href
)) as typeof import("./automatic-revision-core");
const humanCore = (await import(
  pathToFileURL(join(testDir, "human-acceptance-core.ts")).href
)) as typeof import("./human-acceptance-core");
const { evaluateReadinessGate } = (await import(
  pathToFileURL(join(testDir, "../readiness/readiness-gate-core.ts")).href
)) as typeof import("../readiness/readiness-gate-core");
const { buildReadinessFingerprint } = (await import(
  pathToFileURL(join(testDir, "../readiness/readiness-fingerprint-core.ts")).href
)) as typeof import("../readiness/readiness-fingerprint-core");
const cleanupCore = (await import(
  pathToFileURL(join(testDir, "../content/deterministic-cleanup-core.ts")).href
)) as typeof import("../content/deterministic-cleanup-core");

const RUN_ID = "00000000-0000-4000-8000-000000000001";
const CONTENT_ID = "00000000-0000-4000-8000-000000000010";
const FINGERPRINT_A = "a".repeat(64);

const passedGrounding = {
  passed: true,
  unsupportedClaims: [],
  invalidSourceUrls: [],
  invalidInternalLinks: [],
  warnings: [],
};

function buildReview(overrides: Partial<AgentReviewRecord> = {}): AgentReviewRecord {
  return {
    id: "review-1",
    agentRunId: RUN_ID,
    contentType: "article",
    contentId: CONTENT_ID,
    status: "needs_review",
    factCheckStatus: "needs_review",
    reviewModel: "gpt-5.6-sol",
    reviewVersion: "phase5-v1",
    draftFingerprint: FINGERPRINT_A,
    qualityScore: 93,
    summary: "Summary",
    findings: [],
    qualityBreakdown: {
      factualGrounding: 90,
      sourceIntegrity: 90,
      technicalAccuracy: 90,
      seoStructure: 90,
      readability: 90,
      originality: 90,
      internalLinkIntegrity: 100,
    },
    unsupportedClaims: [],
    conflictingClaims: [],
    sourceIntegrity: { passed: true, issues: [] },
    internalLinkIntegrity: { passed: true, issues: [] },
    seoReview: { score: 90, summary: "OK", issues: [] },
    readabilityReview: { score: 90, summary: "OK", issues: [] },
    originalityReview: { score: 90, summary: "OK", issues: [] },
    safetyReview: { score: 90, summary: "OK", issues: [] },
    publicationRecommendation: "ready_with_review",
    warnings: [],
    reusedFromCache: false,
    createdAt: "2026-09-17T00:00:00.000Z",
    updatedAt: "2026-09-17T00:00:00.000Z",
    ...overrides,
  };
}

function buildSnapshot(content: string) {
  const fields = fp.buildArticleReviewFingerprintFields({
    row: {
      title: "Title",
      slug: "title-slug",
      excerpt: "Excerpt",
      content: `<p>${content}</p>`,
      category_id: null,
      seo_title: "Title",
      seo_description: "Excerpt",
      og_title: "Title",
      og_description: "Excerpt",
      seo_keywords: ["security"],
    },
    metadata: { sourceMappings: [], internalLinks: [], generationWarnings: [] },
  });

  const snapshot = {
    contentId: CONTENT_ID,
    contentType: "article" as const,
    agentRunId: RUN_ID,
    title: "Title",
    slug: "title-slug",
    status: "draft",
    publishedAt: null,
    draft: { contentType: "article" as const, title: "Title", slug: "title-slug", content: `<p>${content}</p>` },
    sourceMappings: [],
    internalLinks: [],
    generationWarnings: [],
    reviewFingerprintFields: fields,
  };

  return {
    snapshot: snapshot as unknown as import("./types").ReviewDraftSnapshot,
    fingerprint: fp.getCurrentDraftFingerprintFromSnapshot(
      snapshot as unknown as import("./types").ReviewDraftSnapshot,
    ),
  };
}

describe("Phase 5 review fingerprint lifecycle", () => {
  it("keeps a fresh review current immediately after completion", () => {
    const { snapshot, fingerprint } = buildSnapshot("Stable body copy.");
    const review = buildReview({ draftFingerprint: fingerprint });
    const current = fp.getCurrentDraftFingerprintFromSnapshot(snapshot);

    assert.equal(review.draftFingerprint, current);
    assert.equal(workflow.isPhase5ReviewCurrentForDraft({ review, currentDraftFingerprint: current }), true);
  });

  it("allows human acceptance for fresh needs_review when grounding passes", () => {
    const { snapshot, fingerprint } = buildSnapshot("Stable body copy.");
    const current = fingerprint;
    const review = buildReview({ draftFingerprint: current });
    const ui = workflow.buildPhase5WorkflowUiState({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: current,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot,
    });

    assert.equal(ui.phase5HumanAcceptance?.canAccept, true);
  });

  it("does not falsely block automatic revision as stale for a fresh review", () => {
    const { snapshot, fingerprint } = buildSnapshot("Stable body copy.");
    const review = buildReview({ draftFingerprint: fingerprint });

    const eligibility = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: fingerprint,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot,
    });

    assert.notEqual(eligibility.reason, "The Phase 5 review is stale for the current draft.");
  });

  it("Phase 7 does not mark a matching fresh review stale", () => {
    const { fingerprint } = buildSnapshot("Stable body copy.");
    const current = fingerprint;
    const review = buildReview({ draftFingerprint: current });
    const gate = evaluateReadinessGate({
      content: {
        contentType: "article",
        id: CONTENT_ID,
        title: "Title",
        slug: "title-slug",
        excerpt: "Excerpt",
        content: "<p>Stable body copy.</p>",
        author: null,
        categoryId: null,
        status: "draft",
        featuredImage: "https://example.com/a.webp",
        featuredImageAlt: "Alt text long enough for accessibility review checks here",
        seoTitle: "Title",
        seoDescription: "Excerpt",
        ogTitle: "Title",
        ogDescription: "Excerpt",
        factCheckStatus: "needs_review",
      },
      review,
      currentDraftFingerprint: current,
      groundingAudit: passedGrounding,
      invalidSourceUrls: [],
      invalidInternalLinks: [],
      latestFeaturedImage: null,
      categoriesAvailable: true,
      phase5HumanAcceptance: null,
    });

    assert.equal(
      gate.issues.some((entry) => entry.code === "REVIEW_STALE"),
      false,
    );
  });

  it("resume-style stale flag stays false when fingerprints match", () => {
    const { fingerprint } = buildSnapshot("Stable body copy.");
    const current = fingerprint;
    const review = buildReview({ draftFingerprint: current });

    assert.equal(review.draftFingerprint !== current, false);
  });

  it("marks review stale after real CMS content edit", () => {
    const { snapshot: beforeSnapshot, fingerprint: beforeFingerprint } = buildSnapshot(
      "Original body copy.",
    );
    const afterFields = fp.buildArticleReviewFingerprintFields({
      row: {
        title: "Title",
        slug: "title-slug",
        excerpt: "Excerpt",
        content: "<p>Edited body copy.</p>",
        category_id: null,
        seo_title: "Title",
        seo_description: "Excerpt",
        og_title: "Title",
        og_description: "Excerpt",
        seo_keywords: ["security"],
      },
      metadata: { sourceMappings: [], internalLinks: [], generationWarnings: [] },
    });
    const afterSnapshot = {
      ...beforeSnapshot,
      reviewFingerprintFields: afterFields,
    } as unknown as import("./types").ReviewDraftSnapshot;
    const afterFingerprint = fp.getCurrentDraftFingerprintFromSnapshot(afterSnapshot);
    const review = buildReview({ draftFingerprint: beforeFingerprint });

    assert.notEqual(beforeFingerprint, afterFingerprint);
    assert.equal(
      humanCore.assessPhase5HumanAcceptanceEligibility({
        agentRunId: RUN_ID,
        review,
        currentDraftFingerprint: afterFingerprint,
        groundingAudit: passedGrounding,
      }).eligible,
      false,
    );
  });

  it("does not change draft fingerprint when only fact-check metadata is persisted", () => {
    const { fingerprint: first } = buildSnapshot("Stable body copy.");
    const { fingerprint: second } = buildSnapshot("Stable body copy.");

    assert.equal(first, second);
  });

  it("changes readiness fingerprint when featured-image alt changes", () => {
    const { snapshot, fingerprint } = buildSnapshot("Stable body copy.");
    const current = fingerprint;
    const reviewFingerprint = current;
    const base = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "Title",
        seoDescription: "Excerpt",
        ogTitle: "Title",
        ogDescription: "Excerpt",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Original alt text long enough for accessibility checks",
      reviewFingerprint,
    });
    const changedAlt = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "Title",
        seoDescription: "Excerpt",
        ogTitle: "Title",
        ogDescription: "Excerpt",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Updated alt text long enough for accessibility checks",
      reviewFingerprint,
    });

    assert.notEqual(base, changedAlt);
    assert.equal(current, reviewFingerprint);
  });

  it("expects deterministic cleanup body changes to alter draft fingerprint", () => {
    const draft = {
      contentType: "article" as const,
      title: "Title",
      slug: "title-slug",
      excerpt: "Excerpt",
      content:
        "<p>Body</p><h2>Key Takeaways</h2><ul><li>A</li></ul><h2>Key Takeaways</h2><ul><li>B</li></ul>",
      categoryRecommendation: "Security",
      primaryKeyword: "security",
      secondaryKeywords: [],
      keyTakeaways: [],
      seo: {
        seoTitle: "Title",
        seoDescription: "Excerpt",
        seoKeywords: ["security"],
        ogTitle: "Title",
        ogDescription: "Excerpt",
      },
      generationPlan: {
        contentAngle: "Angle",
        audience: "Teams",
        intent: "Inform",
        sectionPlan: ["Overview"],
      },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
    };
    const beforeSnapshot = {
      contentId: CONTENT_ID,
      contentType: "article" as const,
      agentRunId: RUN_ID,
      title: "Title",
      slug: "title-slug",
      status: "draft",
      publishedAt: null,
      draft,
      sourceMappings: [],
      internalLinks: [],
      generationWarnings: [],
      reviewFingerprintFields: null,
    };
    const cleaned = cleanupCore.applyArticleDeterministicCleanup({
      draft,
      slug: "title-slug",
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks here",
    });
    const afterSnapshot = { ...beforeSnapshot, draft: cleaned.draft, reviewFingerprintFields: null } as unknown as import("./types").ReviewDraftSnapshot;

    assert.notEqual(
      fp.getCurrentDraftFingerprintFromSnapshot(
        beforeSnapshot as unknown as import("./types").ReviewDraftSnapshot,
      ),
      fp.getCurrentDraftFingerprintFromSnapshot(afterSnapshot),
    );
  });

  it("does not call publish, email, research, or image generation in review engine", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.doesNotMatch(engineSource, /runAgentContentPublication/);
    assert.doesNotMatch(engineSource, /notify_subscribers/);
    assert.doesNotMatch(engineSource, /runAgentResearch/);
    assert.doesNotMatch(engineSource, /generateFeaturedImage/);
    assert.match(engineSource, /loadReviewDraftSnapshot\(supabase, run\)/);
    assert.match(engineSource, /draftFingerprintForSave/);
  });
});
