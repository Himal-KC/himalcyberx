import "server-only";

import type { CveVerificationResult } from "@/lib/agent/research/cve";
import type {
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
  VerifiedClaimType,
} from "@/lib/agent/types";

const STRUCTURED_CLAIM_TYPES = new Set<VerifiedClaimType>([
  "cve_id",
  "cvss",
  "affected_product",
  "affected_versions",
  "exploitation_status",
  "mitigation",
  "disclosure_date",
  "patch_information",
]);

export interface ResearchQualityInput {
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  cveResults: CveVerificationResult[];
  researchConfidence: ResearchConfidence;
  unpromotedDiscoveryCount: number;
  topicHasCve: boolean;
}

function countStructuredClaims(verifiedClaims: VerifiedClaim[]): number {
  return verifiedClaims.filter((claim) => STRUCTURED_CLAIM_TYPES.has(claim.type))
    .length;
}

function countGuidanceClaims(verifiedClaims: VerifiedClaim[]): number {
  return verifiedClaims.filter(
    (claim) => claim.type === "guidance" || claim.type === "general",
  ).length;
}

export function evaluateResearchQuality({
  sources,
  verifiedClaims,
  uncertainClaims,
  cveResults,
  researchConfidence,
  unpromotedDiscoveryCount,
  topicHasCve,
}: ResearchQualityInput): ResearchQuality {
  const hasDefinitiveCveMiss = cveResults.some(
    (result) => result.status === "not_found",
  );
  const hasCveUnavailable = cveResults.some(
    (result) => result.status === "unavailable",
  );
  const hasOfficialSource = sources.some(
    (source) =>
      source.sourceType === "official" || source.sourceType === "primary",
  );
  const onlySecondarySources =
    sources.length > 0 &&
    sources.every((source) => source.sourceType === "secondary");

  const structuredClaims = countStructuredClaims(verifiedClaims);
  const guidanceClaims = countGuidanceClaims(verifiedClaims);
  const highConfidenceClaims = verifiedClaims.filter(
    (claim) => claim.confidence === "high",
  ).length;

  const criticalClaimsUnsupported =
    topicHasCve &&
    verifiedClaims.filter((claim) => claim.type === "cve_id").length === 0 &&
    !hasCveUnavailable;

  if (sources.length === 0 || criticalClaimsUnsupported || hasDefinitiveCveMiss) {
    return "failed";
  }

  const weakEvidenceOnly =
    verifiedClaims.length === 0 ||
    (topicHasCve && structuredClaims === 0 && !hasCveUnavailable) ||
    (!topicHasCve && guidanceClaims === 0);

  if (weakEvidenceOnly) {
    return "failed";
  }

  const exploitationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("exploitation"),
  );
  const mitigationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("mitigation"),
  );
  const discoveryOnlyUncertainty = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("discovery context"),
  );

  const passedThreshold =
    hasOfficialSource &&
    highConfidenceClaims >= 2 &&
    (topicHasCve ? structuredClaims >= 2 : guidanceClaims >= 2) &&
    uncertainClaims.length === 0 &&
    unpromotedDiscoveryCount <= 2 &&
    researchConfidence !== "low";

  if (passedThreshold) {
    return "passed";
  }

  if (
    uncertainClaims.length > 0 ||
    onlySecondarySources ||
    hasCveUnavailable ||
    exploitationUncertain ||
    mitigationUncertain ||
    discoveryOnlyUncertainty ||
    unpromotedDiscoveryCount >= 3 ||
    researchConfidence === "low" ||
    verifiedClaims.length < 2
  ) {
    return "needs_review";
  }

  if (hasOfficialSource && verifiedClaims.length >= 2) {
    return "needs_review";
  }

  return "failed";
}
