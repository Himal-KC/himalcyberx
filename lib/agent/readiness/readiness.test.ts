import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AgentReviewRecord } from "../review/types";
import type { GeneratedDraft } from "../generation/types";
import type { ReviewDraftSnapshot } from "../review/types";
import type {
  ReadinessArticleContent,
  ReadinessLabContent,
  ReadinessTutorialContent,
} from "./readiness-gate-core";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildAgentRunReadinessMetadataUpdate,
  buildPersistedReadinessResult,
  calculateReadinessScore,
  evaluateAltTextQuality,
  evaluateReadinessGate,
  resolveReadinessStatus,
} = (await import(pathToFileURL(join(testDir, "readiness-gate-core.ts")).href)) as typeof import("./readiness-gate-core");

const {
  buildReadinessFingerprint,
  isPersistedReadinessStale,
} = (await import(pathToFileURL(join(testDir, "readiness-fingerprint-core.ts")).href)) as typeof import("./readiness-fingerprint-core");

const { diagnosticsContainSecrets } = (await import(
  pathToFileURL(join(testDir, "readiness-log-core.ts")).href
)) as typeof import("./readiness-log-core");

const VALID_RUN_ID = "00000000-0000-4000-8000-000000000001";
const VALID_CONTENT_ID = "00000000-0000-4000-8000-000000000010";
const FINGERPRINT_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const FINGERPRINT_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function buildReview(overrides: Partial<AgentReviewRecord> = {}): AgentReviewRecord {
  return {
    id: "00000000-0000-4000-8000-000000000100",
    agentRunId: VALID_RUN_ID,
    contentType: "article",
    contentId: VALID_CONTENT_ID,
    status: "pass",
    factCheckStatus: "passed",
    reviewModel: "gpt-5.6-sol",
    reviewVersion: "phase5-v1",
    draftFingerprint: FINGERPRINT_A,
    qualityScore: 88,
    summary: "Review summary",
    findings: [],
    qualityBreakdown: {
      factualGrounding: 90,
      sourceIntegrity: 90,
      technicalAccuracy: 90,
      seoStructure: 85,
      readability: 85,
      originality: 85,
      internalLinkIntegrity: 100,
    },
    unsupportedClaims: [],
    conflictingClaims: [],
    sourceIntegrity: { passed: true, issues: [] },
    internalLinkIntegrity: { passed: true, issues: [] },
    seoReview: { score: 85, summary: "OK", issues: [] },
    readabilityReview: { score: 85, summary: "OK", issues: [] },
    originalityReview: { score: 85, summary: "OK", issues: [] },
    safetyReview: { score: 90, summary: "OK", issues: [] },
    publicationRecommendation: "ready_with_review",
    warnings: [],
    reusedFromCache: false,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildSnapshot(overrides: Partial<ReviewDraftSnapshot> = {}): ReviewDraftSnapshot {
  return {
    contentId: VALID_CONTENT_ID,
    contentType: "article",
    agentRunId: VALID_RUN_ID,
    title: "Title",
    slug: "title",
    status: "draft",
    publishedAt: null,
    draft: {
      contentType: "article",
      title: "Title",
      slug: "title",
      excerpt: "Excerpt long enough for checks",
      content: "<p>Body content long enough for publication checks here.</p>",
      categoryRecommendation: "Security",
      primaryKeyword: "security",
      secondaryKeywords: [],
      keyTakeaways: [],
      generationPlan: { sections: [] },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
      seo: {
        seoTitle: "SEO",
        seoDescription: "Description",
        seoKeywords: ["security"],
        ogTitle: "OG",
        ogDescription: "OGD",
      },
    } as unknown as GeneratedDraft,
    sourceMappings: [],
    internalLinks: [],
    generationWarnings: [],
    reviewFingerprintFields: {
      title: "Title",
      slug: "title",
      excerpt: "Excerpt long enough for checks",
      content: "Body content long enough for publication checks here.",
      categoryId: "00000000-0000-4000-8000-000000000020",
      seoTitle: "SEO",
      seoDescription: "Description",
      ogTitle: "OG",
      ogDescription: "OGD",
      seoKeywords: ["security"],
      sourceMappings: [],
      internalLinks: [],
      generationWarnings: [],
    },
    ...overrides,
  };
}

function buildArticle(overrides: Partial<ReadinessArticleContent> = {}): ReadinessArticleContent {
  return {
    contentType: "article",
    id: VALID_CONTENT_ID,
    title: "CISA Zero Trust guidance for enterprise defenders",
    slug: "cisa-zero-trust-guidance",
    excerpt: "A practical overview of CISA Zero Trust guidance for defenders.",
    content: `<p>${"Enterprise defenders should apply Zero Trust controls consistently. ".repeat(12)}</p>`,
    author: "HimalCyberX Editorial",
    categoryId: "00000000-0000-4000-8000-000000000020",
    status: "draft",
    featuredImage: "https://example.com/articles/agent.webp",
    featuredImageAlt:
      "Editorial cybersecurity artwork illustrating layered identity and access controls in enterprise environments",
    seoTitle: "CISA Zero Trust Guidance",
    seoDescription: "Understand CISA Zero Trust guidance for enterprise defenders.",
    ogTitle: "CISA Zero Trust Guidance",
    ogDescription: "Understand CISA Zero Trust guidance for enterprise defenders.",
    factCheckStatus: "passed",
    ...overrides,
  };
}

function buildTutorial(overrides: Partial<ReadinessTutorialContent> = {}): ReadinessTutorialContent {
  return {
    contentType: "tutorial",
    id: VALID_CONTENT_ID,
    title: "Tutorial on phishing-resistant authentication",
    slug: "phishing-resistant-authentication",
    description: "Learn how to deploy phishing-resistant authentication in practice.",
    category: "Identity",
    difficulty: "Intermediate",
    estimatedTime: "45 minutes",
    requirements: "Admin access",
    introduction: `<p>${"This tutorial explains phishing-resistant authentication in detail. ".repeat(8)}</p>`,
    instructions: `<p>${"Follow these steps to configure passkeys safely in your environment. ".repeat(10)}</p>`,
    keyTakeaways: "<p>Passkeys reduce credential theft risk.</p>",
    securityNotes: "<p>Protect recovery flows.</p>",
    status: "draft",
    featuredImage: "https://example.com/tutorials/agent.webp",
    featuredImageAlt:
      "Editorial cybersecurity artwork showing device-bound login flows for modern workforce access",
    seoTitle: "Phishing-resistant authentication tutorial",
    seoDescription: "Step-by-step tutorial for phishing-resistant authentication.",
    ogTitle: "Phishing-resistant authentication tutorial",
    ogDescription: "Step-by-step tutorial for phishing-resistant authentication.",
    factCheckStatus: "passed",
    ...overrides,
  };
}

function buildLab(overrides: Partial<ReadinessLabContent> = {}): ReadinessLabContent {
  return {
    contentType: "lab",
    id: VALID_CONTENT_ID,
    title: "Cyber lab on secure logging",
    slug: "secure-logging-lab",
    description: "Hands-on lab for secure logging and monitoring workflows.",
    category: "Detection",
    difficulty: "Advanced",
    estimatedTime: "60 minutes",
    learningObjectives: "<p>Understand secure log collection.</p>",
    requirementsTools: "<p>Linux VM and SIEM access.</p>",
    introduction: `<p>${"This lab covers secure logging fundamentals in a practical environment. ".repeat(8)}</p>`,
    instructions: `<p>${"Complete each step to configure secure log forwarding and validation. ".repeat(10)}</p>`,
    expectedResult: "<p>Logs are collected securely.</p>",
    securityNotes: "<p>Do not expose sensitive log data.</p>",
    status: "draft",
    featuredImage: "https://example.com/labs/agent.webp",
    featuredImageAlt:
      "Editorial cybersecurity artwork showing monitored log pipelines inside a security operations environment",
    seoTitle: "Secure logging cyber lab",
    seoDescription: "Hands-on cyber lab for secure logging workflows.",
    ogTitle: "Secure logging cyber lab",
    ogDescription: "Hands-on cyber lab for secure logging workflows.",
    factCheckStatus: "passed",
    ...overrides,
  };
}

function validFeaturedImage(content: { featuredImage?: string | null }) {
  return {
    storagePath: `articles/agent-${VALID_RUN_ID}-1.webp`,
    publicUrl: content.featuredImage ?? "https://example.com/articles/agent.webp",
    attachedAt: "2026-09-15T00:00:00.000Z",
    width: 1536,
    height: 864,
    mimeType: "image/webp",
    byteSize: 1024,
  };
}

function evaluate(input: Partial<Parameters<typeof evaluateReadinessGate>[0]> & {
  content: Parameters<typeof evaluateReadinessGate>[0]["content"];
}) {
  return evaluateReadinessGate({
    review: buildReview({ draftFingerprint: FINGERPRINT_A }),
    currentDraftFingerprint: FINGERPRINT_A,
    groundingAudit: {
      passed: true,
      unsupportedClaims: [],
      invalidSourceUrls: [],
      invalidInternalLinks: [],
      warnings: [],
    },
    invalidSourceUrls: [],
    invalidInternalLinks: [],
    latestFeaturedImage: validFeaturedImage(input.content),
    categoriesAvailable: true,
    ...input,
  });
}

describe("Phase 7 readiness gate core", () => {
  it("returns READY_TO_PUBLISH for clean article, tutorial, and lab drafts", () => {
    for (const content of [buildArticle(), buildTutorial(), buildLab()]) {
      const result = evaluate({ content });

      assert.equal(result.status, "READY_TO_PUBLISH");
    }
  });

  it("blocks Phase 5 FAIL and missing review", () => {
    const fail = evaluate({
      content: buildArticle(),
      review: buildReview({ status: "fail", factCheckStatus: "failed" }),
      latestFeaturedImage: null,
    });
    assert.equal(fail.status, "BLOCKED");

    const missing = evaluate({
      content: buildArticle(),
      review: null,
      latestFeaturedImage: null,
    });
    assert.equal(missing.status, "BLOCKED");
  });

  it("returns NEEDS_REVIEW for Phase 5 needs_review and stale review", () => {
    const needsReview = evaluate({
      content: buildArticle(),
      review: buildReview({ status: "needs_review", factCheckStatus: "needs_review" }),
    });
    assert.equal(needsReview.status, "NEEDS_REVIEW");

    const stale = evaluate({
      content: buildArticle(),
      review: buildReview({ draftFingerprint: FINGERPRINT_A }),
      currentDraftFingerprint: FINGERPRINT_B,
    });
    assert.equal(stale.status, "NEEDS_REVIEW");
    assert.ok(stale.issues.some((entry) => entry.code === "REVIEW_STALE"));
  });

  it("blocks missing featured image and known invalid image metadata", () => {
    const missingImage = evaluate({
      content: buildArticle({ featuredImage: null }),
      latestFeaturedImage: null,
    });
    assert.equal(missingImage.status, "BLOCKED");

    const invalidDimensions = evaluate({
      content: buildArticle(),
      latestFeaturedImage: {
        ...validFeaturedImage(buildArticle()),
        width: 1200,
        height: 630,
      },
    });
    assert.equal(invalidDimensions.status, "BLOCKED");

    const invalidMime = evaluate({
      content: buildArticle(),
      latestFeaturedImage: {
        ...validFeaturedImage(buildArticle()),
        mimeType: "image/png",
      },
    });
    assert.equal(invalidMime.status, "BLOCKED");

    const tooLarge = evaluate({
      content: buildArticle(),
      latestFeaturedImage: {
        ...validFeaturedImage(buildArticle()),
        byteSize: 6 * 1024 * 1024,
      },
    });
    assert.equal(tooLarge.status, "BLOCKED");
  });

  it("does not block solely on zero internal links", () => {
    const result = evaluate({ content: buildArticle() });
    assert.notEqual(result.status, "BLOCKED");
    assert.ok(!result.issues.some((entry) => entry.code === "INVALID_INTERNAL_LINK"));
  });

  it("blocks invalid internal links and invented source URLs", () => {
    const invalidLink = evaluate({
      content: buildArticle(),
      invalidInternalLinks: ["/articles/not-approved"],
    });
    assert.equal(invalidLink.status, "BLOCKED");

    const inventedSource = evaluate({
      content: buildArticle(),
      invalidSourceUrls: ["https://invented.example/cve-9999"],
    });
    assert.equal(inventedSource.status, "BLOCKED");
  });

  it("blocks material unsupported claims and critical conflicts", () => {
    const unsupported = evaluate({
      content: buildArticle(),
      groundingAudit: {
        passed: false,
        unsupportedClaims: ["CVE-2099-0001 is actively exploited"],
        invalidSourceUrls: [],
        invalidInternalLinks: [],
        warnings: [],
      },
    });
    assert.equal(unsupported.status, "BLOCKED");

    const materialFinding = evaluate({
      content: buildArticle(),
      review: buildReview({
        findings: [
          {
            findingId: "finding-1",
            severity: "major",
            claimType: "security_impact",
            claimText: "CVE-2099-0001 is actively exploited in the wild.",
            status: "unsupported",
            evidenceSourceIds: [],
            explanation: "No verified evidence supports exploitation status.",
            suggestedCorrection: "Remove or qualify the exploitation claim.",
          },
        ],
      }),
    });
    assert.equal(materialFinding.status, "BLOCKED");
    assert.ok(
      materialFinding.issues.some((entry) => entry.code === "MATERIAL_UNSUPPORTED_CLAIM"),
    );

    const advisoryConflict = evaluate({
      content: buildArticle(),
      review: buildReview({
        conflictingClaims: ["Conflicting patch availability claim"],
      }),
    });
    assert.equal(advisoryConflict.status, "NEEDS_REVIEW");
    assert.ok(
      advisoryConflict.issues.some(
        (entry) =>
          entry.code === "REVIEW_CONFLICTING_CLAIM" && entry.severity === "warning",
      ),
    );
  });

  it("flags SEO and source transparency warnings without arbitrary blocking", () => {
    const longSeoTitle = evaluate({
      content: buildArticle({
        seoTitle: "A".repeat(75),
      }),
    });
    assert.equal(longSeoTitle.status, "NEEDS_REVIEW");
    assert.ok(longSeoTitle.issues.some((entry) => entry.code === "SEO_TITLE_LONG"));

    const missingSeoDescription = evaluate({
      content: buildArticle({
        seoDescription: "",
      }),
    });
    assert.equal(missingSeoDescription.status, "NEEDS_REVIEW");

    const sourceTransparency = evaluate({
      content: buildArticle(),
      review: buildReview({
        warnings: ["Source transparency could be clearer for one supported claim."],
      }),
    });
    assert.equal(sourceTransparency.status, "NEEDS_REVIEW");
    assert.ok(
      sourceTransparency.issues.some(
        (entry) => entry.code === "SOURCE_TRANSPARENCY_WARNING",
      ),
    );
  });

  it("blocks malformed or empty CMS content and validates content-type fields", () => {
    const emptyArticle = evaluate({
      content: buildArticle({ content: "<p></p>" }),
    });
    assert.equal(emptyArticle.status, "BLOCKED");

    const missingTutorialCategory = evaluate({
      content: buildTutorial({ category: null }),
    });
    assert.equal(missingTutorialCategory.status, "BLOCKED");

    const missingLabCategory = evaluate({
      content: buildLab({ category: null }),
    });
    assert.equal(missingLabCategory.status, "BLOCKED");
  });

  it("never elevates score above blockers and resolves status precedence", () => {
    const issues = [
      {
        code: "PHASE5_REVIEW_FAIL",
        severity: "blocking" as const,
        category: "review" as const,
        message: "fail",
        recommendedAction: "fix",
      },
      {
        code: "SEO_TITLE_LONG",
        severity: "warning" as const,
        category: "seo" as const,
        message: "long",
        recommendedAction: "shorten",
      },
    ];
    assert.equal(resolveReadinessStatus(issues), "BLOCKED");
    assert.ok(calculateReadinessScore(issues) < 100);
  });
});

describe("Phase 7 fingerprint and persistence", () => {
  it("builds deterministic readiness fingerprints and detects stale results", () => {
    const snapshot = buildSnapshot();

    const first = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "SEO",
        seoDescription: "Description",
        ogTitle: "OG",
        ogDescription: "OGD",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks",
      reviewFingerprint: FINGERPRINT_A,
    });
    const second = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "SEO",
        seoDescription: "Description",
        ogTitle: "OG",
        ogDescription: "OGD",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks",
      reviewFingerprint: FINGERPRINT_A,
    });

    assert.equal(first, second);
    assert.equal(
      isPersistedReadinessStale({ persistedFingerprint: null, currentFingerprint: first }),
      false,
    );
    assert.equal(isPersistedReadinessStale({ persistedFingerprint: first, currentFingerprint: first }), false);
    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: first,
        currentFingerprint: buildReadinessFingerprint({
          snapshot: {
            ...snapshot,
            title: "Changed title",
            reviewFingerprintFields: {
              ...snapshot.reviewFingerprintFields!,
              title: "Changed title",
            },
          },
          seoFields: {
            seoTitle: "SEO",
            seoDescription: "Description",
            ogTitle: "OG",
            ogDescription: "OGD",
          },
          featuredImage: "https://example.com/a.webp",
          featuredImageAlt: "Alt text long enough for accessibility review checks",
          reviewFingerprint: FINGERPRINT_A,
        }),
      }),
      true,
    );
  });

  it("marks SEO, image, and review fingerprint changes as stale", () => {
    const snapshot = buildSnapshot();
    const base = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "SEO",
        seoDescription: "Description",
        ogTitle: "OG",
        ogDescription: "OGD",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks",
      reviewFingerprint: FINGERPRINT_A,
    });

    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          snapshot,
          seoFields: {
            seoTitle: "Changed SEO",
            seoDescription: "Description",
            ogTitle: "OG",
            ogDescription: "OGD",
          },
          featuredImage: "https://example.com/a.webp",
          featuredImageAlt: "Alt text long enough for accessibility review checks",
          reviewFingerprint: FINGERPRINT_A,
        }),
      }),
      true,
    );

    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          snapshot,
          seoFields: {
            seoTitle: "SEO",
            seoDescription: "Description",
            ogTitle: "OG",
            ogDescription: "OGD",
          },
          featuredImage: "https://example.com/b.webp",
          featuredImageAlt: "Alt text long enough for accessibility review checks",
          reviewFingerprint: FINGERPRINT_A,
        }),
      }),
      true,
    );

    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          snapshot,
          seoFields: {
            seoTitle: "SEO",
            seoDescription: "Description",
            ogTitle: "OG",
            ogDescription: "OGD",
          },
          featuredImage: "https://example.com/a.webp",
          featuredImageAlt: "Alt text long enough for accessibility review checks",
          reviewFingerprint: FINGERPRINT_B,
        }),
      }),
      true,
    );
  });
});

