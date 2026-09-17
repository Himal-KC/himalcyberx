import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AgentReviewRecord, ReviewDraftSnapshot } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildPhase5HumanReviewAcceptanceRecord,
  isPhase5HumanAcceptanceCurrentlyValid,
} = (await import(
  pathToFileURL(join(testDir, "human-acceptance-core.ts")).href
)) as typeof import("./human-acceptance-core");

const revisionCore = (await import(
  pathToFileURL(join(testDir, "automatic-revision-core.ts")).href
)) as typeof import("./automatic-revision-core");

const FINGERPRINT_A = "a".repeat(64);
const FINGERPRINT_B = "b".repeat(64);
const RUN_ID = "00000000-0000-4000-8000-000000000001";

function buildReview(
  overrides: Partial<AgentReviewRecord> = {},
): AgentReviewRecord {
  return {
    id: "review-1",
    agentRunId: RUN_ID,
    contentType: "article",
    contentId: "article-1",
    status: "needs_review",
    factCheckStatus: "needs_review",
    reviewModel: "test",
    reviewVersion: "phase5-v1",
    draftFingerprint: FINGERPRINT_A,
    qualityScore: 84,
    summary: "Advisory review",
    findings: [],
    qualityBreakdown: {
      factualGrounding: 85,
      sourceIntegrity: 90,
      technicalAccuracy: 80,
      seoStructure: 82,
      readability: 88,
      originality: 90,
      internalLinkIntegrity: 95,
    },
    unsupportedClaims: [],
    conflictingClaims: [],
    sourceIntegrity: { passed: true, issues: [] },
    internalLinkIntegrity: { passed: true, issues: [] },
    seoReview: { score: 80, summary: "ok", issues: [] },
    readabilityReview: null,
    originalityReview: null,
    safetyReview: null,
    publicationRecommendation: null,
    warnings: [],
    reusedFromCache: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildSnapshot(): ReviewDraftSnapshot {
  return {
    contentId: "article-1",
    contentType: "article",
    agentRunId: RUN_ID,
    title: "How Phishing Attacks Steal Microsoft 365 Credentials",
    slug: "microsoft-365-phishing",
    status: "draft",
    publishedAt: null,
    draft: {
      contentType: "article",
      title: "How Phishing Attacks Steal Microsoft 365 Credentials",
      slug: "microsoft-365-phishing",
      excerpt: "Organizations face phishing risk against Microsoft 365 tenants.",
      content: "<p>Evidence-aligned body content about phishing risk reduction.</p>",
      categoryRecommendation: "Phishing",
      primaryKeyword: "Microsoft 365 phishing",
      secondaryKeywords: [],
      keyTakeaways: ["Enable phishing-resistant MFA."],
      seo: {
        seoTitle: "How Phishing Attacks Steal Microsoft 365 Credentials",
        seoDescription:
          "Learn how phishing targets Microsoft 365 and how organizations can reduce account compromise risk.",
        seoKeywords: ["Microsoft 365", "phishing"],
        ogTitle: "How Phishing Attacks Steal Microsoft 365 Credentials",
        ogDescription:
          "Learn how phishing targets Microsoft 365 and how organizations can reduce account compromise risk.",
      },
      generationPlan: {
        contentAngle: "Phishing risk reduction",
        audience: "Security teams",
        intent: "Inform",
        sectionPlan: ["Overview", "Sources"],
      },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
    },
    sourceMappings: [],
    internalLinks: [],
    generationWarnings: [],
    reviewFingerprintFields: {},
  };
}

const passedGrounding = {
  passed: true,
  unsupportedClaims: [],
  invalidSourceUrls: [],
  invalidInternalLinks: [],
  warnings: [],
};

describe("Phase 5 automatic safe revision eligibility", () => {
  it("marks advisory needs_review with editorial scope findings as eligible", () => {
    const review = buildReview({
      findings: [
        {
          findingId: "f1",
          severity: "minor",
          claimType: "general",
          claimText: "Title overstates credential theft mechanism",
          status: "partially_supported",
          evidenceSourceIds: [],
          explanation: "Title scope is broader than verified evidence supports.",
          suggestedCorrection:
            "Narrow title to phishing and account compromise risk reduction.",
        },
      ],
    });

    const result = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot: buildSnapshot(),
    });

    assert.equal(result.status, "eligible");
    assert.ok(result.plan);
  });

  it("blocks material conflicting claims", () => {
    const review = buildReview({
      findings: [
        {
          findingId: "f1",
          severity: "critical",
          claimType: "security_impact",
          claimText: "Critical unsupported impact claim",
          status: "conflicting",
          evidenceSourceIds: [],
          explanation: "Conflicts with verified evidence.",
          suggestedCorrection: null,
        },
      ],
    });

    const result = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot: buildSnapshot(),
    });

    assert.equal(result.status, "blocked");
  });

  it("blocks stale review fingerprints", () => {
    const result = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review: buildReview({ draftFingerprint: FINGERPRINT_B }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot: buildSnapshot(),
    });

    assert.equal(result.status, "blocked");
    assert.match(result.reason, /stale/i);
  });

  it("blocks when max attempts reached", () => {
    const result = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
      metadata: {
        phase5AutomaticRevision: {
          version: "phase5-auto-revision-v1",
          attempts: 2,
          lastCompletedKey: null,
          lastStatus: "failed",
          previousReviewId: "review-1",
          previousFingerprint: FINGERPRINT_A,
          revisedFingerprint: null,
          revisedAt: null,
          actions: [],
          changeSummary: [],
          failureReason: "failed",
        },
      },
      snapshot: buildSnapshot(),
    });

    assert.equal(result.status, "blocked");
  });

  it("returns not_needed for pass reviews", () => {
    const result = revisionCore.assessAutomaticRevisionEligibility({
      agentRunId: RUN_ID,
      review: buildReview({ status: "pass", factCheckStatus: "passed" }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
      metadata: null,
      snapshot: buildSnapshot(),
    });

    assert.equal(result.status, "not_needed");
  });
});

