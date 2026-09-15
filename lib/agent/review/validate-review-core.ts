import type { SolReviewOutput, AuthoritativeSourceRecord } from "./types";
import type { VerifiedClaim } from "../types";

export type EvidenceClassification =
  | "verified_claim"
  | "verified_source"
  | "discovery_only"
  | "internal_hcx"
  | "unknown";

export interface EvidenceCatalogEntry {
  id: string;
  classification: EvidenceClassification;
  aliases: string[];
}

export interface EvidenceClassificationIndex {
  byId: Map<string, EvidenceClassification>;
  verifiedClaimIds: Set<string>;
  verifiedSourceIds: Set<string>;
  discoveryOnlyIds: Set<string>;
  internalHcxIds: Set<string>;
  catalog: EvidenceCatalogEntry[];
}

export interface EvidenceClassificationDiagnostics {
  evidenceId: string;
  effectiveClassification: EvidenceClassification;
  isVerifiedClaim: boolean;
  isVerifiedSource: boolean;
  isDiscoveryOnly: boolean;
  isInternalHcx: boolean;
}

export interface ReviewValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedReview: SolReviewOutput | null;
}

export function buildEvidenceClassificationIndex(input: {
  verifiedClaims: VerifiedClaim[];
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: Array<{ id: string }>;
  discoveryContexts: Array<{ url: string }>;
}): EvidenceClassificationIndex {
  const byId = new Map<string, EvidenceClassification>();
  const verifiedClaimIds = new Set<string>();
  const verifiedSourceIds = new Set<string>();
  const discoveryOnlyIds = new Set<string>();
  const internalHcxIds = new Set<string>();
  const catalog: EvidenceCatalogEntry[] = [];

  for (const claim of input.verifiedClaims) {
    byId.set(claim.id, "verified_claim");
    verifiedClaimIds.add(claim.id);
    catalog.push({
      id: claim.id,
      classification: "verified_claim",
      aliases: [],
    });
  }

  for (const source of input.authoritativeSources) {
    const aliases = [
      source.id,
      `source:${source.id}`,
      `url:${source.url.trim().toLowerCase()}`,
    ];

    for (const alias of aliases) {
      byId.set(alias, "verified_source");
      verifiedSourceIds.add(alias);
    }

    catalog.push({
      id: source.id,
      classification: "verified_source",
      aliases: aliases.filter((alias) => alias !== source.id),
    });
  }

  for (const item of input.approvedInternalContent) {
    const aliases = [item.id, `internal:${item.id}`];
    for (const alias of aliases) {
      byId.set(alias, "internal_hcx");
      internalHcxIds.add(alias);
    }

    catalog.push({
      id: item.id,
      classification: "internal_hcx",
      aliases: [`internal:${item.id}`],
    });
  }

  const authoritativeUrls = new Set(
    input.authoritativeSources.map((source) => source.url.trim().toLowerCase()),
  );

  for (const discovery of input.discoveryContexts) {
    const normalizedUrl = discovery.url.trim().toLowerCase();
    if (authoritativeUrls.has(normalizedUrl)) {
      continue;
    }

    const discoveryId = `discovery:${normalizedUrl}`;
    const urlAlias = `url:${normalizedUrl}`;
    byId.set(discoveryId, "discovery_only");
    discoveryOnlyIds.add(discoveryId);
    if (!byId.has(urlAlias)) {
      byId.set(urlAlias, "discovery_only");
      discoveryOnlyIds.add(urlAlias);
    }
  }

  return {
    byId,
    verifiedClaimIds,
    verifiedSourceIds,
    discoveryOnlyIds,
    internalHcxIds,
    catalog,
  };
}

export function buildReviewEvidenceIndex(input: {
  verifiedClaims: VerifiedClaim[];
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: Array<{ id: string }>;
  discoveryContexts: Array<{ url: string }>;
}): EvidenceClassificationIndex {
  return buildEvidenceClassificationIndex(input);
}