describe("Phase 7 security and diagnostics", () => {
  it("does not expose secrets in readiness diagnostics", () => {
    assert.equal(
      diagnosticsContainSecrets({
        agentRunId: VALID_RUN_ID,
        status: "NEEDS_REVIEW",
        issueCodes: ["REVIEW_STALE"],
      }),
      false,
    );
  });

  it("does not include publish actions or external API calls in readiness core", () => {
    const source = readFileSync(join(testDir, "readiness-gate-core.ts"), "utf8");
    assert.doesNotMatch(source, /openai|tavily|notifySubscriber|publishArticle|autoPublish|schedulePublish/i);
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.doesNotMatch(engineSource, /openai|tavily|publishArticle|notifySubscriber|autoPublish|schedulePublish/i);
    assert.match(engineSource, /stale: false/);
  });
});

describe("Phase 7 production stabilization regressions", () => {
  it("persists fresh evaluations as not stale", () => {
    const gate = evaluate({ content: buildArticle() });
    const persisted = buildPersistedReadinessResult({
      status: gate.status,
      readinessScore: gate.readinessScore,
      fingerprint: FINGERPRINT_A,
      reviewFingerprint: FINGERPRINT_A,
      stale: false,
      issues: gate.issues,
      checks: gate.checks,
    });

    assert.equal(persisted.stale, false);
  });

  it("treats missing prior readiness fingerprint as not stale", () => {
    const snapshot = buildSnapshot();
    const current = buildReadinessFingerprint({
      snapshot,
      seoFields: {
        seoTitle: "SEO",
        seoDescription: "Description",
        ogTitle: "OG",
        ogDescription: "OGD",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks",
      reviewFingerprint: FINGERPRINT_A,
    });

    assert.equal(
      isPersistedReadinessStale({ persistedFingerprint: null, currentFingerprint: current }),
      false,
    );
  });

  it("marks loaded persisted readiness stale only when publication fingerprint changed", () => {
    const snapshot = buildSnapshot();
    const baseInput = {
      snapshot,
      seoFields: {
        seoTitle: "SEO",
        seoDescription: "Description",
        ogTitle: "OG",
        ogDescription: "OGD",
      },
      featuredImage: "https://example.com/a.webp",
      featuredImageAlt: "Alt text long enough for accessibility review checks",
      reviewFingerprint: FINGERPRINT_A,
    };
    const base = buildReadinessFingerprint(baseInput);

    assert.equal(
      isPersistedReadinessStale({ persistedFingerprint: base, currentFingerprint: base }),
      false,
    );
    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          ...baseInput,
          seoFields: { ...baseInput.seoFields, seoTitle: "Changed SEO" },
        }),
      }),
      true,
    );
    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          ...baseInput,
          featuredImage: "https://example.com/b.webp",
        }),
      }),
      true,
    );
    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          ...baseInput,
          featuredImageAlt: "Updated alt text long enough for accessibility review checks",
        }),
      }),
      true,
    );
    assert.equal(
      isPersistedReadinessStale({
        persistedFingerprint: base,
        currentFingerprint: buildReadinessFingerprint({
          ...baseInput,
          reviewFingerprint: FINGERPRINT_B,
        }),
      }),
      true,
    );
  });

  it("keeps Phase 5 review stale separate from Phase 7 outdated semantics", () => {
    const staleReview = evaluate({
      content: buildArticle(),
      review: buildReview({ draftFingerprint: FINGERPRINT_A }),
      currentDraftFingerprint: FINGERPRINT_B,
    });

    assert.ok(staleReview.issues.some((entry) => entry.code === "REVIEW_STALE"));
    const persisted = buildPersistedReadinessResult({
      status: staleReview.status,
      readinessScore: staleReview.readinessScore,
      fingerprint: FINGERPRINT_B,
      reviewFingerprint: FINGERPRINT_A,
      stale: false,
      issues: staleReview.issues,
      checks: staleReview.checks,
    });
    assert.equal(persisted.stale, false);
  });

  it("emits exactly one article category warning when category is missing", () => {
    const missingCategory = evaluate({
      content: buildArticle({ categoryId: null }),
      categoriesAvailable: true,
    });
    const categoryIssues = missingCategory.issues.filter(
      (entry) =>
        entry.code === "CMS_CATEGORY_MISSING" || entry.code === "CMS_CHECKLIST_CATEGORY",
    );

    assert.equal(categoryIssues.length, 1);
    assert.equal(categoryIssues[0]?.code, "CMS_CATEGORY_MISSING");
    assert.match(categoryIssues[0]?.message ?? "", /No article category is selected/i);
  });

  it("passes article category checks when category is selected", () => {
    const result = evaluate({ content: buildArticle() });
    assert.ok(!result.issues.some((entry) => entry.code === "CMS_CATEGORY_MISSING"));
    assert.ok(!result.issues.some((entry) => entry.code === "CMS_CHECKLIST_CATEGORY"));
  });

  it("keeps tutorial and lab category requirements unchanged", () => {
    const tutorial = evaluate({ content: buildTutorial({ category: null }) });
    assert.equal(tutorial.status, "BLOCKED");
    assert.ok(tutorial.issues.some((entry) => entry.code === "CMS_CATEGORY_MISSING"));

    const lab = evaluate({ content: buildLab({ category: null }) });
    assert.equal(lab.status, "BLOCKED");
    assert.ok(lab.issues.some((entry) => entry.code === "CMS_CATEGORY_MISSING"));
  });

  it("does not block on advisory unsupported or conflicting claim arrays alone", () => {
    const advisoryUnsupported = evaluate({
      content: buildArticle(),
      review: buildReview({
        status: "needs_review",
        qualityScore: 84,
        unsupportedClaims: [
          "Grounding audit does not independently verify one editorial inference.",
        ],
      }),
    });
    assert.equal(advisoryUnsupported.status, "NEEDS_REVIEW");
    assert.ok(
      advisoryUnsupported.issues.some(
        (entry) =>
          entry.code === "REVIEW_UNSUPPORTED_CLAIM" && entry.severity === "warning",
      ),
    );

    const advisoryConflict = evaluate({
      content: buildArticle(),
      review: buildReview({
        status: "needs_review",
        conflictingClaims: ["Minor wording conflict in vendor guidance summary."],
      }),
    });
    assert.equal(advisoryConflict.status, "NEEDS_REVIEW");
    assert.ok(
      advisoryConflict.issues.some(
        (entry) =>
          entry.code === "REVIEW_CONFLICTING_CLAIM" && entry.severity === "warning",
      ),
    );
  });

  it("still blocks Phase 5 fail and material findings", () => {
    const fail = evaluate({
      content: buildArticle(),
      review: buildReview({ status: "fail", factCheckStatus: "failed" }),
    });
    assert.equal(fail.status, "BLOCKED");

    const materialConflict = evaluate({
      content: buildArticle(),
      review: buildReview({
        findings: [
          {
            findingId: "finding-2",
            severity: "critical",
            claimType: "patch_id",
            claimText: "Patch KB500123 is available for all affected versions.",
            status: "conflicting",
            evidenceSourceIds: [],
            explanation: "Sources disagree on patch availability.",
            suggestedCorrection: "Clarify patch availability.",
          },
        ],
      }),
    });
    assert.equal(materialConflict.status, "BLOCKED");
  });

  it("matches the production advisory Phase 5 needs_review shape", () => {
    const result = evaluate({
      content: buildArticle({
        categoryId: null,
        featuredImageAlt:
          "Editorial cybersecurity artwork depicting zero trust architecture, related to CISA Zero Trust guidance for enterprise defenders and…",
      }),
      review: buildReview({
        status: "needs_review",
        qualityScore: 84,
        unsupportedClaims: [
          "Grounding audit does not independently verify one editorial inference.",
        ],
        warnings: [
          "Source transparency could be clearer for one supported claim.",
          "Draft relies on a single Cloudflare vendor source.",
        ],
      }),
      categoriesAvailable: true,
    });

    assert.equal(result.status, "NEEDS_REVIEW");
    assert.notEqual(result.status, "BLOCKED");
    assert.ok(result.issues.some((entry) => entry.code === "PHASE5_NEEDS_REVIEW"));
    assert.ok(result.issues.some((entry) => entry.code === "CMS_CATEGORY_MISSING"));
    assert.equal(
      result.issues.filter((entry) => entry.code === "CMS_CATEGORY_MISSING").length,
      1,
    );
  });
});

