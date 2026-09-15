import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AgentReviewRecord } from "../review/types";
import type { PersistedReadinessResult } from "../readiness/types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  evaluatePublishEligibility,
  parseFinalReadinessFromMetadata,
} = (await import(pathToFileURL(join(testDir, "eligibility-core.ts")).href)) as typeof import("./eligibility-core");

const {
  buildAgentRunPublicationMetadataUpdate,
  buildAgentRunReconciliationMetadataUpdate,
  buildPublicationAuditFromAttempt,
  getPhase8PublicationProofFromMetadata,
  parsePhase8PublicationAudit,
  validatePhase8PublicationProof,
} = (await import(pathToFileURL(join(testDir, "metadata-core.ts")).href)) as typeof import("./metadata-core");

const {
  buildAlreadyPublishedResult,
  buildOutOfBandPublishedResult,
  buildProvenPhase8PublishedResult,
} = (await import(pathToFileURL(join(testDir, "published-content-core.ts")).href)) as typeof import("./published-content-core");

const {
  resolvePublishedContentFromMetadata,
} = (await import(pathToFileURL(join(testDir, "metadata-core.ts")).href)) as typeof import("./metadata-core");

const {
  buildAgentContentPublicUrl,
  buildAgentContentTypeLabel,
} = (await import(pathToFileURL(join(testDir, "public-url-core.ts")).href)) as typeof import("./public-url-core");

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
    seoReview: null,
    readabilityReview: null,
    originalityReview: null,
    safetyReview: null,
    publicationRecommendation: null,
    warnings: [],
    reusedFromCache: false,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildReadiness(
  overrides: Partial<PersistedReadinessResult> = {},
): PersistedReadinessResult {
  return {
    version: "phase7-v1",
    evaluatedAt: "2026-09-15T00:00:00.000Z",
    status: "READY_TO_PUBLISH",
    readinessScore: 95,
    fingerprint: FINGERPRINT_A,
    reviewFingerprint: FINGERPRINT_A,
    stale: false,
    issues: [],
    checks: {
      review: "pass",
      factual: "pass",
      cms: "pass",
      source: "pass",
      seo: "pass",
      image: "pass",
      altText: "pass",
      structure: "pass",
      internalLinks: "pass",
    },
    ...overrides,
  };
}

function buildArticleContent(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "article" as const,
    id: VALID_CONTENT_ID,
    slug: "cisa-zero-trust-guidance",
    status: "draft",
    agentRunId: VALID_RUN_ID,
    title: "CISA Zero Trust guidance for enterprise defenders",
    excerpt: "A practical overview of CISA Zero Trust guidance for defenders.",
    content: `<p>${"Enterprise defenders should apply Zero Trust controls consistently. ".repeat(12)}</p>`,
    author: "HimalCyberX Editorial",
    categoryId: "00000000-0000-4000-8000-000000000020",
    featuredImage: "https://example.com/articles/agent.webp",
    featuredImageAlt:
      "Editorial cybersecurity artwork illustrating layered identity and access controls in enterprise environments",
    seoTitle: "CISA Zero Trust Guidance",
    seoDescription: "Understand CISA Zero Trust guidance for enterprise defenders.",
    ogTitle: "CISA Zero Trust Guidance",
    ogDescription: "Understand CISA Zero Trust guidance for enterprise defenders.",
    ...overrides,
  };
}

function buildTutorialContent(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "tutorial" as const,
    id: VALID_CONTENT_ID,
    slug: "phishing-resistant-authentication",
    status: "draft",
    agentRunId: VALID_RUN_ID,
    title: "Tutorial on phishing-resistant authentication",
    description: "Learn how to deploy phishing-resistant authentication in practice.",
    category: "Identity",
    difficulty: "Intermediate",
    estimatedTime: "45 minutes",
    requirements: "Admin access",
    introduction: `<p>${"This tutorial explains phishing-resistant authentication in detail. ".repeat(8)}</p>`,
    instructions: `<p>${"Follow these steps to configure passkeys safely in your environment. ".repeat(10)}</p>`,
    keyTakeaways: "<p>Passkeys reduce credential theft risk.</p>",
    securityNotes: "<p>Protect recovery flows.</p>",
    featuredImage: "https://example.com/tutorials/agent.webp",
    ...overrides,
  };
}

