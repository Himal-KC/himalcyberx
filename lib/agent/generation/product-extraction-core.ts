import {
  catalogMatchesProductPhrase,
  findVerifiedAliasMentionsInText,
  type VerifiedProductCatalog,
} from "./product-catalog-core.ts";
import {
  isAffectedProductSupported,
  normalizeAffectedProductSegment,
  normalizeProduct,
  splitAffectedProductSegments,
  stripAffectedProductExtractionLeadIn,
} from "./product-grounding-core.ts";

/** Forward explicit affected-product grammar (bounded unsupported detection). */
export const RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN =
  /\baffected products?\s*(?::|\s+(?:include|is|are|as)\s+)([^.;]+)/i;
export const RELATION_AFFECTED_VERSIONS_OF_PATTERN =
  /\baffected versions?\s+of\s+([^.;]+)/i;
export const RELATION_CVE_AFFECTS_PATTERN =
  /\bCVE-\d{4}-\d+\s+affects\s+([^.;]+)/i;
export const RELATION_AFFECTED_PRODUCT_BARE_PATTERN = /\baffected products?\b/i;

/** Detection-only (no open capture): reverse affected wording. */
export const REVERSE_IS_AFFECTED_DETECTOR =
  /\b(?:is|are)(?:\s+also)?\s+affected\b/i;
export const LEGACY_REVERSE_ARE_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+are(?:\s+also)?\s+affected\b/i;
export const LEGACY_REVERSE_IS_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+is(?:\s+also)?\s+affected\b/i;

const VERIFIED_ASSERTION_CONTEXT_PATTERNS: RegExp[] = [
  RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN,
  RELATION_AFFECTED_VERSIONS_OF_PATTERN,
  RELATION_CVE_AFFECTS_PATTERN,
  RELATION_AFFECTED_PRODUCT_BARE_PATTERN,
  /\bproducts?\s+identified\s+as\b/i,
  /\bplatforms?\s+such\s+as\b/i,
  /\bsystems?\s+such\s+as\b/i,
];

const AFFECTED_SCOPE_WH_CLAUSE_PATTERN =
  /\bwhich\s+(?:versions?|releases?|products?|configurations?|platforms?|deployments?)\s+are(?:\s+also)?\s+affected\b/i;

