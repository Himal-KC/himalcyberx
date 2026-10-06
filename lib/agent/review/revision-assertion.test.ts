import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "../generation/types";
import type { AgentReviewRecord } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const assertion = (await import(
  pathToFileURL(join(testDir, "revision-assertion-core.ts")).href
)) as typeof import("./revision-assertion-core");

const postcondition = (await import(
  pathToFileURL(join(testDir, "revision-postcondition-core.ts")).href
)) as typeof import("./revision-postcondition-core");

const revisionCore = (await import(
  pathToFileURL(join(testDir, "automatic-revision-core.ts")).href
)) as typeof import("./automatic-revision-core");

const CVE = "CVE-2026-88771";

const POSITIVE_ASSERTION =
  `${CVE} is an improper input-validation flaw enabling unauthenticated remote code execution.`;

const EVIDENCE_LIMITATION =
  `The supplied verified evidence does not establish that ${CVE} is an improper input-validation flaw or enables unauthenticated remote code execution.`;

function buildDraft(
  surfaces: Partial<{
    title: string;
    excerpt: string;
    content: string;
    keyTakeaways: string[];
    seoTitle: string;
    seoDescription: string;
    ogTitle: string;
    ogDescription: string;
  }>,
): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: surfaces.title ?? "Verified scope analysis",
    slug: "verified-scope-analysis",
    excerpt: surfaces.excerpt ?? "Verified product scope.",
    content: surfaces.content ?? "<p>Verified scope.</p>",
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: CVE,
    secondaryKeywords: [],
    keyTakeaways: surfaces.keyTakeaways ?? ["Prioritize verified remediation."],
    seo: {
      seoTitle: surfaces.seoTitle ?? "Verified scope analysis",
      seoDescription: surfaces.seoDescription ?? "Verified scope guidance.",
      seoKeywords: ["NetScaler"],
      ogTitle: surfaces.ogTitle ?? "Verified scope analysis",
      ogDescription: surfaces.ogDescription ?? "Verified scope guidance.",
    },
    generationPlan: {
      contentAngle: "Defender scope",
      audience: "Security teams",
      intent: "Inform",
      sectionPlan: ["Scope"],
    },
    sourceMappings: [],
    internalLinks: [],
    warnings: [],
  };
}

function buildReview(): AgentReviewRecord {
  return {
    id: "review-1",
    agentRunId: "run-1",
    contentType: "article",
    contentId: "article-1",
    status: "needs_review",
    factCheckStatus: "needs_review",
    reviewModel: "test",
    reviewVersion: "phase5-v1",
    draftFingerprint: "abc",
    qualityScore: 85,
    summary: "Needs review",
    findings: [
      {
        findingId: "F-tech",
        severity: "minor",
        claimType: "general",
        claimText:
          "The detailed characterization of the vulnerability as an improper input-validation flaw enabling unauthenticated remote code execution in both NetScaler ADC and Gateway",
        status: "partially_supported",
        evidenceSourceIds: [],
        explanation:
          "That full technical characterization is not established by the supplied verified claims.",
        suggestedCorrection:
          "Remove or qualify the improper input-validation and unauthenticated remote code execution characterization.",
      },
    ],
    qualityBreakdown: {
      factualGrounding: 80,
      sourceIntegrity: 90,
      technicalAccuracy: 70,
      seoStructure: 85,
      readability: 88,
      originality: 90,
      internalLinkIntegrity: 80,
    },
    unsupportedClaims: [],
    conflictingClaims: [],
    sourceIntegrity: { passed: true, issues: [] },
    internalLinkIntegrity: { passed: true, issues: [] },
    seoReview: null,
    readabilityReview: null,
    originalityReview: null,
    safetyReview: null,
    publicationRecommendation: null,
    warnings: [],
    reusedFromCache: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("revision assertion detection", () => {
  it("FAIL: detects positive mechanism assertion in body", () => {
    assert.equal(
      assertion.sentenceContainsUnsupportedAssertion(POSITIVE_ASSERTION),
      true,
    );
  });

  it("PASS: treats evidence-limitation wording as non-assertion", () => {
    assert.equal(
      assertion.sentenceContainsUnsupportedAssertion(EVIDENCE_LIMITATION),
      false,
    );
  });

  it("FAIL: detects positive assertion on each factual surface", () => {
    const surfaces = [
      "title",
      "excerpt",
      "content",
      "keyTakeaways",
      "seoTitle",
      "seoDescription",
      "ogTitle",
      "ogDescription",
    ] as const;

    for (const surface of surfaces) {
      const draft = buildDraft({
        [surface]:
          surface === "content"
            ? `<p>${POSITIVE_ASSERTION}</p>`
            : surface === "keyTakeaways"
              ? [POSITIVE_ASSERTION]
              : POSITIVE_ASSERTION,
      });

      const located = assertion.locateUnsupportedAssertionInDraft(draft);
      assert.ok(located, `expected failure on ${surface}`);
    }
  });

  it("PASS: allows evidence-limitation wording on every factual surface", () => {
    const limitationDraft = buildDraft({
      title: EVIDENCE_LIMITATION,
      excerpt: EVIDENCE_LIMITATION,
      content: `<p>${EVIDENCE_LIMITATION}</p>`,
      keyTakeaways: [EVIDENCE_LIMITATION],
      seoTitle: EVIDENCE_LIMITATION,
      seoDescription: EVIDENCE_LIMITATION,
      ogTitle: EVIDENCE_LIMITATION,
      ogDescription: EVIDENCE_LIMITATION,
    });

    assert.equal(assertion.locateUnsupportedAssertionInDraft(limitationDraft), null);
  });
});

describe("revision postcondition with assertion semantics", () => {
  it("PASS: postcondition accepts qualified evidence-limitation replacement in body", () => {
    const review = buildReview();
    const plan = revisionCore.buildAutomaticRevisionPlan({
      agentRunId: "run-1",
      review,
      sourceDraftFingerprint: "abc",
    });
    assert.ok(plan);

    const result = postcondition.verifyRevisionPostconditions({
      plan: plan!,
      review,
      revisedDraft: buildDraft({
        content: `<p>${EVIDENCE_LIMITATION}</p>`,
      }),
    });

    assert.equal(result.ok, true, result.failures.join("; "));
  });

  it("FAIL: postcondition rejects when SEO retains positive assertion after body fix", () => {
    const review = buildReview();
    const plan = revisionCore.buildAutomaticRevisionPlan({
      agentRunId: "run-1",
      review,
      sourceDraftFingerprint: "abc",
    });
    assert.ok(plan);

    const result = postcondition.verifyRevisionPostconditions({
      plan: plan!,
      review,
      revisedDraft: buildDraft({
        content: `<p>${EVIDENCE_LIMITATION}</p>`,
        seoDescription: POSITIVE_ASSERTION,
      }),
    });

    assert.equal(result.ok, false);
    assert.match(result.failures.join("; "), /seo_description/);
  });
});