function buildLabContent(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "lab" as const,
    id: VALID_CONTENT_ID,
    slug: "secure-logging-lab",
    status: "draft",
    agentRunId: VALID_RUN_ID,
    title: "Cyber lab on secure logging",
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
    featuredImage: "https://example.com/labs/agent.webp",
    ...overrides,
  };
}

function evaluate(input: Partial<Parameters<typeof evaluatePublishEligibility>[0]>) {
  return evaluatePublishEligibility({
    agentRunId: VALID_RUN_ID,
    runStage: "fact_check",
    runStatus: "ready",
    content: buildArticleContent(),
    review: buildReview(),
    finalReadiness: buildReadiness(),
    currentReadinessFingerprint: FINGERPRINT_A,
    currentDraftFingerprint: FINGERPRINT_A,
    categoriesAvailable: true,
    ...input,
  });
}

describe("Phase 8 publish eligibility", () => {
  it("allows READY article, tutorial, and lab content", () => {
    assert.equal(evaluate({ content: buildArticleContent() }).code, "READY");
    assert.equal(
      evaluate({ content: buildTutorialContent() }).code,
      "READY",
    );
    assert.equal(evaluate({ content: buildLabContent() }).code, "READY");
  });

  it("rejects NEEDS_REVIEW and BLOCKED readiness", () => {
    assert.equal(
      evaluate({ finalReadiness: buildReadiness({ status: "NEEDS_REVIEW" }) }).code,
      "READINESS_NOT_READY",
    );
    assert.equal(
      evaluate({ finalReadiness: buildReadiness({ status: "BLOCKED" }) }).code,
      "READINESS_NOT_READY",
    );
  });

  it("rejects missing, stale, and mismatched readiness", () => {
    assert.equal(evaluate({ finalReadiness: null }).code, "READINESS_MISSING");
    assert.equal(
      evaluate({ finalReadiness: buildReadiness({ stale: true }) }).code,
      "READINESS_STALE",
    );
    assert.equal(
      evaluate({
        finalReadiness: buildReadiness({ fingerprint: FINGERPRINT_A }),
        currentReadinessFingerprint: FINGERPRINT_B,
      }).code,
      "READINESS_STALE",
    );
  });

  it("rejects missing, stale, and failed Phase 5 review", () => {
    assert.equal(evaluate({ review: null }).code, "REVIEW_MISSING");
    assert.equal(
      evaluate({
        review: buildReview({ draftFingerprint: FINGERPRINT_A }),
        currentDraftFingerprint: FINGERPRINT_B,
      }).code,
      "REVIEW_STALE",
    );
    assert.equal(
      evaluate({ review: buildReview({ status: "fail" }) }).code,
      "REVIEW_FAILED",
    );
  });

  it("rejects content mismatch, missing content, and non-draft content", () => {
    assert.equal(evaluate({ content: null }).code, "CONTENT_MISSING");
    assert.equal(
      evaluate({
        content: buildArticleContent({ agentRunId: "00000000-0000-4000-8000-000000000099" }),
      }).code,
      "CONTENT_MISMATCH",
    );
    assert.equal(
      evaluate({ content: buildArticleContent({ status: "published" }) }).code,
      "ALREADY_PUBLISHED",
    );
  });

  it("rejects missing featured image", () => {
    assert.equal(
      evaluate({ content: buildArticleContent({ featuredImage: null }) }).code,
      "IMAGE_MISSING",
    );
  });

  it("detects publish in progress from run state", () => {
    assert.equal(
      evaluate({ runStage: "publishing", runStatus: "running" }).code,
      "PUBLISH_IN_PROGRESS",
    );
  });
});