export function classifyEvidenceId(
  evidenceId: string,
  index: EvidenceClassificationIndex,
): EvidenceClassification {
  return index.byId.get(evidenceId) ?? "unknown";
}

export function isVerifiedEvidenceId(
  evidenceId: string,
  index: EvidenceClassificationIndex,
): boolean {
  const classification = classifyEvidenceId(evidenceId, index);
  return classification === "verified_claim" || classification === "verified_source";
}

export function buildAllowedEvidenceIds(
  index: EvidenceClassificationIndex,
): Set<string> {
  return new Set<string>([
    ...index.verifiedClaimIds,
    ...index.verifiedSourceIds,
  ]);
}

export function describeEvidenceClassification(
  evidenceId: string,
  index: EvidenceClassificationIndex,
): EvidenceClassificationDiagnostics {
  const effectiveClassification = classifyEvidenceId(evidenceId, index);

  return {
    evidenceId,
    effectiveClassification,
    isVerifiedClaim: effectiveClassification === "verified_claim",
    isVerifiedSource: effectiveClassification === "verified_source",
    isDiscoveryOnly: effectiveClassification === "discovery_only",
    isInternalHcx: effectiveClassification === "internal_hcx",
  };
}

export function validateFindingEvidenceClassifications(input: {
  findings: Array<{
    findingId: string;
    status: string;
    evidenceSourceIds: string[];
  }>;
  index: EvidenceClassificationIndex;
}): string[] {
  const errors: string[] = [];

  for (const finding of input.findings) {
    if (finding.status !== "supported") {
      continue;
    }

    if (finding.evidenceSourceIds.length === 0) {
      errors.push(`supported_finding_missing_evidence:${finding.findingId}`);
    }

    for (const evidenceId of finding.evidenceSourceIds) {
      const classification = classifyEvidenceId(evidenceId, input.index);

      if (classification === "verified_claim" || classification === "verified_source") {
        continue;
      }

      if (classification === "discovery_only") {
        errors.push(
          `discovery_promoted_to_verified:${finding.findingId}:${evidenceId}`,
        );
        continue;
      }

      if (classification === "internal_hcx") {
        errors.push(
          `internal_hcx_as_factual_evidence:${finding.findingId}:${evidenceId}`,
        );
        continue;
      }

      errors.push(`unknown_evidence_source_id:${evidenceId}`);
    }
  }

  return errors;
}

export function collectRejectedEvidenceDiagnostics(input: {
  errors: string[];
  index: EvidenceClassificationIndex;
}): EvidenceClassificationDiagnostics[] {
  const evidenceIds = new Set<string>();

  for (const error of input.errors) {
    const parts = error.split(":");
    const candidate = parts.at(-1)?.trim();
    if (candidate) {
      evidenceIds.add(candidate);
    }
  }

  return [...evidenceIds].map((evidenceId) =>
    describeEvidenceClassification(evidenceId, input.index),
  );
}

export function validateSolReviewOutput(input: {
  review: SolReviewOutput | null;
  contentType: SolReviewOutput["contentType"];
  evidenceIndex: EvidenceClassificationIndex;
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

  errors.push(
    ...validateFindingEvidenceClassifications({
      findings: input.review.findings,
      index: input.evidenceIndex,
    }),
  );

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

/** @deprecated Use validateSolReviewOutput with evidenceIndex. */
export function validateDiscoveryNotPromotedToVerified(input: {
  review: SolReviewOutput;
  verifiedClaimIds: Set<string>;
}): string[] {
  const index = buildEvidenceClassificationIndex({
    verifiedClaims: [...input.verifiedClaimIds].map((id) => ({
      id,
      type: "general",
      statement: "",
      sources: [],
      confidence: "high",
    })),
    authoritativeSources: [],
    approvedInternalContent: [],
    discoveryContexts: [],
  });

  return validateFindingEvidenceClassifications({
    findings: input.review.findings,
    index,
  }).filter((error) => error.startsWith("discovery_promoted_to_verified:"));
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
