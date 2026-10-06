import {
  catalogMatchesProductPhrase,
  findVerifiedAliasMentionsInText,
  type VerifiedProductCatalog,
} from "./product-catalog-core.ts";
import {
  isAffectedProductSupported,
  normalizeAffectedProductSegment,
  splitAffectedProductSegments,
  stripAffectedProductExtractionLeadIn,
} from "./product-grounding-core.ts";

/** High-confidence affected-product relation shapes (no generic impacts/affects). */
export const RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN =
  /\baffected products?\s+(?:include|is|are|as)\s+([^.;]+)/i;
export const RELATION_AFFECTED_VERSIONS_OF_PATTERN =
  /\baffected versions?\s+of\s+([^.;]+)/i;
export const RELATION_CVE_AFFECTS_PATTERN =
  /\bCVE-\d{4}-\d+\s+affects\s+([^.;]+)/i;
export const RELATION_IS_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+is(?:\s+also)?\s+affected\b/i;
export const RELATION_ARE_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+are(?:\s+also)?\s+affected\b/i;
export const RELATION_AFFECTED_PRODUCT_BARE_PATTERN = /\baffected products?\b/i;

const VERIFIED_ASSERTION_CONTEXT_PATTERNS: RegExp[] = [
  RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN,
  RELATION_AFFECTED_VERSIONS_OF_PATTERN,
  RELATION_CVE_AFFECTS_PATTERN,
  RELATION_IS_AFFECTED_PATTERN,
  RELATION_ARE_AFFECTED_PATTERN,
  RELATION_AFFECTED_PRODUCT_BARE_PATTERN,
  /\bproducts?\s+identified\s+as\b/i,
  /\bplatforms?\s+such\s+as\b/i,
  /\bsystems?\s+such\s+as\b/i,
  /\bvulnerable in\b/i,
];

const META_PRODUCT_HEAD_PATTERN =
  /^(?:ranges?|versions?(?:\s+(?:range|ranges|information|details))?|guidance|information|details?|entries|lists?|families|categories?|remediation|mitigation|patching)(?:\s|$)/i;

const META_PRODUCT_PHRASE_PATTERN =
  /^(?:ranges?|versions?)\s+(?:are|is|were|range|from|through|to|include|below|above|described|documented|available|provided|listed|noted|summarized|outlined|discussed|covered|detailed|explained|shown|included|defined|identified|updated|published|released|supplied|presented|reported|summarised)\b/i;

const PREPOSITION_LED_SPAN_PATTERN =
  /^(?:across|through|for|from|on|in|at|by|with|without|into|onto|upon|about|around|over|under|between|among|during|after|before|within|outside|against|via|per|all|many|most|some|other|various|multiple|numerous|several|different|same|these|those|each|every|any|both|either|neither|internet-facing|internet)\b/i;

const CIA_TRIAD_ONLY_PATTERN =
  /^(?:confidentiality|integrity|availability)(?:\s*(?:,|\band\b)\s*(?:confidentiality|integrity|availability))*$/i;

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
    | "ambiguous_skipped";
}

export function sentenceHasAffectedProductRelation(sentence: string): boolean {
  if (RELATION_AFFECTED_PRODUCT_BARE_PATTERN.test(sentence)) {
    return true;
  }

  if (collectHighConfidenceEntityClauses(sentence).length > 0) {
    return true;
  }

  const catalogEmptyMention = /\baffected products?\b/i.test(sentence);
  if (catalogEmptyMention) {
    return true;
  }

  return verifiedAssertionContextPresent(sentence);
}