describe("Phase 7 resume contract", () => {
  it("AgentReadinessPanel and resume wiring exist without publish actions", () => {
    const panelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentReadinessPanel.tsx"),
      "utf8",
    );
    assert.match(panelSource, /Phase 7 — Final Readiness/);
    assert.match(panelSource, /Run Final Readiness Check/);
    assert.match(panelSource, /Phase 7 result outdated — run Final Readiness Check again\./);
    assert.match(panelSource, /Phase 5 review outdated — rerun Independent Review\./);
    assert.doesNotMatch(panelSource, /Stale — rerun required/);
    assert.doesNotMatch(panelSource, /Auto Publish|Schedule Publish|Approve & Publish|type=\"submit\"[^>]*>\s*Publish/i);

    const reviewPanelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentReviewPanel.tsx"),
      "utf8",
    );
    assert.match(reviewPanelSource, /AgentReadinessPanel/);
  });
});

describe("Phase 7 action security contract", () => {
  it("evaluateAgentReadiness validates UUID and uses server-side evaluation", () => {
    const actionSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );
    assert.match(actionSource, /evaluateAgentReadiness/);
    assert.match(actionSource, /isValidAgentRunId/);
    assert.match(actionSource, /runAgentReadinessEvaluation/);
    assert.doesNotMatch(actionSource, /publishArticle|notifySubscriber|Auto Publish|Schedule Publish/i);
  });
});
describe("Phase 7 alt text and metadata merge", () => {
  it("flags truncated alt text and missing alt text appropriately", () => {
    const truncated = evaluateAltTextQuality({
      altText:
        "Editorial cybersecurity artwork depicting zero trust architecture, related to CISA Zero Trust guidance for enterprise defenders and…",
      title: buildArticle().title,
      slug: buildArticle().slug,
      hasFeaturedImage: true,
    });
    assert.ok(truncated.some((issue) => issue.code === "ALT_TEXT_TRUNCATED"));

    const missing = evaluateAltTextQuality({
      altText: "",
      title: buildArticle().title,
      slug: buildArticle().slug,
      hasFeaturedImage: true,
    });
    assert.ok(missing.some((issue) => issue.code === "ALT_TEXT_MISSING"));
  });

  it("merges generation metadata without dropping Phase 4 or Phase 6 metadata", () => {
    const merged = buildAgentRunReadinessMetadataUpdate({
      existingMetadata: {
        sourceMappings: [{ sectionKey: "intro", claim: "Claim", sourceUrls: [] }],
        latestFeaturedImage: {
          storagePath: "articles/agent.webp",
          publicUrl: "https://example.com/articles/agent.webp",
        },
      },
      readiness: buildPersistedReadinessResult({
        status: "NEEDS_REVIEW",
        readinessScore: 82,
        fingerprint: FINGERPRINT_A,
        reviewFingerprint: FINGERPRINT_A,
        stale: false,
        issues: [],
        checks: {
          review: "warning",
          factual: "pass",
          cms: "pass",
          source: "pass",
          seo: "warning",
          image: "pass",
          altText: "warning",
          structure: "pass",
          internalLinks: "pass",
        },
      }),
    });

    assert.ok(Array.isArray(merged.sourceMappings));
    assert.ok(merged.latestFeaturedImage);
    assert.ok(merged.finalReadiness);
  });
});

describe("Phase 7 CISA Zero Trust expected result", () => {
  it("returns NEEDS_REVIEW when Phase 5 is needs_review and image is valid", () => {
    const result = evaluate({
      content: buildArticle({
        title: "CISA Zero Trust guidance for enterprise defenders",
        slug: "cisa-zero-trust-guidance",
      }),
      review: buildReview({
        status: "needs_review",
        factCheckStatus: "needs_review",
        qualityScore: 81,
        warnings: ["Source transparency could be clearer for one supported claim."],
      }),
    });

    assert.equal(result.status, "NEEDS_REVIEW");
    assert.notEqual(result.status, "READY_TO_PUBLISH");
  });
});
