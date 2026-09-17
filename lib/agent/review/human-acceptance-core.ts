import type { GroundingAuditResult } from "../generation/types";
import type { ReadinessIssue } from "../readiness/types";
import type { AgentReviewRecord } from "./types";

export const PHASE5_HUMAN_ACCEPTANCE_VERSION = "phase5-acceptance-v1";

export type Phase5HumanReviewResolution = "accepted";

export interface Phase5HumanReviewAcceptanceRecord {
  version: typeof PHASE5_HUMAN_ACCEPTANCE_VERSION;
  resolution: Phase5HumanReviewResolution;
  agentRunId: string;
  agentReviewId: string;
  draftFingerprint: string;
  resolvedAt: string;
  resolvedBy: string | null;
}

const CRITICAL_SEVERITIES = new Set(["critical", "major"]);
const CRITICAL_CLAIM_TYPES = new Set([
  "cve_id",
  "cvss",
  "kev_status",
  "patch_id",
  "exploitation",
  "security_impact",
]);

function hasMaterialUnsupportedFinding(
  review: Pick<AgentReviewRecord, "findings">,
): boolean {
  return review.findings.some(
    (finding) =>
      finding.status === "unsupported" &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

function hasMaterialConflictingFinding(
  review: Pick<AgentReviewRecord, "findings">,
): boolean {
  return review.findings.some(
    (finding) =>
      finding.status === "conflicting" &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

export function parsePhase5HumanReviewAcceptance(
  value: unknown,
): Phase5HumanReviewAcceptanceRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Phase5HumanReviewAcceptanceRecord;
  if (record.version !== PHASE5_HUMAN_ACCEPTANCE_VERSION) {
    return null;
  }
  if (record.resolution !== "accepted") {
    return null;
  }
  if (
    typeof record.agentRunId !== "string" ||
    typeof record.agentReviewId !== "string" ||
    typeof record.draftFingerprint !== "string" ||
    typeof record.resolvedAt !== "string"
  ) {
    return null;
  }

  return {
    version: PHASE5_HUMAN_ACCEPTANCE_VERSION,
    resolution: "accepted",
    agentRunId: record.agentRunId,
    agentReviewId: record.agentReviewId,
    draftFingerprint: record.draftFingerprint,
    resolvedAt: record.resolvedAt,
    resolvedBy:
      typeof record.resolvedBy === "string" ? record.resolvedBy : null,
  };
}

export function isPhase5HumanAcceptanceCurrentlyValid(input: {
  acceptance: Phase5HumanReviewAcceptanceRecord | null;
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
}): boolean {
  if (!input.acceptance || !input.review) {
    return false;
  }

  if (input.acceptance.agentRunId !== input.agentRunId) {
    return false;
  }

  if (input.acceptance.agentReviewId !== input.review.id) {
    return false;
  }

  if (input.acceptance.draftFingerprint !== input.currentDraftFingerprint) {
    return false;
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    return false;
  }

  return true;
}

export function assessPhase5HumanAcceptanceEligibility(input: {
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
  groundingAudit: GroundingAuditResult;
}): { eligible: true } | { eligible: false; reason: string } {
  if (!input.review) {
    return { eligible: false, reason: "No Phase 5 review exists for this run." };
  }

  if (input.review.agentRunId !== input.agentRunId) {
    return { eligible: false, reason: "Review does not belong to this run." };
  }

  if (input.review.status === "fail") {
    return {
      eligible: false,
      reason: "Phase 5 FAIL reviews cannot be accepted.",
    };
  }

  if (input.review.status === "pass") {
    return {
      eligible: false,
      reason: "Phase 5 pass reviews do not require human acceptance.",
    };
  }

  if (input.review.status !== "needs_review") {
    return {
      eligible: false,
      reason: "Only Phase 5 needs_review results can be accepted.",
    };
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    return {
      eligible: false,
      reason: "The Phase 5 review is stale for the current draft.",
    };
  }

  if (hasMaterialConflictingFinding(input.review)) {
    return {
      eligible: false,
      reason: "Material conflicting findings must be resolved before acceptance.",
    };
  }

  if (hasMaterialUnsupportedFinding(input.review)) {
    return {
      eligible: false,
      reason: "Material unsupported findings must be resolved before acceptance.",
    };
  }

  if (!input.groundingAudit.passed) {
    return {
      eligible: false,
      reason: "Deterministic grounding failures must be resolved before acceptance.",
    };
  }

  return { eligible: true };
}

export function buildPhase5HumanReviewAcceptanceRecord(input: {
  agentRunId: string;
  review: AgentReviewRecord;
  currentDraftFingerprint: string;
  resolvedBy: string | null;
  resolvedAt?: string;
}): Phase5HumanReviewAcceptanceRecord {
  return {
    version: PHASE5_HUMAN_ACCEPTANCE_VERSION,
    resolution: "accepted",
    agentRunId: input.agentRunId,
    agentReviewId: input.review.id,
    draftFingerprint: input.currentDraftFingerprint,
    resolvedAt: input.resolvedAt ?? new Date().toISOString(),
    resolvedBy: input.resolvedBy,
  };
}

export function buildAgentRunHumanAcceptanceMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  acceptance: Phase5HumanReviewAcceptanceRecord;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};

  return {
    ...existing,
    phase5HumanReviewAcceptance: input.acceptance,
  };
}

export function buildPhase5NeedsReviewReadinessIssue(): ReadinessIssue {
  return {
    code: "PHASE5_NEEDS_REVIEW",
    severity: "warning",
    category: "review",
    message: "The latest Phase 5 review still requires human review.",
    recommendedAction:
      "Review the Phase 5 findings and resolve outstanding issues before publishing.",
  };
}

export function reconcilePhase5NeedsReviewReadinessIssues(input: {
  issues: ReadinessIssue[];
  acceptance: Phase5HumanReviewAcceptanceRecord | null;
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
}): ReadinessIssue[] {
  const acceptanceValid = isPhase5HumanAcceptanceCurrentlyValid({
    acceptance: input.acceptance,
    agentRunId: input.agentRunId,
    review: input.review,
    currentDraftFingerprint: input.currentDraftFingerprint,
  });
  const needsHumanReview = input.review?.status === "needs_review";
  let issues = [...input.issues];
  const hasPhase5Issue = issues.some((entry) => entry.code === "PHASE5_NEEDS_REVIEW");

  if (needsHumanReview && acceptanceValid) {
    issues = issues.filter((entry) => entry.code !== "PHASE5_NEEDS_REVIEW");
  } else if (needsHumanReview && !acceptanceValid && !hasPhase5Issue) {
    issues = [...issues, buildPhase5NeedsReviewReadinessIssue()];
  }

  return issues;
}

export interface Phase5HumanAcceptanceUiState {
  accepted: boolean;
  valid: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  canAccept: boolean;
  acceptBlockedReason: string | null;
}

export function buildPhase5HumanAcceptanceUiState(input: {
  acceptance: Phase5HumanReviewAcceptanceRecord | null;
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
  groundingAudit: GroundingAuditResult;
}): Phase5HumanAcceptanceUiState {
  const valid = isPhase5HumanAcceptanceCurrentlyValid({
    acceptance: input.acceptance,
    agentRunId: input.agentRunId,
    review: input.review,
    currentDraftFingerprint: input.currentDraftFingerprint,
  });
  const eligibility = assessPhase5HumanAcceptanceEligibility({
    agentRunId: input.agentRunId,
    review: input.review,
    currentDraftFingerprint: input.currentDraftFingerprint,
    groundingAudit: input.groundingAudit,
  });

  return {
    accepted: Boolean(input.acceptance),
    valid,
    resolvedAt: input.acceptance?.resolvedAt ?? null,
    resolvedBy: input.acceptance?.resolvedBy ?? null,
    canAccept: eligibility.eligible && !valid,
    acceptBlockedReason: eligibility.eligible
      ? valid
        ? "Review findings are already accepted for the current draft."
        : null
      : eligibility.reason,
  };
}

export function readPhase5HumanReviewAcceptanceFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Phase5HumanReviewAcceptanceRecord | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return parsePhase5HumanReviewAcceptance(metadata.phase5HumanReviewAcceptance);
}
