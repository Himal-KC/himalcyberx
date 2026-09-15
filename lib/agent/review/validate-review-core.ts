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
  findingIds: Set<string>;
}

export interface EvidenceClassificationDiagnostics {
  evidenceId: string;
  effectiveClassification: EvidenceClassification;
  isVerifiedClaim: boolean;
  isVerifiedSource: boolean;
  isDiscoveryOnly: boolean;
  isInternalHcx: boolean;
}

export interface ReviewFindingContractDiagnostic {
  findingId: string;
  findingStatus: string;
  reason: string;
  evidenceIds: string[];
}

export interface ReviewValidationDiagnostics {
  findingContractIssues: ReviewFindingContractDiagnostic[];
  evidenceClassificationDiagnostics: EvidenceClassificationDiagnostics[];
}

export interface ReviewValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedReview: SolReviewOutput | null;
}

const STATUSES_REQUIRING_VERIFIED_EVIDENCE = new Set([
  "supported",
  "partially_supported",
]);

const FINDING_ID_PATTERN = /^F-\d+$/i;

export function buildEvidenceClassificationIndex(input: {
  verifiedClaims: VerifiedClaim[];
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: Array<{ id: string }>;
  discoveryContexts: Array<{ url: string }>;
  findingIds?: string[];
}): EvidenceClassificationIndex {
  const byId = new Map<string, EvidenceClassification>();
  const verifiedClaimIds = new Set<string>();
  const verifiedSourceIds = new Set<string>();
  const discoveryOnlyIds = new Set<string>();
  const internalHcxIds = new Set<string>();
  const catalog: EvidenceCatalogEntry[] = [];
  const findingIds = new Set<string>(input.findingIds ?? []);

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
    const normalizedUrl = source.url.trim().toLowerCase();
    const aliases = [source.id, `source:${source.id}`, `url:${normalizedUrl}`];

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
    findingIds,
  };
}