const AFFECTED_SCOPE_UNCERTAINTY_PATTERN =
  /\b(?:does not|do not|cannot|can't|did not|unable to|not|remains unknown|it is unclear|unclear|insufficient)\b[^.;]{0,120}\b(?:which|whether)\b[^.;]{0,80}\b(?:versions?|releases?|products?|platforms?|configurations?|deployments?)\b[^.;]{0,40}\b(?:are|is)\s+affected\b/i;

const META_PRODUCT_HEAD_PATTERN =
  /^(?:ranges?|versions?(?:\s+(?:range|ranges|information|details))?|guidance|information|details?|entries|lists?|families|categories?|remediation|mitigation|patching)(?:\s|$)/i;

const META_PRODUCT_PHRASE_PATTERN =
  /^(?:ranges?|versions?)\s+(?:are|is|were|range|from|through|to|include|below|above|described|documented|available|provided|listed|noted|summarized|outlined|discussed|covered|detailed|explained|shown|included|defined|identified|updated|published|released|supplied|presented|reported|summarised)\b/i;

export interface ProductDraftFact {
  type: "affected_product";
  cveId?: string;
  value: string;
  raw: string;
}

export interface AffectedProductExtractionDiagnostic {
  sentence: string;
  relationClause: string | null;
  rawCandidate: string | null;
  normalizedCandidate: string | null;
  associatedCve: string | null;
  resolution:
    | "supported"
    | "unsupported"
    | "meta_skipped"
    | "no_relation"
    | "ambiguous_skipped"
    | "scope_uncertainty_skipped";
}

export function isAffectedScopeUncertaintySentence(sentence: string): boolean {
  if (AFFECTED_SCOPE_WH_CLAUSE_PATTERN.test(sentence)) {
    return true;
  }

  if (AFFECTED_SCOPE_UNCERTAINTY_PATTERN.test(sentence)) {
    return true;
  }

  return false;
}

export function sentenceHasAffectedProductRelation(sentence: string): boolean {
  if (isAffectedScopeUncertaintySentence(sentence)) {
    return true;
  }

  if (RELATION_AFFECTED_PRODUCT_BARE_PATTERN.test(sentence)) {
    return true;
  }

  if (collectForwardEntityClauses(sentence).length > 0) {
    return true;
  }

  if (REVERSE_IS_AFFECTED_DETECTOR.test(sentence)) {
    return true;
  }

  return VERIFIED_ASSERTION_CONTEXT_PATTERNS.some((pattern) =>
    pattern.test(sentence),
  );
}

export function isMetaProductCapture(capture: string): boolean {
  const normalized = normalizeAffectedProductSegment(capture).trim();
  if (!normalized) {
    return true;
  }

  if (META_PRODUCT_HEAD_PATTERN.test(normalized)) {
    return true;
  }

  if (META_PRODUCT_PHRASE_PATTERN.test(normalized)) {
    return true;
  }

  return false;
}

function trimNonProductRelationTail(clause: string): string {
  return clause
    .replace(
      /\s+(?:are|is|were)\s+(?!affected\b)(?:listed|documented|noted|described|identified|available|provided|published|updated|summarized|outlined|shown|included|defined).*/i,
      "",
    )
    .trim();
}

function trimRelationClauseToProductHead(clause: string): string {
  let trimmed = trimNonProductRelationTail(clause);

  const truncatePatterns = [
    /\s+that\b.*/i,
    /\s+where\b.*/i,
    /\s+when\b.*/i,
    /\s+with\b.*/i,
    /\s+(?:deployments|appliances|systems|instances|devices|platforms|environments)\b.*/i,
  ];

  for (const pattern of truncatePatterns) {
    trimmed = trimmed.replace(pattern, "").trim();
  }

  return trimmed;
}

export function collectForwardEntityClauses(sentence: string): string[] {
  const clauses: string[] = [];

  const explicitMatch = sentence.match(RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN);
  if (explicitMatch?.[1]) {
    clauses.push(explicitMatch[1]);
  }

  const versionsOfMatch = sentence.match(RELATION_AFFECTED_VERSIONS_OF_PATTERN);
  if (versionsOfMatch?.[1]) {
    clauses.push(trimNonProductRelationTail(versionsOfMatch[1]));
  }

  const cveAffectsMatch = sentence.match(RELATION_CVE_AFFECTS_PATTERN);
  if (cveAffectsMatch?.[1]) {
    clauses.push(cveAffectsMatch[1]);
  }

  return clauses;
}

/** @deprecated Use collectForwardEntityClauses — reverse open capture removed. */
export function collectHighConfidenceEntityClauses(sentence: string): string[] {
  return collectForwardEntityClauses(sentence);
}

function normalizeEntitySegment(segment: string): string {
  return normalizeAffectedProductSegment(
    stripAffectedProductExtractionLeadIn(segment),
  );
}

function isVerifiedProductSegment(
  segment: string,
  catalog: VerifiedProductCatalog,
): boolean {
  if (catalog.allAliases.size === 0) {
    return false;
  }

  return isAffectedProductSupported(segment, catalog.allAliases);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildReverseAffectedPatternForAlias(alias: string): RegExp {
  const escaped = escapeRegExp(normalizeProduct(alias));
  return new RegExp(
    `\\b(${escaped}(?:\\s+(?:deployments|appliances|systems|instances|devices|platforms|environments))?)\\s+(?:is|are)(?:\\s+also)?\\s+affected\\b`,
    "i",
  );
}

export function findVerifiedReverseAffectedMentions(
  sentence: string,
  catalog: VerifiedProductCatalog,
): string[] {
  if (!REVERSE_IS_AFFECTED_DETECTOR.test(sentence)) {
    return [];
  }

  if (isAffectedScopeUncertaintySentence(sentence)) {
    return [];
  }

  const aliases = [...catalog.allAliases].sort(
    (left, right) => right.length - left.length,
  );
  const matches: string[] = [];

  for (const alias of aliases) {
    const pattern = buildReverseAffectedPatternForAlias(alias);
    const match = sentence.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const span = trimRelationClauseToProductHead(match[1]);
    if (isVerifiedProductSegment(span, catalog)) {
      matches.push(alias);
    }
  }

  return matches;
}

function handleBareAffectedProductMeta(
  sentence: string,
  primaryCve: string,
  catalog: VerifiedProductCatalog,
  diagnostics: AffectedProductExtractionDiagnostic[],
): { facts: ProductDraftFact[]; handled: boolean } {
  const bareMatch = sentence.match(
    /\baffected products?(?:\s+(?:include|is|are|as))?\s+([^.;]+)/i,
  );
  const bareCapture = bareMatch?.[1] ?? null;

  if (!bareCapture) {
    return { facts: [], handled: false };
  }

  if (isMetaProductCapture(bareCapture)) {
    diagnostics.push({
      sentence,
      relationClause: bareMatch?.[0] ?? null,
      rawCandidate: bareCapture,
      normalizedCandidate: normalizeEntitySegment(bareCapture),
      associatedCve: primaryCve,
      resolution: "meta_skipped",
    });
    return { facts: [], handled: true };
  }

  const verifiedMentions = findVerifiedAliasMentionsInText(sentence, catalog);
  if (verifiedMentions.length > 0) {
    diagnostics.push({
      sentence,
      relationClause: bareMatch?.[0] ?? null,
      rawCandidate: verifiedMentions[0] ?? null,
      normalizedCandidate: verifiedMentions[0] ?? null,
      associatedCve: primaryCve,
      resolution: "supported",
    });
    return { facts: [], handled: true };
  }

  return { facts: [], handled: false };
}

const REVERSE_SUBJECT_DISQUALIFIERS =
  /\b(?:does not|do not|did not|cannot|can't|whether|which|unclear|unknown|insufficient|evidence|research|advisory|sources|documentation|available here)\b/i;

function extractBoundedReverseProductSubject(sentence: string): string | null {
  if (isAffectedScopeUncertaintySentence(sentence)) {
    return null;
  }

  const match = sentence.match(
    /\b([A-Z][^.]{0,100}?)\s+(?:is|are)(?:\s+also)?\s+affected\b/,
  );
  if (!match?.[1]) {
    return null;
  }

  const subject = match[1].trim();
  if (REVERSE_SUBJECT_DISQUALIFIERS.test(subject)) {
    return null;
  }

  return subject;
}

function isForwardHighConfidenceUnsupportedEntity(
  rawSegment: string,
  normalizedSegment: string,
): boolean {
  if (!normalizedSegment || isMetaProductCapture(normalizedSegment)) {
    return false;
  }

  const tokens = normalizedSegment.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }

  if (/[A-Z]/.test(rawSegment)) {
    return true;
  }

  return /\b(?:netscaler|exchange|esxi|xenapp|windows|gateway|firewall|vmware|citrix|microsoft|cisco|fortinet)\b/i.test(
    normalizedSegment,
  );
}

export function extractAffectedProductDraftFacts(input: {
  sentence: string;
  primaryCve?: string;
  catalog: VerifiedProductCatalog;
}): { facts: ProductDraftFact[]; diagnostics: AffectedProductExtractionDiagnostic[] } {
  const facts: ProductDraftFact[] = [];
  const diagnostics: AffectedProductExtractionDiagnostic[] = [];

  if (!input.primaryCve) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: null,
      resolution: "no_relation",
    });
    return { facts, diagnostics };
  }

  if (isAffectedScopeUncertaintySentence(input.sentence)) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: input.primaryCve,
      resolution: "scope_uncertainty_skipped",
    });
    return { facts, diagnostics };
  }

  const verifiedReverse = findVerifiedReverseAffectedMentions(
    input.sentence,
    input.catalog,
  );
  const forwardClauses = collectForwardEntityClauses(input.sentence);
  const hasRelation = sentenceHasAffectedProductRelation(input.sentence);

  if (!hasRelation) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: input.primaryCve,
      resolution: "no_relation",
    });
    return { facts, diagnostics };
  }

  const boundedReverseSubject = extractBoundedReverseProductSubject(
    input.sentence,
  );
  if (
    boundedReverseSubject &&
    forwardClauses.length === 0 &&
    verifiedReverse.length === 0
  ) {
    const normalizedSubject = normalizeEntitySegment(boundedReverseSubject);
    const normalizedLower = normalizeProduct(boundedReverseSubject);
    const isUnsupportedGatewaySpecificity =
      /\bnetscaler\b/.test(normalizedLower) &&
      /\bgateway\b/.test(normalizedLower) &&
      !isVerifiedProductSegment(boundedReverseSubject, input.catalog);

    if (isUnsupportedGatewaySpecificity) {
      facts.push({
        type: "affected_product",
        cveId: input.primaryCve,
        value: boundedReverseSubject,
        raw: boundedReverseSubject,
      });
      diagnostics.push({
        sentence: input.sentence,
        relationClause: "bounded-reverse-affected",
        rawCandidate: boundedReverseSubject,
        normalizedCandidate: normalizedSubject,
        associatedCve: input.primaryCve,
        resolution: "unsupported",
      });
      return { facts, diagnostics };
    }
  }

  if (verifiedReverse.length > 0 && forwardClauses.length === 0) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: "verified-reverse-affected",
      rawCandidate: verifiedReverse[0] ?? null,
      normalizedCandidate: verifiedReverse[0] ?? null,
      associatedCve: input.primaryCve,
      resolution: "supported",
    });
    return { facts, diagnostics };
  }

  if (forwardClauses.length === 0) {
    const bare = handleBareAffectedProductMeta(
      input.sentence,
      input.primaryCve,
      input.catalog,
      diagnostics,
    );
    if (bare.handled) {
      return { facts: bare.facts, diagnostics };
    }

    const verifiedMentions = findVerifiedAliasMentionsInText(
      input.sentence,
      input.catalog,
    );
    if (verifiedMentions.length > 0) {
      diagnostics.push({
        sentence: input.sentence,
        relationClause: null,
        rawCandidate: verifiedMentions[0] ?? null,
        normalizedCandidate: verifiedMentions[0] ?? null,
        associatedCve: input.primaryCve,
        resolution: "supported",
      });
      return { facts, diagnostics };
    }

    if (REVERSE_IS_AFFECTED_DETECTOR.test(input.sentence)) {
      diagnostics.push({
        sentence: input.sentence,
        relationClause: null,
        rawCandidate: null,
        normalizedCandidate: null,
        associatedCve: input.primaryCve,
        resolution: "ambiguous_skipped",
      });
      return { facts, diagnostics };
    }

    diagnostics.push({
      sentence: input.sentence,
      relationClause: null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: input.primaryCve,
      resolution: "ambiguous_skipped",
    });
    return { facts, diagnostics };
  }

  for (const clause of forwardClauses) {
    const productClause = trimRelationClauseToProductHead(clause);
    for (const segment of splitAffectedProductSegments(productClause)) {
      const rawCandidate = segment.trim();
      if (!rawCandidate) {
        continue;
      }

      const normalizedCandidate = normalizeEntitySegment(rawCandidate);

      if (
        isMetaProductCapture(rawCandidate) ||
        isMetaProductCapture(normalizedCandidate)
      ) {
        diagnostics.push({
          sentence: input.sentence,
          relationClause: clause,
          rawCandidate,
          normalizedCandidate,
          associatedCve: input.primaryCve,
          resolution: "meta_skipped",
        });
        continue;
      }

      if (
        catalogMatchesProductPhrase(normalizedCandidate, input.catalog) ||
        isVerifiedProductSegment(rawCandidate, input.catalog)
      ) {
        diagnostics.push({
          sentence: input.sentence,
          relationClause: clause,
          rawCandidate,
          normalizedCandidate,
          associatedCve: input.primaryCve,
          resolution: "supported",
        });
        continue;
      }

      if (!isForwardHighConfidenceUnsupportedEntity(rawCandidate, normalizedCandidate)) {
        diagnostics.push({
          sentence: input.sentence,
          relationClause: clause,
          rawCandidate,
          normalizedCandidate,
          associatedCve: input.primaryCve,
          resolution: "ambiguous_skipped",
        });
        continue;
      }

      facts.push({
        type: "affected_product",
        cveId: input.primaryCve,
        value: rawCandidate,
        raw: clause,
      });

      diagnostics.push({
        sentence: input.sentence,
        relationClause: clause,
        rawCandidate,
        normalizedCandidate,
        associatedCve: input.primaryCve,
        resolution: "unsupported",
      });
    }
  }

  if (facts.length === 0 && verifiedReverse.length > 0) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: "verified-reverse-affected",
      rawCandidate: verifiedReverse[0] ?? null,
      normalizedCandidate: verifiedReverse[0] ?? null,
      associatedCve: input.primaryCve,
      resolution: "supported",
    });
  }

  return { facts, diagnostics };
}

