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

const PAGE_BACKED_CLAIM_TYPES = new Set<VerifiedClaimType>([
  "official_guidance",
  "preparedness",
  "response",
  "guidance",
  "general",
  "mitigation",
]);

export interface ResearchQualityInput {
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  cveResults: CveVerificationResult[];
  researchConfidence: ResearchConfidence;
  unpromotedDiscoveryCount: number;
  pageBackedClaimCount: number;
  highRelevanceClaimCount: number;
  successfulPageFetchCount: number;
  failedPageFetchCount: number;
  topicHasCve: boolean;
}

function countStructuredClaims(verifiedClaims: VerifiedClaim[]): number {
  return verifiedClaims.filter((claim) => STRUCTURED_CLAIM_TYPES.has(claim.type))
    .length;
}

function countPageBackedClaims(verifiedClaims: VerifiedClaim[]): number {
  return verifiedClaims.filter((claim) => PAGE_BACKED_CLAIM_TYPES.has(claim.type))
    .length;
}

export function evaluateResearchQuality({
  sources,
  verifiedClaims,
  uncertainClaims,
  cveResults,
  researchConfidence,
  unpromotedDiscoveryCount,
  pageBackedClaimCount,
  highRelevanceClaimCount,
  successfulPageFetchCount,
  failedPageFetchCount,
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
  const pageBackedClaims = countPageBackedClaims(verifiedClaims);
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
    (!topicHasCve &&
      (pageBackedClaimCount < 2 || highRelevanceClaimCount === 0));

  if (weakEvidenceOnly) {
    return "failed";
  }

  const exploitationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("exploitation"),
  );
  const mitigationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("mitigation"),
  );
  const pageEvidenceUncertainty = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("source page evidence"),
  );

  const passedThreshold =
    hasOfficialSource &&
    highConfidenceClaims >= 2 &&
    (topicHasCve
      ? structuredClaims >= 2
      : pageBackedClaimCount >= 2 &&
        highRelevanceClaimCount >= 2 &&
        successfulPageFetchCount >= 1) &&
    uncertainClaims.length === 0 &&
    unpromotedDiscoveryCount <= 2 &&
    failedPageFetchCount === 0 &&
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
    pageEvidenceUncertainty ||
    unpromotedDiscoveryCount >= 3 ||
    failedPageFetchCount > 0 ||
    researchConfidence === "low" ||
    verifiedClaims.length < 2 ||
    (!topicHasCve &&
      (pageBackedClaims < 2 || highRelevanceClaimCount < 2))
  ) {
    return "needs_review";
  }

  if (hasOfficialSource && verifiedClaims.length >= 2) {
    return "needs_review";
  }

  return "failed";
}
