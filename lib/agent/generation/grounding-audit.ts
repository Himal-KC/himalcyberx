import type { VerifiedClaim } from "@/lib/agent/types";
import type {
  GeneratedDraft,
  GroundingAuditResult,
} from "@/lib/agent/generation/types";

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/gi;
const CVSS_PATTERN = /\bCVSS\b[^.<]{0,80}?\b\d(?:\.\d)?\b/gi;
const KEV_PATTERN = /\b(known exploited vulnerabilities|CISA KEV|KEV catalog)\b/gi;
const PATCH_PATTERN = /\bKB\d{5,7}\b/gi;

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function collectVerifiedValues(claims: VerifiedClaim[]): Set<string> {
  const values = new Set<string>();

  for (const claim of claims) {
    values.add(normalizeValue(claim.statement));

    const cveMatches = claim.statement.match(CVE_PATTERN) ?? [];
    for (const match of cveMatches) {
      values.add(normalizeValue(match));
    }

    if (claim.type === "cvss") {
      values.add(normalizeValue(claim.statement));
    }
  }

  return values;
}

function extractHighRiskFacts(text: string): string[] {
  const facts: string[] = [];
  const patterns = [CVE_PATTERN, CVSS_PATTERN, KEV_PATTERN, PATCH_PATTERN];

  for (const pattern of patterns) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      facts.push(match.trim());
    }
  }

  return facts;
}

function isSupportedFact(fact: string, verifiedValues: Set<string>): boolean {
  const normalized = normalizeValue(fact);
  if (verifiedValues.has(normalized)) {
    return true;
  }

  for (const verified of verifiedValues) {
    if (verified.includes(normalized) || normalized.includes(verified)) {
      return true;
    }
  }

  return false;
}

export function auditGrounding({
  draft,
  verifiedClaims,
  allowedSourceUrls,
  allowedContentIds,
}: {
  draft: GeneratedDraft;
  verifiedClaims: VerifiedClaim[];
  allowedSourceUrls: string[];
  allowedContentIds: Set<string>;
}): GroundingAuditResult {
  const allowedUrls = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );
  const verifiedValues = collectVerifiedValues(verifiedClaims);
  const unsupportedClaims: string[] = [];
  const invalidSourceUrls: string[] = [];
  const invalidInternalLinks: string[] = [];
  const warnings: string[] = [];

  const bodyParts: string[] = [];
  if (draft.contentType === "article") {
    bodyParts.push(draft.content, draft.excerpt, draft.keyTakeaways.join(" "));
  } else if (draft.contentType === "tutorial") {
    bodyParts.push(
      draft.description,
      draft.requirements,
      draft.introduction,
      draft.instructions,
      draft.keyTakeaways,
      draft.securityNotes,
    );
  } else {
    bodyParts.push(
      draft.description,
      draft.learningObjectives,
      draft.requirementsTools,
      draft.introduction,
      draft.instructions,
      draft.expectedResult,
      draft.securityNotes,
    );
  }

  const combinedBody = bodyParts.join("\n");
  for (const fact of extractHighRiskFacts(combinedBody)) {
    if (!isSupportedFact(fact, verifiedValues)) {
      unsupportedClaims.push(fact);
    }
  }

  for (const mapping of draft.sourceMappings) {
    for (const url of mapping.sourceUrls) {
      if (!allowedUrls.has(url.trim().toLowerCase())) {
        invalidSourceUrls.push(url);
      }
    }
  }

  for (const link of draft.internalLinks) {
    if (!allowedContentIds.has(link.contentId)) {
      invalidInternalLinks.push(link.contentId);
    }
  }

  if (draft.warnings.length > 0) {
    warnings.push(...draft.warnings);
  }

  const passed =
    unsupportedClaims.length === 0 &&
    invalidSourceUrls.length === 0 &&
    invalidInternalLinks.length === 0;

  return {
    passed,
    unsupportedClaims,
    invalidSourceUrls,
    invalidInternalLinks,
    warnings,
  };
}