export function verifiedAssertionContextPresent(sentence: string): boolean {
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

export function isPrepositionLedProductSpan(normalized: string): boolean {
  return PREPOSITION_LED_SPAN_PATTERN.test(normalized.trim());
}

export function isAbstractImpactSpan(normalized: string): boolean {
  const value = normalized.trim();
  if (!value) {
    return true;
  }

  if (CIA_TRIAD_ONLY_PATTERN.test(value)) {
    return true;
  }

  if (/^(?:confidentiality|integrity|availability)\b/.test(value)) {
    return true;
  }

  return false;
}

export function isHighConfidenceProductEntity(
  rawSegment: string,
  normalizedSegment: string,
): boolean {
  if (!normalizedSegment || isMetaProductCapture(normalizedSegment)) {
    return false;
  }

  if (isPrepositionLedProductSpan(normalizedSegment)) {
    return false;
  }

  if (isAbstractImpactSpan(normalizedSegment)) {
    return false;
  }

  const tokens = normalizedSegment.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }

  if (/[A-Z]/.test(rawSegment)) {
    return true;
  }

  if (
    /\b(?:netscaler|exchange|esxi|xenapp|windows|gateway|firewall|vmware|citrix|microsoft|cisco|fortinet|pan-os|ios|android|linux|apache|nginx|openssl|kubernetes|docker)\b/i.test(
      normalizedSegment,
    )
  ) {
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
    /\s+which\b.*/i,
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

export function collectHighConfidenceEntityClauses(sentence: string): string[] {
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

  const isAffectedMatch = sentence.match(RELATION_IS_AFFECTED_PATTERN);
  if (isAffectedMatch?.[1]) {
    clauses.push(isAffectedMatch[1]);
  }

  const areAffectedMatch = sentence.match(RELATION_ARE_AFFECTED_PATTERN);
  if (areAffectedMatch?.[1]) {
    clauses.push(areAffectedMatch[1]);
  }

  return clauses;
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

function verifiedMentionsInProductContext(
  sentence: string,
  catalog: VerifiedProductCatalog,
): string[] {
  if (!verifiedAssertionContextPresent(sentence)) {
    return [];
  }

  return findVerifiedAliasMentionsInText(sentence, catalog);
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

export function extractAffectedProductDraftFacts(input: {
  sentence: string;
  primaryCve?: string;
  catalog: VerifiedProductCatalog;
}): { facts: ProductDraftFact[]; diagnostics: AffectedProductExtractionDiagnostic[] } {
  const facts: ProductDraftFact[] = [];
  const diagnostics: AffectedProductExtractionDiagnostic[] = [];

  const hasRelation =
    RELATION_AFFECTED_PRODUCT_BARE_PATTERN.test(input.sentence) ||
    collectHighConfidenceEntityClauses(input.sentence).length > 0 ||
    (verifiedAssertionContextPresent(input.sentence) &&
      findVerifiedAliasMentionsInText(input.sentence, input.catalog).length > 0);

  if (!input.primaryCve || !hasRelation) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: input.primaryCve ?? null,
      resolution: "no_relation",
    });
    return { facts, diagnostics };
  }

  const verifiedInContext = verifiedMentionsInProductContext(
    input.sentence,
    input.catalog,
  );

  const relationClauses = collectHighConfidenceEntityClauses(input.sentence);

  if (relationClauses.length === 0) {
    const bare = handleBareAffectedProductMeta(
      input.sentence,
      input.primaryCve,
      input.catalog,
      diagnostics,
    );
    if (bare.handled) {
      return { facts: bare.facts, diagnostics };
    }

    if (verifiedInContext.length > 0) {
      diagnostics.push({
        sentence: input.sentence,
        relationClause: null,
        rawCandidate: verifiedInContext[0] ?? null,
        normalizedCandidate: verifiedInContext[0] ?? null,
        associatedCve: input.primaryCve,
        resolution: "supported",
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

  for (const clause of relationClauses) {
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

      if (!isHighConfidenceProductEntity(rawCandidate, normalizedCandidate)) {
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

  if (facts.length === 0 && verifiedInContext.length > 0) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: relationClauses[0] ?? null,
      rawCandidate: verifiedInContext[0] ?? null,
      normalizedCandidate: verifiedInContext[0] ?? null,
      associatedCve: input.primaryCve,
      resolution: "supported",
    });
  }

  return { facts, diagnostics };
}

/** Deterministic replay helper for production-like failures. */
export function traceAffectedProductExtraction(input: {
  sentence: string;
  primaryCve: string;
  catalog: VerifiedProductCatalog;
}): {
  legacyGenericAffectsMatch: RegExpMatchArray | null;
  extraction: ReturnType<typeof extractAffectedProductDraftFacts>;
} {
  const legacyGenericAffectsMatch = input.sentence.match(
    /\b(?:affects?|impacts?|vulnerable in)\s+([^.;]+)/i,
  );

  return {
    legacyGenericAffectsMatch,
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