export function buildReviewEvidenceIndex(input: {
  verifiedClaims: VerifiedClaim[];
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: Array<{ id: string }>;
  discoveryContexts: Array<{ url: string }>;
  findingIds?: string[];
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

export function listAllowedEvidenceCatalogIds(
  index: EvidenceClassificationIndex,
): string[] {
  return [...buildAllowedEvidenceIds(index)].sort();
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

export function normalizeEvidenceSourceId(
  rawId: string,
  index: EvidenceClassificationIndex,
): string | null {
  const trimmed = rawId.trim();
  if (!trimmed) {
    return null;
  }

  if (index.byId.has(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("url:")) {
    const normalized = `url:${trimmed.slice(4).trim().toLowerCase()}`;
    return index.byId.has(normalized) ? normalized : null;
  }

  if (trimmed.startsWith("source:")) {
    const normalized = `source:${trimmed.slice(7).trim()}`;
    return index.byId.has(normalized) ? normalized : null;
  }

  if (index.byId.has(`source:${trimmed}`)) {
    return `source:${trimmed}`;
  }

  return null;
}

export function normalizeEvidenceSourceIds(
  evidenceSourceIds: string[],
  index: EvidenceClassificationIndex,
): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawId of evidenceSourceIds) {
    const resolved = normalizeEvidenceSourceId(rawId, index) ?? rawId.trim();
    if (!resolved || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    normalized.push(resolved);
  }

  return normalized;
}

export function sanitizeSolReviewEvidenceReferences(
  review: SolReviewOutput,
  index: EvidenceClassificationIndex,
): SolReviewOutput {
  return {
    ...review,
    findings: review.findings.map((finding) => ({
      ...finding,
      evidenceSourceIds: normalizeEvidenceSourceIds(
        finding.evidenceSourceIds,
        index,
      ),
    })),
  };
}

function isFindingIdentifierUsedAsEvidence(
  evidenceId: string,
  findingId: string,
  index: EvidenceClassificationIndex,
): boolean {
  if (isVerifiedEvidenceId(evidenceId, index)) {
    return false;
  }

  if (evidenceId === findingId) {
    return true;
  }

  if (index.findingIds.has(evidenceId)) {
    return true;
  }

  return FINDING_ID_PATTERN.test(evidenceId) && !isVerifiedEvidenceId(evidenceId, index);
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
    const normalizedIds = normalizeEvidenceSourceIds(
      finding.evidenceSourceIds,
      input.index,
    );

    for (const evidenceId of normalizedIds) {
      if (isFindingIdentifierUsedAsEvidence(evidenceId, finding.findingId, input.index)) {
        errors.push(
          `finding_id_used_as_evidence:${finding.findingId}:${evidenceId}`,
        );
      }
    }

    const verifiedIds = normalizedIds.filter((id) =>
      isVerifiedEvidenceId(id, input.index),
    );

    const requiresVerifiedEvidence = STATUSES_REQUIRING_VERIFIED_EVIDENCE.has(
      finding.status,
    );
    const shouldAuditEvidenceRefs =
      requiresVerifiedEvidence ||
      (finding.status === "conflicting" && normalizedIds.length > 0);

    if (shouldAuditEvidenceRefs) {
      for (const evidenceId of normalizedIds) {
        const classification = classifyEvidenceId(evidenceId, input.index);

        if (
          classification === "verified_claim" ||
          classification === "verified_source"
        ) {
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

        if (
          !isFindingIdentifierUsedAsEvidence(
            evidenceId,
            finding.findingId,
            input.index,
          )
        ) {
          errors.push(`unknown_evidence_source_id:${evidenceId}`);
        }
      }
    }

    if (requiresVerifiedEvidence && verifiedIds.length === 0) {
      errors.push(
        finding.status === "partially_supported"
          ? `partially_supported_finding_missing_evidence:${finding.findingId}`
          : `supported_finding_missing_evidence:${finding.findingId}`,
      );
    }
  }

  return errors;
}

export function collectValidationDiagnostics(input: {
  errors: string[];
  index: EvidenceClassificationIndex;
  review: SolReviewOutput | null;
}): ReviewValidationDiagnostics {
  const findingContractIssues: ReviewFindingContractDiagnostic[] = [];
  const evidenceIds = new Set<string>();

  for (const error of input.errors) {
    const [code, findingId, evidenceId] = error.split(":");

    if (
      code === "supported_finding_missing_evidence" ||
      code === "partially_supported_finding_missing_evidence"
    ) {
      const finding = input.review?.findings.find(
        (item) => item.findingId === findingId,
      );
      findingContractIssues.push({
        findingId: findingId ?? "unknown",
        findingStatus: finding?.status ?? "unknown",
        reason: code,
        evidenceIds: finding?.evidenceSourceIds ?? [],
      });
      continue;
    }

    if (code === "finding_id_used_as_evidence" && evidenceId) {
      findingContractIssues.push({
        findingId: findingId ?? "unknown",
        findingStatus:
          input.review?.findings.find((item) => item.findingId === findingId)
            ?.status ?? "unknown",
        reason: code,
        evidenceIds: [evidenceId],
      });
      continue;
    }

    if (
      code === "unknown_evidence_source_id" ||
      code === "discovery_promoted_to_verified" ||
      code === "internal_hcx_as_factual_evidence"
    ) {
      const id = evidenceId ?? findingId;
      if (id && !FINDING_ID_PATTERN.test(id) && !input.index.findingIds.has(id)) {
        evidenceIds.add(id);
      } else if (evidenceId) {
        evidenceIds.add(evidenceId);
      }
    }
  }

  return {
    findingContractIssues,
    evidenceClassificationDiagnostics: [...evidenceIds].map((evidenceId) =>
      describeEvidenceClassification(evidenceId, input.index),
    ),
  };
}

/** @deprecated Use collectValidationDiagnostics. */
export function collectRejectedEvidenceDiagnostics(input: {
  errors: string[];
  index: EvidenceClassificationIndex;
}): EvidenceClassificationDiagnostics[] {
  return collectValidationDiagnostics({
    errors: input.errors,
    index: input.index,
    review: null,
  }).evidenceClassificationDiagnostics;
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

  const index: EvidenceClassificationIndex = {
    ...input.evidenceIndex,
    findingIds: new Set([
      ...input.evidenceIndex.findingIds,
      ...input.review.findings.map((finding) => finding.findingId),
    ]),
  };

  if (input.review.contentType !== input.contentType) {
    errors.push("review_content_type_mismatch");
  }

  const sanitizedReview = sanitizeSolReviewEvidenceReferences(
    input.review,
    index,
  );

  errors.push(
    ...validateFindingEvidenceClassifications({
      findings: sanitizedReview.findings,
      index,
    }),
  );

  for (const url of extractUrlsFromReview(sanitizedReview)) {
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
    sanitizedReview,
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
    findingIds: input.review.findings.map((finding) => finding.findingId),
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
