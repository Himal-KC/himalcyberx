import type { SolReviewOutput, AuthoritativeSourceRecord } from "./types";

export interface ReviewValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedReview: SolReviewOutput | null;
}

export function buildAllowedEvidenceIds(input: {
  verifiedClaimIds: string[];
  authoritativeSources: AuthoritativeSourceRecord[];
}): Set<string> {
  const allowed = new Set<string>(input.verifiedClaimIds);

  for (const source of input.authoritativeSources) {
    allowed.add(source.id);
    allowed.add(`source:${source.id}`);
    allowed.add(`url:${source.url.trim().toLowerCase()}`);
  }

  return allowed;
}

export function validateSolReviewOutput(input: {
  review: SolReviewOutput | null;
  contentType: SolReviewOutput["contentType"];
  allowedEvidenceIds: Set<string>;
  allowedSourceUrls: Set<string>;
}): ReviewValidationResult {
  const errors: string[] = [];

  if (!input.review) {
    return {
      valid: false,
      errors: ["review_output_missing"],
      sanitizedReview: null,
    };
  }

  if (input.review.contentType !== input.contentType) {
    errors.push("review_content_type_mismatch");
  }

  for (const finding of input.review.findings) {
    if (
      finding.status === "supported" &&
      finding.evidenceSourceIds.length === 0
    ) {
      errors.push(`supported_finding_missing_evidence:${finding.findingId}`);
    }

    for (const evidenceId of finding.evidenceSourceIds) {
      if (!input.allowedEvidenceIds.has(evidenceId)) {
        errors.push(`unknown_evidence_source_id:${evidenceId}`);
      }
    }
  }

  for (const url of extractUrlsFromReview(input.review)) {
    if (!input.allowedSourceUrls.has(url.trim().toLowerCase())) {
      errors.push(`unknown_review_url:${url}`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      sanitizedReview: null,
    };
  }

  return {
    valid: true,
    errors: [],
    sanitizedReview: input.review,
  };
}

function extractUrlsFromReview(review: SolReviewOutput): string[] {
  const urls: string[] = [];
  const pattern = /\bhttps?:\/\/[^\s"'<>]+/gi;

  for (const value of [
    review.summary,
    review.publicationRecommendation,
    ...review.unsupportedClaims,
    ...review.conflictingClaims,
    ...review.findings.flatMap((finding) => [
      finding.claimText,
      finding.explanation,
      finding.suggestedCorrection ?? "",
    ]),
  ]) {
    for (const match of value.match(pattern) ?? []) {
      urls.push(match);
    }
  }

  return urls;
}

export function validateDiscoveryNotPromotedToVerified(input: {
  review: SolReviewOutput;
  verifiedClaimIds: Set<string>;
}): string[] {
  const issues: string[] = [];

  for (const finding of input.review.findings) {
    if (finding.status !== "supported") {
      continue;
    }

    const usesOnlyVerifiedEvidence = finding.evidenceSourceIds.every((id) =>
      input.verifiedClaimIds.has(id) ||
      id.startsWith("source:") ||
      id.startsWith("url:"),
    );

    if (!usesOnlyVerifiedEvidence) {
      issues.push(`discovery_promoted_to_verified:${finding.findingId}`);
    }
  }

  return issues;
}
