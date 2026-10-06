import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "../generation/types";
import type { AgentReviewRecord } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const postcondition = (await import(
  pathToFileURL(join(testDir, "revision-postcondition-core.ts")).href
)) as typeof import("./revision-postcondition-core");

const revisionCore = (await import(
  pathToFileURL(join(testDir, "automatic-revision-core.ts")).href
)) as typeof import("./automatic-revision-core");

const discoveryPrompt = (await import(
  pathToFileURL(join(testDir, "discovery-prompt-core.ts")).href
)) as typeof import("./discovery-prompt-core");

const UNSUPPORTED_FINDING_TEXT =
  "The detailed characterization of the vulnerability as an improper input-validation flaw enabling unauthenticated remote code execution in both NetScaler ADC and Gateway";

function buildArticleDraft(overrides: Partial<ArticleGeneratedDraft> = {}): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: "Citrix NetScaler Security Analysis",
    slug: "citrix-netscaler-security-analysis",
    excerpt: "Scope and inventory guidance for verified Citrix NetScaler products.",
    content: "<p>Verified product scope only.</p>",
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: "CVE-2026-88771",
    secondaryKeywords: [],
    keyTakeaways: ["Prioritize verified Citrix NetScaler remediation."],
    seo: {
      seoTitle: "Citrix NetScaler Security Analysis",
      seoDescription: "Verified Citrix NetScaler scope and remediation guidance.",
      seoKeywords: ["Citrix", "NetScaler"],
      ogTitle: "Citrix NetScaler Security Analysis",
      ogDescription: "Verified Citrix NetScaler scope and remediation guidance.",
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
    ...overrides,
  };
}

function buildReview(): AgentReviewRecord {
  return {
    id: "review-citrix",
    agentRunId: "run-1",
    contentType: "article",
    contentId: "5664cdba-92ef-414f-860b-65647437b8d6",
    status: "needs_review",
    factCheckStatus: "needs_review",
    reviewModel: "test",
    reviewVersion: "phase5-v1",
    draftFingerprint: "abc",
    qualityScore: 89,
    summary: "Needs review",
    findings: [
      {
        findingId: "F-unsupported-tech",
        severity: "minor",
        claimType: "general",
        claimText: UNSUPPORTED_FINDING_TEXT,
        status: "partially_supported",
        evidenceSourceIds: [],
        explanation:
          "That full technical characterization is not established by the supplied verified claims.",
        suggestedCorrection:
          "Remove or qualify the improper input-validation and unauthenticated remote code execution characterization; limit scope to verified Citrix NetScaler and ADC evidence.",
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
    seoReview: { score: 80, summary: "ok", issues: ["Align SEO with verified scope"] },
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

describe("Phase 5 safe revision postconditions (Citrix RCE characterization)", () => {
  it("fails postcondition when unsupported characterization remains anywhere in draft surfaces", () => {
    const review = buildReview();
    const plan = revisionCore.buildAutomaticRevisionPlan({
      agentRunId: "run-1",
      review,
      sourceDraftFingerprint: "abc",
    });
    assert.ok(plan);

    const stillUnsupported = buildArticleDraft({
      content:
        "<p>This issue involves an improper input-validation flaw enabling unauthenticated remote code execution across Citrix NetScaler ADC and Gateway.</p>",
      seo: {
        ...buildArticleDraft().seo,
        seoDescription:
          "Analysis of improper input-validation and unauthenticated remote code execution risk.",
      },
    });

    const result = postcondition.verifyRevisionPostconditions({
      plan: plan!,
      review,
      revisedDraft: stillUnsupported,
    });

    assert.equal(result.ok, false);
    assert.ok(result.failures.length > 0);
  });

  it("passes postcondition when unsupported characterization is removed from all surfaces", () => {
    const review = buildReview();
    const plan = revisionCore.buildAutomaticRevisionPlan({
      agentRunId: "run-1",
      review,
      sourceDraftFingerprint: "abc",
    });
    assert.ok(plan);

    const revised = buildArticleDraft({
      content:
        "<p>Verified research establishes affected Citrix NetScaler and Citrix NetScaler ADC scope. Mechanistic exploit details are not established in supplied verified claims.</p>",
      excerpt: "Verified Citrix NetScaler and ADC inventory scope.",
      seo: {
        ...buildArticleDraft().seo,
        seoDescription: "Verified Citrix NetScaler and ADC scope and remediation guidance.",
      },
    });

    const result = postcondition.verifyRevisionPostconditions({
      plan: plan!,
      review,
      revisedDraft: revised,
    });

    assert.equal(result.ok, true, result.failures.join("; "));
  });

  it("does not emit completed change summary lines for unverified actions", () => {
    const summary = revisionCore.buildRevisionChangeSummary(
      [
        {
          field: "draft",
          issueType: "unsupported_explanation",
          instruction: "Remove unsupported characterization",
          evidenceClaimIds: [],
          sourceIds: [],
          findingId: "F-unsupported-tech",
        },
      ],
      new Set<string>(),
    );

    assert.equal(summary.length, 0);
  });
});

describe("discovery-only prompt deduplication", () => {
  it("omits discovery-only entries when the same URL is an authoritative source", () => {
    const shared = "https://github.com/citrix-hardening/Security-advisories";
    const filtered = discoveryPrompt.filterDiscoveryOnlyContextsForPrompt(
      [
        {
          url: shared,
          title: "GitHub advisory excerpt",
          publisher: "GitHub",
          excerpt: "Discovery excerpt",
        },
        {
          url: "https://example.com/unlisted",
          title: "Unlisted discovery",
          publisher: null,
          excerpt: null,
        },
      ],
      [
        {
          id: "source-github",
          title: "Citrix GitHub Security-advisories",
          url: shared,
          publisher: "GitHub",
          sourceType: "official",
        },
      ],
    );

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.url, "https://example.com/unlisted");
  });
});
