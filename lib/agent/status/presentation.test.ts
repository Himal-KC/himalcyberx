import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const { buildPublicationAuditFromAttempt } = (await import(
  pathToFileURL(join(testDir, "../publish/metadata-core.ts")).href
)) as typeof import("../publish/metadata-core");

const { buildOutOfBandPublishedResult } = (await import(
  pathToFileURL(join(testDir, "../publish/published-content-core.ts")).href
)) as typeof import("../publish/published-content-core");

const {
  buildAgentRunAdminPresentation,
  buildAgentRunAdminPresentationFromRun,
  buildSwitchRunCardLabel,
  deriveWorkflowLabel,
  formatPublicationLabel,
  formatPublicationReadinessLabel,
  workflowLabelNeverClaimsReadyToPublish,
} = (await import(pathToFileURL(join(testDir, "presentation-core.ts")).href)) as typeof import("./presentation-core");

const VALID_CONTENT_ID = "00000000-0000-4000-8000-000000000010";
const VALID_RUN_ID = "00000000-0000-4000-8000-000000000001";
const FINGERPRINT_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function buildChecks() {
  return {
    review: "pass" as const,
    factual: "pass" as const,
    cms: "pass" as const,
    source: "pass" as const,
    seo: "pass" as const,
    image: "pass" as const,
    altText: "pass" as const,
    structure: "pass" as const,
    internalLinks: "pass" as const,
  };
}

function buildFinalReadinessMetadata(
  status: "BLOCKED" | "NEEDS_REVIEW" | "READY_TO_PUBLISH",
  readinessScore: number,
) {
  return {
    finalReadiness: {
      version: "phase7-v1",
      evaluatedAt: "2026-09-15T00:00:00.000Z",
      status,
      readinessScore,
      fingerprint: FINGERPRINT_A,
      reviewFingerprint: FINGERPRINT_A,
      stale: false,
      issues: [],
      checks: buildChecks(),
    },
  };
}

function buildRunMetadata(
  status: "BLOCKED" | "NEEDS_REVIEW" | "READY_TO_PUBLISH",
  readinessScore: number,
) {
  return buildFinalReadinessMetadata(status, readinessScore);
}

function buildCisaPresentationInput() {
  return {
    contentType: "article" as const,
    contentId: VALID_CONTENT_ID,
    contentStatus: "draft" as const,
    workflow: { status: "ready" as const, stage: "ready" as const },
    research: {
      researchQuality: "needs_review" as const,
      researchConfidence: "low" as const,
    },
    review: {
      status: "needs_review" as const,
      qualityScore: 91,
      stale: false,
    },
    readiness: {
      status: "BLOCKED" as const,
      readinessScore: 50,
      stale: false,
      reviewStale: false,
    },
    publish: null,
    runMetadata: buildRunMetadata("BLOCKED", 50),
  };
}

