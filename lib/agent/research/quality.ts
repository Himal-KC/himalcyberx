import "server-only";

import type { CveVerificationResult } from "@/lib/agent/research/cve";
import type {
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
} from "@/lib/agent/types";

export interface ResearchQualityInput {
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  cveResults: CveVerificationResult[];
  researchConfidence: ResearchConfidence;
}

export function evaluateResearchQuality({
  sources,
  verifiedClaims,
  uncertainClaims,
  cveResults,
  researchConfidence,
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

  const criticalClaimsUnsupported =
    cveResults.length > 0 &&
    verifiedClaims.filter((claim) => claim.field === "cve_id").length === 0 &&
    !hasCveUnavailable;

  if (sources.length === 0 || criticalClaimsUnsupported || hasDefinitiveCveMiss) {
    return "failed";
  }

  const exploitationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("exploitation"),
  );
  const mitigationUncertain = uncertainClaims.some((claim) =>
    claim.label.toLowerCase().includes("mitigation"),
  );

  if (
    uncertainClaims.length > 0 ||
    onlySecondarySources ||
    hasCveUnavailable ||
    exploitationUncertain ||
    mitigationUncertain ||
    researchConfidence === "low"
  ) {
    return "needs_review";
  }

  if (hasOfficialSource && verifiedClaims.length > 0) {
    return "passed";
  }

  return "needs_review";
}