describe("Phase 8 metadata and URLs", () => {
  it("builds public URLs for article, tutorial, and lab", () => {
    assert.equal(
      buildAgentContentPublicUrl("article", "cisa-zero-trust-guidance"),
      "/articles/cisa-zero-trust-guidance",
    );
    assert.equal(
      buildAgentContentPublicUrl("tutorial", "phishing-resistant-authentication"),
      "/tutorials/phishing-resistant-authentication",
    );
    assert.equal(
      buildAgentContentPublicUrl("lab", "secure-logging-lab"),
      "/cyber-lab/secure-logging-lab",
    );
  });

  it("merges phase8Publication without dropping earlier metadata", () => {
    const merged = buildAgentRunPublicationMetadataUpdate({
      existingMetadata: {
        sourceMappings: [{ sectionKey: "intro" }],
        latestFeaturedImage: { publicUrl: "https://example.com/a.webp" },
        finalReadiness: buildReadiness(),
      },
      audit: buildPublicationAuditFromAttempt({
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        readinessFingerprint: FINGERPRINT_A,
        result: "PUBLISHED",
        publishedAt: "2026-09-15T12:00:00.000Z",
        publicUrl: "/articles/cisa-zero-trust-guidance",
        notificationOutcome: "sent",
      }),
    });

    assert.ok(Array.isArray(merged.sourceMappings));
    assert.ok(merged.latestFeaturedImage);
    assert.ok(merged.finalReadiness);
    assert.ok(parsePhase8PublicationAudit(merged.phase8Publication));
  });

  it("parses final readiness and phase 8 audit from generation metadata", () => {
    const readiness = parseFinalReadinessFromMetadata({
      finalReadiness: buildReadiness(),
    });
    assert.equal(readiness?.status, "READY_TO_PUBLISH");

    const audit = parsePhase8PublicationAudit(
      buildPublicationAuditFromAttempt({
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        readinessFingerprint: FINGERPRINT_A,
        result: "PUBLISHED",
      }),
    );
    assert.equal(audit?.result, "PUBLISHED");
  });
});

function buildPublishedProof(
  overrides: Record<string, unknown> = {},
): import("./metadata-core").Phase8PublicationAudit & { result: "PUBLISHED" } {
  return buildPublicationAuditFromAttempt({
    contentType: "article",
    contentId: VALID_CONTENT_ID,
    readinessFingerprint: FINGERPRINT_A,
    result: "PUBLISHED",
    publishedAt: "2026-09-15T12:00:00.000Z",
    publicUrl: "/articles/cisa-zero-trust-guidance",
    notificationOutcome: "sent",
    attemptedAt: "2026-09-15T12:00:00.000Z",
    ...overrides,
  }) as import("./metadata-core").Phase8PublicationAudit & { result: "PUBLISHED" };
}

function buildPublishContext(overrides: Record<string, unknown> = {}) {
  return {
    agentRunId: VALID_RUN_ID,
    contentType: "article" as const,
    contentId: VALID_CONTENT_ID,
    slug: "cisa-zero-trust-guidance",
    publishedAt: "2026-09-15T12:00:00.000Z",
    ...overrides,
  };
}

