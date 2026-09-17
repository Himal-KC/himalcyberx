import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AgentReviewRecord } from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  assessPhase5HumanAcceptanceEligibility,
  buildAgentRunHumanAcceptanceMetadataUpdate,
  buildPhase5HumanReviewAcceptanceRecord,
  buildPhase5HumanAcceptanceUiState,
  isPhase5HumanAcceptanceCurrentlyValid,
  parsePhase5HumanReviewAcceptance,
  reconcilePhase5NeedsReviewReadinessIssues,
} = (await import(pathToFileURL(join(testDir, "human-acceptance-core.ts")).href)) as typeof import("./human-acceptance-core");

const RUN_ID = "00000000-0000-4000-8000-000000000001";
const REVIEW_ID = "00000000-0000-4000-8000-000000000100";
const OTHER_REVIEW_ID = "00000000-0000-4000-8000-000000000101";
const OTHER_RUN_ID = "00000000-0000-4000-8000-000000000002";
const FINGERPRINT_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const FINGERPRINT_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function buildReview(overrides: Partial<AgentReviewRecord> = {}): AgentReviewRecord {
  return {
    id: REVIEW_ID,
    agentRunId: RUN_ID,
    contentType: "article",
    contentId: "00000000-0000-4000-8000-000000000010",
    status: "needs_review",
    factCheckStatus: "needs_review",
    reviewModel: "gpt-5.6-sol",
    reviewVersion: "phase5-v1",
    draftFingerprint: FINGERPRINT_A,
    qualityScore: 91,
    summary: "Advisory review",
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
    unsupportedClaims: ["Advisory unsupported note"],
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

const passedGrounding = {
  passed: true,
  unsupportedClaims: [],
  invalidSourceUrls: [],
  invalidInternalLinks: [],
  warnings: [],
};

describe("Phase 5 human review acceptance core", () => {
  it("allows needs_review with clean advisory findings to be accepted", () => {
    const review = buildReview();
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review,
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, true);
  });

  it("does not require acceptance for Phase 5 pass", () => {
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review: buildReview({ status: "pass", factCheckStatus: "passed" }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, false);
    assert.match(eligibility.reason, /pass/i);
  });

  it("blocks acceptance for Phase 5 fail", () => {
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review: buildReview({ status: "fail", factCheckStatus: "failed" }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, false);
    assert.match(eligibility.reason, /FAIL/i);
  });

  it("blocks material unsupported findings", () => {
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review: buildReview({
        findings: [
          {
            findingId: "f1",
            severity: "major",
            claimType: "cve_id",
            claimText: "CVE-2026-0001",
            status: "unsupported",
            evidenceSourceIds: [],
            explanation: "Not supported",
            suggestedCorrection: null,
          },
        ],
      }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, false);
    assert.match(eligibility.reason, /unsupported/i);
  });

  it("blocks material conflicting findings", () => {
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review: buildReview({
        findings: [
          {
            findingId: "f2",
            severity: "critical",
            claimType: "security_impact",
            claimText: "Critical impact claim",
            status: "conflicting",
            evidenceSourceIds: [],
            explanation: "Conflict",
            suggestedCorrection: null,
          },
        ],
      }),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, false);
    assert.match(eligibility.reason, /conflicting/i);
  });

  it("blocks stale review acceptance", () => {
    const eligibility = assessPhase5HumanAcceptanceEligibility({
      agentRunId: RUN_ID,
      review: buildReview({ draftFingerprint: FINGERPRINT_A }),
      currentDraftFingerprint: FINGERPRINT_B,
      groundingAudit: passedGrounding,
    });

    assert.equal(eligibility.eligible, false);
    assert.match(eligibility.reason, /stale/i);
  });

  it("rejects wrong review id during validity checks", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview({ id: OTHER_REVIEW_ID }),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review: buildReview({ id: REVIEW_ID }),
        currentDraftFingerprint: FINGERPRINT_A,
      }),
      false,
    );
  });

  it("rejects wrong run during validity checks", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: OTHER_RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review: buildReview(),
        currentDraftFingerprint: FINGERPRINT_A,
      }),
      false,
    );
  });

  it("ties acceptance to draft fingerprint", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review: buildReview({ draftFingerprint: FINGERPRINT_A }),
        currentDraftFingerprint: FINGERPRINT_B,
      }),
      false,
    );
  });

  it("invalidates acceptance when article fingerprint changes", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review: buildReview({ draftFingerprint: FINGERPRINT_B }),
        currentDraftFingerprint: FINGERPRINT_B,
      }),
      false,
    );
  });

  it("invalidates old acceptance when a new Phase 5 review id is current", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview({ id: REVIEW_ID }),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });

    assert.equal(
      isPhase5HumanAcceptanceCurrentlyValid({
        acceptance,
        agentRunId: RUN_ID,
        review: buildReview({ id: OTHER_REVIEW_ID }),
        currentDraftFingerprint: FINGERPRINT_A,
      }),
      false,
    );
  });

  it("reconciles Phase 7 issues when acceptance is valid", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });
    const issues = reconcilePhase5NeedsReviewReadinessIssues({
      issues: [
        {
          code: "PHASE5_NEEDS_REVIEW",
          severity: "warning",
          category: "review",
          message: "needs review",
          recommendedAction: "review",
        },
      ],
      acceptance,
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
    });

    assert.equal(
      issues.some((entry) => entry.code === "PHASE5_NEEDS_REVIEW"),
      false,
    );
  });

  it("restores Phase 7 needs review when acceptance is missing", () => {
    const issues = reconcilePhase5NeedsReviewReadinessIssues({
      issues: [],
      acceptance: null,
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
    });

    assert.ok(issues.some((entry) => entry.code === "PHASE5_NEEDS_REVIEW"));
  });

  it("preserves audit metadata in generation_metadata updates", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
      resolvedAt: "2026-09-16T00:00:00.000Z",
    });

    const metadata = buildAgentRunHumanAcceptanceMetadataUpdate({
      existingMetadata: { finalReadiness: { status: "NEEDS_REVIEW" } },
      acceptance,
    });

    assert.deepEqual(metadata.finalReadiness, { status: "NEEDS_REVIEW" });
    assert.equal(
      parsePhase5HumanReviewAcceptance(metadata.phase5HumanReviewAcceptance)
        ?.resolvedBy,
      "admin-1",
    );
  });

  it("builds UI state for refresh/resume with valid acceptance", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });
    const ui = buildPhase5HumanAcceptanceUiState({
      acceptance,
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      groundingAudit: passedGrounding,
    });

    assert.equal(ui.valid, true);
    assert.equal(ui.canAccept, false);
    assert.equal(ui.accepted, true);
  });

  it("isolates acceptance per run via metadata parsing", () => {
    const acceptance = buildPhase5HumanReviewAcceptanceRecord({
      agentRunId: RUN_ID,
      review: buildReview(),
      currentDraftFingerprint: FINGERPRINT_A,
      resolvedBy: "admin-1",
    });
    const metadata = buildAgentRunHumanAcceptanceMetadataUpdate({
      existingMetadata: null,
      acceptance,
    });

    const parsed = parsePhase5HumanReviewAcceptance(
      metadata.phase5HumanReviewAcceptance,
    );
    assert.equal(parsed?.agentRunId, RUN_ID);
    assert.notEqual(parsed?.agentRunId, OTHER_RUN_ID);
  });
});