describe("Agent run admin presentation", () => {
  it("shows Phase 3, Phase 5, and Phase 7 statuses without contradiction", () => {
    const presentation = buildAgentRunAdminPresentation(buildCisaPresentationInput());

    assert.equal(
      presentation.summaryLines.find((line) => line.domain === "workflow")?.value,
      "Draft saved · review completed",
    );
    assert.equal(presentation.researchAssessmentLabel, "Needs review · Low confidence");
    assert.equal(presentation.factCheckLabel, "Needs review · 91");
    assert.equal(presentation.publicationReadinessLabel, "BLOCKED · 50");
    assert.equal(presentation.publicationLabel, "Not published");
  });

  it("never renders ready/ready workflow as Ready to Publish", () => {
    const workflow = deriveWorkflowLabel({
      status: "ready",
      stage: "ready",
      hasReview: false,
    });

    assert.equal(workflow, "Draft saved · awaiting review");
    assert.equal(workflowLabelNeverClaimsReadyToPublish(workflow), true);

    const presentation = buildAgentRunAdminPresentation({
      ...buildCisaPresentationInput(),
      readiness: null,
    });
    const readinessLine = presentation.summaryLines.find(
      (line) => line.domain === "publicationReadiness",
    );
    assert.equal(readinessLine?.value, "Readiness not checked");
    assert.doesNotMatch(readinessLine?.value ?? "", /ready to publish/i);
  });

  it("uses canonical publication readiness on switch-run cards", () => {
    const label = buildSwitchRunCardLabel({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      contentStatus: "draft",
      runMetadata: buildRunMetadata("BLOCKED", 50),
      contentTypeOfRun: "article",
    });

    assert.equal(label, "Article · BLOCKED");
  });

  it("displays READY TO PUBLISH when Phase 7 is READY_TO_PUBLISH", () => {
    const label = formatPublicationReadinessLabel({
      status: "READY_TO_PUBLISH",
      readinessScore: 96,
    });
    assert.equal(label, "READY TO PUBLISH · 96");
  });

  it("displays BLOCKED when Phase 7 is BLOCKED", () => {
    const label = formatPublicationReadinessLabel({
      status: "BLOCKED",
      readinessScore: 50,
    });
    assert.equal(label, "BLOCKED · 50");
  });

  it("displays NEEDS REVIEW when Phase 7 is NEEDS_REVIEW", () => {
    const label = formatPublicationReadinessLabel({
      status: "NEEDS_REVIEW",
      readinessScore: 72,
    });
    assert.equal(label, "NEEDS REVIEW · 72");
  });

  it("shows Readiness not checked when Phase 7 has never been evaluated", () => {
    const presentation = buildAgentRunAdminPresentation({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      contentStatus: "draft",
      workflow: { status: "ready", stage: "ready" },
      research: {
        researchQuality: "passed",
        researchConfidence: "high",
      },
      review: null,
      readiness: null,
      publish: null,
      runMetadata: null,
    });

    assert.equal(presentation.publicationReadinessLabel, "Readiness not checked");
    assert.equal(
      buildSwitchRunCardLabel({
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        contentStatus: "draft",
        runMetadata: null,
        contentTypeOfRun: "article",
      }),
      "Article · Readiness not checked",
    );
  });

  it("displays PUBLISHED for proven Phase 8 publication", () => {
    const proof = buildPublicationAuditFromAttempt({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      readinessFingerprint: FINGERPRINT_A,
      result: "PUBLISHED",
      publishedAt: "2026-09-15T12:00:00.000Z",
      publicUrl: "/articles/cisa-ransomware",
      notificationOutcome: "sent",
      attemptedAt: "2026-09-15T12:00:00.000Z",
    });

    const presentation = buildAgentRunAdminPresentation({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      contentStatus: "published",
      workflow: { status: "completed", stage: "completed" },
      research: null,
      review: null,
      readiness: {
        status: "READY_TO_PUBLISH",
        readinessScore: 96,
        stale: false,
        reviewStale: false,
      },
      publish: {
        code: "PUBLISHED",
        success: true,
        alreadyPublished: false,
      },
      runMetadata: { phase8Publication: proof },
    });

    assert.equal(presentation.publicationLabel, "PUBLISHED");
    assert.equal(
      buildSwitchRunCardLabel({
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        contentStatus: "published",
        runMetadata: { phase8Publication: proof },
        contentTypeOfRun: "article",
      }),
      "Article · PUBLISHED",
    );
  });

  it("displays PUBLISHED OUTSIDE HCX AGENT for out-of-band publication", () => {
    const publish = buildOutOfBandPublishedResult({
      context: {
        agentRunId: VALID_RUN_ID,
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        slug: "cisa-ransomware",
      },
    });

    assert.equal(
      formatPublicationLabel({
        publish,
        contentStatus: "published",
        hasPhase8Proof: false,
      }),
      "PUBLISHED OUTSIDE HCX AGENT",
    );

    assert.equal(
      buildSwitchRunCardLabel({
        contentType: "article",
        contentId: VALID_CONTENT_ID,
        contentStatus: "published",
        runMetadata: null,
        contentTypeOfRun: "article",
      }),
      "Article · PUBLISHED OUTSIDE HCX AGENT",
    );
  });

  it("labels stale Phase 5 and Phase 7 results as outdated and never ready", () => {
    const factCheck = buildAgentRunAdminPresentation({
      ...buildCisaPresentationInput(),
      review: {
        status: "needs_review",
        qualityScore: 91,
        stale: true,
      },
    }).factCheckLabel;
    assert.match(factCheck ?? "", /outdated/i);
    assert.doesNotMatch(factCheck ?? "", /ready to publish/i);

    const readiness = formatPublicationReadinessLabel({
      status: "READY_TO_PUBLISH",
      readinessScore: 96,
      stale: true,
    });
    assert.match(readiness, /outdated/i);
    assert.doesNotMatch(readiness, /READY TO PUBLISH · 96$/);
  });

  it("produces identical presentation for identical persisted inputs", () => {
    const input = buildCisaPresentationInput();
    const first = buildAgentRunAdminPresentation(input);
    const second = buildAgentRunAdminPresentation(input);

    assert.deepEqual(first, second);
  });

  it("does not leak statuses between different runs", () => {
    const blocked = buildAgentRunAdminPresentation(buildCisaPresentationInput());
    const unchecked = buildAgentRunAdminPresentation({
      contentType: "article",
      contentId: VALID_CONTENT_ID,
      contentStatus: "draft",
      workflow: { status: "ready", stage: "ready" },
      research: {
        researchQuality: "passed",
        researchConfidence: "high",
      },
      review: null,
      readiness: null,
      publish: null,
      runMetadata: null,
    });

    assert.equal(blocked.publicationReadinessLabel, "BLOCKED · 50");
    assert.equal(unchecked.publicationReadinessLabel, "Readiness not checked");
    assert.notEqual(
      blocked.publicationReadinessLabel,
      unchecked.publicationReadinessLabel,
    );
  });

  it("derives presentation from persisted run records without mutation", () => {
    const presentation = buildAgentRunAdminPresentationFromRun({
      run: {
        id: VALID_RUN_ID,
        topic: "CISA ransomware guidance",
        content_type: "article",
        status: "ready",
        stage: "ready",
        article_id: VALID_CONTENT_ID,
        tutorial_id: null,
        lab_id: null,
        research_summary: "Summary",
        recommended_angle: "Angle",
        primary_keyword: "ransomware",
        secondary_keywords: [],
        research_payload: {},
        generation_metadata: buildRunMetadata("BLOCKED", 50),
        quality_score: 91,
        fact_check_status: "needs_review",
        error_message: null,
        started_at: "2026-09-15T00:00:00.000Z",
        completed_at: null,
        created_at: "2026-09-15T00:00:00.000Z",
        updated_at: "2026-09-15T00:00:00.000Z",
      },
      contentId: VALID_CONTENT_ID,
      contentStatus: "draft",
      research: {
        researchQuality: "needs_review",
        researchConfidence: "low",
      },
      review: {
        status: "needs_review",
        qualityScore: 91,
        stale: false,
      },
      readiness: {
        status: "BLOCKED",
        readinessScore: 50,
        stale: false,
        reviewStale: false,
      },
      publish: null,
    });

    assert.equal(presentation.switchRunCardLabel, "Article · BLOCKED");
    assert.equal(presentation.publicationReadinessLabel, "BLOCKED · 50");
  });

  it("does not call external APIs from the presentation module", () => {
    const source = readFileSync(join(testDir, "presentation-core.ts"), "utf8");
    assert.doesNotMatch(
      source,
      /openai|tavily|nvd|cisa|fetch\(|notifySubscriber|publishArticle|sendEmail/i,
    );
  });

  it("does not publish or send email from the presentation module", () => {
    const source = readFileSync(join(testDir, "presentation-core.ts"), "utf8");
    assert.doesNotMatch(source, /publishAgentContent|sendEmail|notifySubscriber/i);
  });
});