describe("Phase 8 publication proof validation", () => {
  it("accepts valid prior Phase 8 PUBLISHED proof for article, tutorial, and lab", () => {
    for (const contentType of ["article", "tutorial", "lab"] as const) {
      const proof = buildPublicationAuditFromAttempt({
        contentType,
        contentId: VALID_CONTENT_ID,
        readinessFingerprint: FINGERPRINT_A,
        result: "PUBLISHED",
      });
      assert.equal(
        validatePhase8PublicationProof(proof, {
          contentId: VALID_CONTENT_ID,
          contentType,
        }),
        true,
      );
    }
  });

  it("rejects malformed, mismatched, and non-PUBLISHED audit objects", () => {
    assert.equal(
      validatePhase8PublicationProof(null, {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
    assert.equal(
      validatePhase8PublicationProof(buildPublishedProof({ result: "ALREADY_PUBLISHED" }), {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
    assert.equal(
      validatePhase8PublicationProof(buildPublishedProof({ contentId: "wrong-id" }), {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
    assert.equal(
      validatePhase8PublicationProof(buildPublishedProof({ contentType: "tutorial" }), {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
    assert.equal(
      validatePhase8PublicationProof({ result: "PUBLISHED" } as never, {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
  });

  it("extracts proof from metadata only when identifiers match", () => {
    const metadata = {
      phase8Publication: buildPublishedProof(),
    };
    assert.ok(
      getPhase8PublicationProofFromMetadata(metadata, {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
    );
    assert.equal(
      getPhase8PublicationProofFromMetadata(metadata, {
        contentId: VALID_CONTENT_ID,
        contentType: "tutorial",
      }),
      null,
    );
    assert.equal(getPhase8PublicationProofFromMetadata(null, {
      contentId: VALID_CONTENT_ID,
      contentType: "article",
    }), null);
  });
});

describe("Phase 8 published content resolution", () => {
  it("returns ALREADY_PUBLISHED success for proven prior Phase 8 publication", () => {
    const proof = buildPublishedProof();
    const result = buildAlreadyPublishedResult({
      context: buildPublishContext(),
      proof,
    });
    assert.equal(result.success, true);
    assert.equal(result.code, "ALREADY_PUBLISHED");
    assert.equal(result.alreadyPublished, true);
    assert.equal(result.notificationOutcome, "skipped");
    assert.equal(result.publishedAt, "2026-09-15T12:00:00.000Z");
  });

  it("returns proven Phase 8 published state for resume with valid proof", () => {
    const proof = buildPublishedProof();
    const result = buildProvenPhase8PublishedResult({
      context: buildPublishContext(),
      proof,
    });
    assert.equal(result.success, true);
    assert.equal(result.code, "PUBLISHED");
    assert.equal(result.alreadyPublished, false);
    assert.equal(result.notificationOutcome, "sent");
  });

  it("returns OUT_OF_BAND_PUBLISHED when published content has no valid proof", () => {
    const result = buildOutOfBandPublishedResult({
      context: buildPublishContext(),
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "OUT_OF_BAND_PUBLISHED");
    assert.equal(result.alreadyPublished, false);
    assert.equal(result.notificationOutcome, null);
    assert.equal(result.publicUrl, "/articles/cisa-zero-trust-guidance");
    assert.match(result.message, /not published through this HCX Agent Phase 8 run/i);
  });

  it("classifies metadata into proven Phase 8 vs out-of-band paths", () => {
    assert.equal(
      resolvePublishedContentFromMetadata({
        metadata: { phase8Publication: buildPublishedProof() },
        context: buildPublishContext(),
      }).kind,
      "proven_phase8",
    );
    assert.equal(
      resolvePublishedContentFromMetadata({
        metadata: null,
        context: buildPublishContext(),
      }).kind,
      "out_of_band",
    );
    assert.equal(
      resolvePublishedContentFromMetadata({
        metadata: { phase8Publication: buildPublishedProof({ contentId: "wrong" }) },
        context: buildPublishContext(),
      }).kind,
      "out_of_band",
    );
  });

  it("preserves original PUBLISHED proof during reconciliation metadata update", () => {
    const proof = buildPublishedProof();
    const merged = buildAgentRunReconciliationMetadataUpdate({
      existingMetadata: {
        finalReadiness: buildReadiness(),
        phase8Publication: proof,
      },
      proof,
      reconciledAt: "2026-09-15T13:00:00.000Z",
    });

    const preserved = parsePhase8PublicationAudit(merged.phase8Publication);
    assert.equal(preserved?.result, "PUBLISHED");
    assert.equal(preserved?.contentId, VALID_CONTENT_ID);
    assert.equal(preserved?.publishedAt, "2026-09-15T12:00:00.000Z");
    assert.equal(preserved?.notificationOutcome, "sent");
    assert.equal(
      (merged.phase8PublicationReconciliation as { result?: string })?.result,
      "ALREADY_PUBLISHED",
    );
    assert.ok(merged.finalReadiness);
  });

  it("does not treat idempotent ALREADY_PUBLISHED audit as proof", () => {
    const audit = buildPublicationAuditFromAttempt({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      readinessFingerprint: FINGERPRINT_A,
      result: "ALREADY_PUBLISHED",
      alreadyPublished: true,
      notificationOutcome: "skipped",
    });
    assert.equal(
      validatePhase8PublicationProof(audit, {
        contentId: VALID_CONTENT_ID,
        contentType: "article",
      }),
      false,
    );
  });
});

describe("Phase 8 out-of-band engine contracts", () => {
  it("routes published content through proof validation before reconciliation", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /getPhase8PublicationProofFromMetadata/);
    assert.match(engineSource, /buildOutOfBandPublishedResult/);
    assert.match(engineSource, /buildAgentRunReconciliationMetadataUpdate/);
    assert.doesNotMatch(
      engineSource,
      /if \(content\.status === "published"\)[\s\S]{0,220}result: "ALREADY_PUBLISHED"/,
    );
  });

  it("does not complete runs for out-of-band publication", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /buildOutOfBandPublishedResult/);
    assert.doesNotMatch(
      engineSource,
      /buildOutOfBandPublishedResult[\s\S]{0,200}stage: "completed"/,
    );
  });

  it("keeps DB atomic guards and notification path unchanged", () => {
    const publishCore = readFileSync(
      join(testDir, "../../content/publish-content-core.ts"),
      "utf8",
    );
    assert.match(publishCore, /\.eq\("status", "draft"\)/);
    assert.match(publishCore, /deliverPublicContentNotification/);
    assert.doesNotMatch(
      readFileSync(join(testDir, "../../notifications/publish-notification.ts"), "utf8"),
      /phase8Publication|OUT_OF_BAND_PUBLISHED/,
    );
  });
});

describe("Phase 8 resume out-of-band contracts", () => {
  it("resume uses strict proof for proven Phase 8 state and out-of-band otherwise", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.match(resumeSource, /getPhase8PublicationProofFromMetadata/);
    assert.match(resumeSource, /buildProvenPhase8PublishedResult/);
    assert.match(resumeSource, /buildOutOfBandPublishedResult/);
    assert.doesNotMatch(
      resumeSource,
      /code: "ALREADY_PUBLISHED"[\s\S]{0,120}success: true[\s\S]{0,120}notificationOutcome: "skipped"/,
    );
    assert.doesNotMatch(resumeSource, /updateAgentRun/);
  });
});

describe("Phase 8 out-of-band UI contracts", () => {
  it("renders out-of-band state with public link and no publish controls", () => {
    const panelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentPublishPanel.tsx"),
      "utf8",
    );
    assert.match(panelSource, /PUBLISHED OUTSIDE HCX AGENT/);
    assert.match(panelSource, /not published through[\s\S]*Phase 8 run/i);
    assert.match(panelSource, /OUT_OF_BAND_PUBLISHED/);
    assert.match(panelSource, /View Public Content/);
    assert.doesNotMatch(panelSource, /Publish Anyway|Force Publish|Ignore Warnings/i);
  });
});

describe("Phase 8 architecture contracts", () => {
  it("uses shared CMS publish service and atomic draft update", () => {
    const publishCore = readFileSync(
      join(testDir, "../../content/publish-content-core.ts"),
      "utf8",
    );
    assert.match(publishCore, /publishDraftContentRow/);
    assert.match(publishCore, /\.eq\("status", "draft"\)/);
    assert.match(publishCore, /deliverPublicContentNotification/);
    assert.doesNotMatch(publishCore, /openai|tavily|generateAgent|runAgentReview|evaluateAgentReadiness/i);
  });

  it("claims publishing with conditional agent run update", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /stage: "publishing"/);
    assert.match(engineSource, /status: "running"/);
    assert.match(engineSource, /\.eq\("status", "ready"\)/);
    assert.match(engineSource, /\.in\("stage", \["ready", "fact_check"\]\)/);
    assert.match(engineSource, /stage: "completed"/);
    assert.doesNotMatch(engineSource, /openai|tavily|runAgentReview|runAgentReadinessEvaluation/i);
  });

  it("does not mark rejected eligibility as completed or failed", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /if \(!eligibility\.eligible\)/);
    assert.doesNotMatch(
      engineSource,
      /if \(!eligibility\.eligible\)[\s\S]{0,300}stage: "completed"/,
    );
  });

  it("exposes protected publishAgentContent action accepting only agentRunId", () => {
    const actionSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );
    assert.match(actionSource, /publishAgentContent/);
    assert.match(actionSource, /getAuthenticatedServerClient\("publishAgentContent"\)/);
    assert.match(actionSource, /runAgentContentPublication/);
    assert.doesNotMatch(actionSource, /forcePublish|ignoreReadiness|adminOverride/i);
  });

  it("UI hides publish unless READY_TO_PUBLISH and requires confirmation", () => {
    const panelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentPublishPanel.tsx"),
      "utf8",
    );
    assert.match(panelSource, /Phase 8 — Safe Publishing/);
    assert.match(panelSource, /READY_TO_PUBLISH/);
    assert.match(panelSource, /Publish Content/);
    assert.match(panelSource, /Confirm Publish/);
    assert.match(panelSource, /Publishing blocked/);
    assert.match(panelSource, /Not ready to publish/);
    assert.match(panelSource, /Final readiness is outdated/);
    assert.match(panelSource, /View Public Content/);
    assert.match(panelSource, /ALREADY PUBLISHED/);
    assert.match(panelSource, /PUBLISHED OUTSIDE HCX AGENT/);
    assert.doesNotMatch(panelSource, /Publish Anyway|Force Publish|Ignore Warnings/i);
    assert.doesNotMatch(panelSource, /window\.confirm/);
  });

  it("resume wiring exposes published state and public link", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.match(resumeSource, /buildLatestPublishFromRun/);
    assert.match(resumeSource, /latestPublish/);

    const resumePanel = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentResumeRuns.tsx"),
      "utf8",
    );
    assert.match(resumePanel, /initialPublish=\{resumed\.latestPublish\}/);
  });

  it("reuses CMS publish validation before side effects", () => {
    const cmsValidation = readFileSync(
      join(testDir, "cms-validation-core.ts"),
      "utf8",
    );
    assert.match(cmsValidation, /validateArticleInput/);
    assert.match(cmsValidation, /validateTutorialInput/);
    assert.match(cmsValidation, /validateLabInput/);

    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /validatePublishCmsState/);
    assert.match(engineSource, /CONTENT_INVALID/);
  });

  it("uses existing notification deduplication path", () => {
    const publishCore = readFileSync(
      join(testDir, "../../content/publish-content-core.ts"),
      "utf8",
    );
    assert.match(publishCore, /shouldSendPublishedNotification/);
    assert.match(publishCore, /deliverPublicContentNotification/);
  });
});

describe("Phase 8 content type labels", () => {
  it("labels article, tutorial, and lab for confirmation copy", () => {
    assert.equal(buildAgentContentTypeLabel("article"), "Article");
    assert.equal(buildAgentContentTypeLabel("tutorial"), "Tutorial");
    assert.equal(buildAgentContentTypeLabel("lab"), "Cyber Lab");
  });
});
