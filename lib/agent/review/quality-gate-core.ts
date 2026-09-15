import type {
  ReviewGateResult,
  ReviewIntegritySection,
  ReviewQualityBreakdown,
  SolReviewOutput,
} from "./types";

export const QUALITY_WEIGHTS = {
  factualGrounding: 35,
  sourceIntegrity: 20,
  technicalAccuracy: 15,
  seoStructure: 10,
  readability: 10,
  originality: 5,
  internalLinkIntegrity: 5,
} as const;

const MATERIAL_STATUSES = new Set(["unsupported", "conflicting"]);

const CRITICAL_SEVERITIES = new Set(["critical", "major"]);

const CRITICAL_CLAIM_TYPES = new Set([
  "cve_id",
  "cvss",
  "kev_status",
  "patch_id",
  "exploitation",
  "security_impact",
]);

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeQualityBreakdown(
  breakdown: ReviewQualityBreakdown,
): ReviewQualityBreakdown {
  return {
    factualGrounding: clampScore(breakdown.factualGrounding),
    sourceIntegrity: clampScore(breakdown.sourceIntegrity),
    technicalAccuracy: clampScore(breakdown.technicalAccuracy),
    seoStructure: clampScore(breakdown.seoStructure),
    readability: clampScore(breakdown.readability),
    originality: clampScore(breakdown.originality),
    internalLinkIntegrity: clampScore(breakdown.internalLinkIntegrity),
  };
}

export function calculateDeterministicQualityScore(
  breakdown: ReviewQualityBreakdown,
): number {
  const normalized = normalizeQualityBreakdown(breakdown);
  const weighted =
    (normalized.factualGrounding * QUALITY_WEIGHTS.factualGrounding +
      normalized.sourceIntegrity * QUALITY_WEIGHTS.sourceIntegrity +
      normalized.technicalAccuracy * QUALITY_WEIGHTS.technicalAccuracy +
      normalized.seoStructure * QUALITY_WEIGHTS.seoStructure +
      normalized.readability * QUALITY_WEIGHTS.readability +
      normalized.originality * QUALITY_WEIGHTS.originality +
      normalized.internalLinkIntegrity * QUALITY_WEIGHTS.internalLinkIntegrity) /
    100;

  return clampScore(weighted);
}

function hasMaterialUnsupportedFinding(review: SolReviewOutput): boolean {
  return review.findings.some(
    (finding) =>
      MATERIAL_STATUSES.has(finding.status) &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

function hasNonCriticalPartialFindings(review: SolReviewOutput): boolean {
  return review.findings.some(
    (finding) =>
      (finding.status === "partially_supported" ||
        finding.status === "not_verifiable") &&
      !CRITICAL_SEVERITIES.has(finding.severity),
  );
}

export function evaluateReviewQualityGate(input: {
  review: SolReviewOutput;
  deterministicGroundingPassed: boolean;
  sourceIntegrityPassed: boolean;
  internalLinkIntegrityPassed: boolean;
}): ReviewGateResult {
  const qualityBreakdown = normalizeQualityBreakdown(input.review.qualityBreakdown);
  const overallQualityScore = calculateDeterministicQualityScore(qualityBreakdown);
  const hardGateFailures: string[] = [];

  if (!input.deterministicGroundingPassed) {
    hardGateFailures.push("deterministic_grounding_failed");
  }
  if (!input.sourceIntegrityPassed || !input.review.sourceIntegrity.passed) {
    hardGateFailures.push("source_integrity_failed");
  }
  if (
    !input.internalLinkIntegrityPassed ||
    !input.review.internalLinkIntegrity.passed
  ) {
    hardGateFailures.push("internal_link_integrity_failed");
  }
  if (hasMaterialUnsupportedFinding(input.review)) {
    hardGateFailures.push("material_unsupported_or_conflicting_claim");
  }
  if (input.review.unsupportedClaims.length > 0) {
    hardGateFailures.push("unsupported_claims_present");
  }
  if (input.review.conflictingClaims.length > 0) {
    hardGateFailures.push("conflicting_claims_present");
  }

  let overallStatus: ReviewGateResult["overallStatus"] = "pass";
  let factCheckStatus: ReviewGateResult["factCheckStatus"] = "passed";

  if (
    hardGateFailures.length > 0 ||
    overallQualityScore < 70
  ) {
    overallStatus = "fail";
    factCheckStatus = "failed";
  } else if (
    overallQualityScore < 85 ||
    hasNonCriticalPartialFindings(input.review) ||
    input.review.warnings.length > 0
  ) {
    overallStatus = "needs_review";
    factCheckStatus = "needs_review";
  }

  return {
    overallStatus,
    factCheckStatus,
    overallQualityScore,
    qualityBreakdown,
    hardGateFailures,
  };
}

export function mergeIntegritySections(
  deterministic: ReviewIntegritySection,
  model: ReviewIntegritySection,
): ReviewIntegritySection {
  const issues = [...new Set([...deterministic.issues, ...model.issues])];
  return {
    passed: deterministic.passed && model.passed && issues.length === 0,
    issues,
  };
}