export function traceAffectedProductExtraction(input: {
  sentence: string;
  primaryCve: string;
  catalog: VerifiedProductCatalog;
}): {
  legacyReverseAreAffectedMatch: RegExpMatchArray | null;
  legacyReverseIsAffectedMatch: RegExpMatchArray | null;
  scopeUncertainty: boolean;
  extraction: ReturnType<typeof extractAffectedProductDraftFacts>;
} {
  return {
    legacyReverseAreAffectedMatch: input.sentence.match(
      LEGACY_REVERSE_ARE_AFFECTED_PATTERN,
    ),
    legacyReverseIsAffectedMatch: input.sentence.match(
      LEGACY_REVERSE_IS_AFFECTED_PATTERN,
    ),
    scopeUncertainty: isAffectedScopeUncertaintySentence(input.sentence),
    extraction: extractAffectedProductDraftFacts(input),
  };
}

export function formatAffectedProductDiagnosticSummary(
  diagnostic: AffectedProductExtractionDiagnostic,
): string {
  return [
    `resolution=${diagnostic.resolution}`,
    diagnostic.relationClause
      ? `clause="${diagnostic.relationClause.slice(0, 80)}"`
      : "clause=null",
    diagnostic.rawCandidate
      ? `raw="${diagnostic.rawCandidate.slice(0, 80)}"`
      : "raw=null",
    diagnostic.normalizedCandidate
      ? `normalized="${diagnostic.normalizedCandidate.slice(0, 80)}"`
      : "normalized=null",
    diagnostic.associatedCve ? `cve=${diagnostic.associatedCve}` : "cve=null",
  ].join("; ");
}
