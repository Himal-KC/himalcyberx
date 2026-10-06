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

const RELATION_AFFECTS_PATTERN =
  /\b(?:affects?|impacts?|vulnerable in)\s+([^.;]+)/i;
const RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN =
  /\baffected products?\s+(?:include|is|are|as)\s+([^.;]+)/i;
const RELATION_AFFECTED_VERSIONS_OF_PATTERN =
  /\baffected versions?\s+of\s+([^.;]+)/i;
const RELATION_IS_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+is(?:\s+also)?\s+affected\b/i;
const RELATION_ARE_AFFECTED_PATTERN =
  /\b([^.;]+?)\s+are(?:\s+also)?\s+affected\b/i;
const RELATION_AFFECTED_PRODUCT_BARE_PATTERN = /\baffected products?\b/i;

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
  resolution: "supported" | "unsupported" | "meta_skipped" | "no_relation";
}

export function sentenceHasAffectedProductRelation(sentence: string): boolean {
  return (
    RELATION_AFFECTED_PRODUCT_BARE_PATTERN.test(sentence) ||
    RELATION_AFFECTS_PATTERN.test(sentence) ||
    RELATION_AFFECTED_VERSIONS_OF_PATTERN.test(sentence) ||
    RELATION_IS_AFFECTED_PATTERN.test(sentence) ||
    RELATION_ARE_AFFECTED_PATTERN.test(sentence)
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

function looksLikeExplicitProductEntity(normalized: string): boolean {
  if (!normalized || isMetaProductCapture(normalized)) {
    return false;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  if (tokens.length === 1) {
    return false;
  }

  return /[a-z]/i.test(normalized);
}

function trimNonProductRelationTail(clause: string): string {
  return clause
    .replace(
      /\s+(?:are|is|were)\s+(?!affected\b)(?:listed|documented|noted|described|identified|available|provided|published|updated|summarized|outlined|shown|included|defined).*/i,
      "",
    )
    .trim();
}

function collectRelationEntityClauses(sentence: string): string[] {
  const clauses: string[] = [];

  const affectsMatch = sentence.match(RELATION_AFFECTS_PATTERN);
  if (affectsMatch?.[1]) {
    clauses.push(affectsMatch[1]);
  }

  const explicitMatch = sentence.match(RELATION_AFFECTED_PRODUCT_EXPLICIT_PATTERN);
  if (explicitMatch?.[1]) {
    clauses.push(explicitMatch[1]);
  }

  const versionsOfMatch = sentence.match(RELATION_AFFECTED_VERSIONS_OF_PATTERN);
  if (versionsOfMatch?.[1]) {
    clauses.push(trimNonProductRelationTail(versionsOfMatch[1]));
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

export function extractAffectedProductDraftFacts(input: {
  sentence: string;
  primaryCve?: string;
  catalog: VerifiedProductCatalog;
}): { facts: ProductDraftFact[]; diagnostics: AffectedProductExtractionDiagnostic[] } {
  const facts: ProductDraftFact[] = [];
  const diagnostics: AffectedProductExtractionDiagnostic[] = [];

  if (!input.primaryCve || !sentenceHasAffectedProductRelation(input.sentence)) {
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

  const relationClauses = collectRelationEntityClauses(input.sentence);
  const verifiedMentions = findVerifiedAliasMentionsInText(
    input.sentence,
    input.catalog,
  );

  if (relationClauses.length === 0) {
    const bareMatch = input.sentence.match(
      /\baffected products?(?:\s+(?:include|is|are|as))?\s+([^.;]+)/i,
    );
    const bareCapture = bareMatch?.[1] ?? null;

    if (bareCapture && isMetaProductCapture(bareCapture)) {
      diagnostics.push({
        sentence: input.sentence,
        relationClause: bareMatch?.[0] ?? null,
        rawCandidate: bareCapture,
        normalizedCandidate: normalizeEntitySegment(bareCapture),
        associatedCve: input.primaryCve,
        resolution: "meta_skipped",
      });
      return { facts, diagnostics };
    }

    if (verifiedMentions.length > 0) {
      diagnostics.push({
        sentence: input.sentence,
        relationClause: RELATION_AFFECTED_PRODUCT_BARE_PATTERN.exec(input.sentence)?.[0] ?? null,
        rawCandidate: verifiedMentions[0] ?? null,
        normalizedCandidate: verifiedMentions[0] ?? null,
        associatedCve: input.primaryCve,
        resolution: "supported",
      });
      return { facts, diagnostics };
    }
  }

  for (const clause of relationClauses) {
    for (const segment of splitAffectedProductSegments(clause)) {
      const rawCandidate = segment.trim();
      if (!rawCandidate) {
        continue;
      }

      const normalizedCandidate = normalizeEntitySegment(rawCandidate);

      if (isMetaProductCapture(rawCandidate) || isMetaProductCapture(normalizedCandidate)) {
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

      if (!looksLikeExplicitProductEntity(normalizedCandidate)) {
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

  if (facts.length === 0 && diagnostics.length === 0) {
    diagnostics.push({
      sentence: input.sentence,
      relationClause: relationClauses[0] ?? null,
      rawCandidate: null,
      normalizedCandidate: null,
      associatedCve: input.primaryCve,
      resolution: verifiedMentions.length > 0 ? "supported" : "meta_skipped",
    });
  }

  return { facts, diagnostics };
}

export function formatAffectedProductDiagnosticSummary(
  diagnostic: AffectedProductExtractionDiagnostic,
): string {
  return [
    `resolution=${diagnostic.resolution}`,
    diagnostic.relationClause ? `clause="${diagnostic.relationClause.slice(0, 80)}"` : "clause=null",
    diagnostic.rawCandidate ? `raw="${diagnostic.rawCandidate.slice(0, 80)}"` : "raw=null",
    diagnostic.normalizedCandidate
      ? `normalized="${diagnostic.normalizedCandidate.slice(0, 80)}"`
      : "normalized=null",
    diagnostic.associatedCve ? `cve=${diagnostic.associatedCve}` : "cve=null",
  ].join("; ");
}