describe("Phase 5 automatic revision helpers", () => {
  it("repairs duplicated featured image alt text", () => {
    const title =
      "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk";
    const alt = revisionCore.repairFeaturedImageAltText({
      title,
      currentAlt: `${title}: ${title}`,
      visualConcept: "Enterprise cloud email security environment",
    });

    assert.ok(alt);
    assert.ok(alt.length >= 80);
    assert.ok(alt.length <= 160);
    assert.doesNotMatch(alt, new RegExp(`${title}: ${title}`));
  });

  it("preserves slug and source mappings when merging revised draft", () => {
    const snapshot = buildSnapshot();
    snapshot.draft.sourceMappings = [
      {
        sectionKey: "intro",
        claim: "Verified claim",
        sourceUrls: ["https://www.cisa.gov/phishing"],
      },
    ];

    const merged = revisionCore.mergeRevisedDraftWithSnapshot({
      snapshot,
      revisedDraft: {
        ...snapshot.draft,
        title:
          "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk",
        slug: "changed-slug-should-not-win-for-published",
        sourceMappings: [
          {
            sectionKey: "intro",
            claim: "Bad",
            sourceUrls: ["https://evil.example/not-allowed"],
          },
        ],
      },
    });

    assert.equal(merged.slug, snapshot.draft.slug);
    assert.deepEqual(merged.sourceMappings, snapshot.draft.sourceMappings);
  });

  it("invalidates prior human acceptance after fingerprint change", () => {
    const review = buildReview();
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review,
        currentDraftFingerprint: FINGERPRINT_B,
      }),
      false,
    );
  });

  it("treats completed revision idempotency key as non-repeatable", () => {
    const key = revisionCore.buildRevisionIdempotencyKey("review-1", FINGERPRINT_A);
    assert.equal(
      revisionCore.revisionAlreadyCompletedForReview({
        metadata: {
          phase5AutomaticRevision: {
            version: "phase5-auto-revision-v1",
            attempts: 1,
            lastCompletedKey: key,
            lastStatus: "completed",
            previousReviewId: "review-1",
            previousFingerprint: FINGERPRINT_A,
            revisedFingerprint: FINGERPRINT_B,
            revisedAt: new Date().toISOString(),
            actions: [],
            changeSummary: [],
            failureReason: null,
          },
        },
        agentReviewId: "review-1",
        sourceDraftFingerprint: FINGERPRINT_A,
      }),
      true,
    );
  });
});

describe("Phase 5 automatic revision engine boundaries", () => {
  it("re-runs Phase 5 review after save and does not call research, image, or publish", () => {
    const engineSource = readFileSync(
      join(testDir, "automatic-revision-engine.ts"),
      "utf8",
    );
    assert.match(engineSource, /runAgentReview\(/);
    assert.doesNotMatch(engineSource, /runAgentResearch/);
    assert.doesNotMatch(engineSource, /runAgentFeaturedImageGeneration/);
    assert.doesNotMatch(engineSource, /runAgentContentPublication/);
    assert.doesNotMatch(engineSource, /publishArticle/);
  });

  it("validates revised drafts before CMS overwrite", () => {
    const engineSource = readFileSync(
      join(testDir, "automatic-revision-engine.ts"),
      "utf8",
    );
    assert.match(engineSource, /validateRevisedDraftBeforeSave/);
    assert.match(engineSource, /currentDraftFingerprint/);
  });

  it("resume hydration exposes automatic revision state without model calls", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.match(resumeSource, /buildAutomaticRevisionUiState/);
    assert.doesNotMatch(resumeSource, /reviseDraftWithOpenAi/);
    assert.doesNotMatch(resumeSource, /runPhase5AutomaticSafeRevision/);
  });
});

describe("Phase 5 automatic revision fingerprint", () => {
  it("updates merged draft title and SEO fields for evidence-aligned narrowing", () => {
    const snapshot = buildSnapshot();
    const narrowed = revisionCore.mergeRevisedDraftWithSnapshot({
      snapshot,
      revisedDraft: {
        ...snapshot.draft,
        title:
          "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk",
        seo: {
          ...snapshot.draft.seo,
          seoTitle:
            "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk",
          ogTitle:
            "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk",
        },
      },
    });

    assert.notEqual(narrowed.title, snapshot.draft.title);
    assert.match(narrowed.seo.seoTitle, /Reduce Microsoft 365 Phishing/i);
  });
});
