import type { VerifiedClaim } from "../types";
import type { AgentContentType } from "../../supabase/types";
import type {
  GeneratedDraft,
  GroundingAuditResult,
  InternalLinkSuggestion,
} from "./types";

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/gi;
const CVSS_VECTOR_PATTERN = /CVSS:3\.\d\/[^\s,.;)]+/i;
const CVSS_SCORE_PATTERN =
  /CVSS(?:\s+v?3\.1)?(?:\s+base)?\s+score\s+(?:of\s+)?(\d+(?:\.\d+)?)/i;
const CVSS_SEVERITY_PATTERN =
  /\b(?:severity|rated)\s+(critical|high|medium|low)\b|\((critical|high|medium|low)\)/i;
const PATCH_PATTERN = /\bKB\d{5,7}\b/gi;
const KEV_LISTING_PATTERN =
  /\b(listed in (the )?cisa (known exploited vulnerabilities|kev)|added to (the )?(cisa )?(known exploited vulnerabilities|kev))\b/i;
const KEV_ADDED_DATE_PATTERN =
  /\badded\b.+\b(?:known exploited vulnerabilities|kev)\b.+\bon\s+(\d{4}-\d{2}-\d{2})\b/i;
const KEV_NEGATION_PATTERN =
  /\b(not|no longer|isn't|aren't|wasn't|weren't)\b[^.]{0,80}\b(kev|known exploited vulnerabilities)\b/i;
const AFFECTED_PRODUCT_PATTERN =
  /\b(?:affects?|impacts?|vulnerable in|affected product(?:s)?(?:\s+(?:include|is|are))?|affected versions?(?:\s+(?:include|are))?)\s+([^.;]+)/i;
const FACTUAL_CLAIM_INDICATORS =
  /\b(?:cvss|(?:cisa )?kev|known exploited vulnerabilities|actively exploited|exploited in(?: the)? wild|base score|severity(?:\s+is|\s+of|\s+rated)?|affects?|impacts?|vulnerable(?:\s+to|\s+in|\s+systems)?|(?:apply|install)\s+(?:patch|update)\s+kb|listed in (?:the )?cisa|added to (?:the )?(?:cisa )?(?:known exploited|kev)|not in (?:the )?(?:cisa )?kev|remediation|mitigation)\b/i;
const INTERNAL_LINK_REFERENCE_INDICATORS =
  /\b(?:see|read|review|refer to|check out|explore|related(?:\s+coverage|\s+content|\s+reading)?|our (?:analysis|article|guide|coverage|write-up|tutorial|lab)|for (?:more|related|additional) (?:context|information|details|background))\b/i;

export interface ApprovedInternalContentInput {
  id: string;
  contentType: AgentContentType;
  title: string;
  slug: string;
}

export interface ApprovedInternalContentRecord {
  contentId: string;
  contentType: AgentContentType;
  title: string;
  slug: string;
  cveIds: Set<string>;
}

export interface VerifiedFactIndex {
  cveIds: Set<string>;
  cvssScores: Map<string, Set<string>>;
  cvssSeverities: Map<string, Set<string>>;
  cvssVectors: Map<string, Set<string>>;
  kevListedCves: Set<string>;
  kevAddedDates: Map<string, string>;
  affectedProducts: Set<string>;
  patchIds: Set<string>;
}

export type DraftFactType =
  | "cve"
  | "cvss_score"
  | "cvss_severity"
  | "cvss_vector"
  | "kev_status"
  | "patch_id"
  | "affected_product";

export interface ExtractedDraftFact {
  type: DraftFactType;
  raw: string;
  value: string;
  cveId?: string;
  negated?: boolean;
}

export function normalizeCveId(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeCvssScore(value: string): string | null {
  const parsed = Number.parseFloat(value.trim());
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
    return null;
  }

  return parsed.toFixed(1);
}

export function scoresEquivalent(left: string, right: string): boolean {
  const normalizedLeft = normalizeCvssScore(left);
  const normalizedRight = normalizeCvssScore(right);
  return (
    normalizedLeft !== null &&
    normalizedRight !== null &&
    normalizedLeft === normalizedRight
  );
}

export function normalizeCvssSeverity(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeCvssVector(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function normalizePatchId(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeProduct(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ");
}

function hasVersionSpecificity(value: string): boolean {
  return /\b(?:\d{2}H\d|\d{4}(?:\s+R\d+)?|\d+\.\d+(?:\.\d+)*)\b/i.test(value);
}

export function isAffectedProductSupported(
  value: string,
  index: VerifiedFactIndex,
): boolean {
  if (index.affectedProducts.size === 0) {
    return true;
  }

  const normalized = normalizeProduct(value);

  for (const verified of index.affectedProducts) {
    if (normalized === verified) {
      return true;
    }

    if (hasVersionSpecificity(normalized)) {
      continue;
    }

    if (!hasVersionSpecificity(verified)) {
      if (normalized.includes(verified) || verified.includes(normalized)) {
        return true;
      }
    }
  }

  return false;
}

function extractCveIds(text: string): string[] {
  const matches = text.match(CVE_PATTERN) ?? [];
  return [...new Set(matches.map(normalizeCveId))];
}

export function buildApprovedInternalContentIndex(
  items: ApprovedInternalContentInput[],
): Map<string, ApprovedInternalContentRecord> {
  const index = new Map<string, ApprovedInternalContentRecord>();

  for (const item of items) {
    const cveIds = new Set<string>([
      ...extractCveIds(item.title),
      ...extractCveIds(item.slug),
    ]);

    index.set(item.id, {
      contentId: item.id,
      contentType: item.contentType,
      title: item.title,
      slug: item.slug,
      cveIds,
    });
  }

  return index;
}

export function collectApprovedInternalCveIds(
  index: Map<string, ApprovedInternalContentRecord>,
): Set<string> {
  const cveIds = new Set<string>();

  for (const record of index.values()) {
    for (const cveId of record.cveIds) {
      cveIds.add(cveId);
    }
  }

  return cveIds;
}

export function isFactualClaimSentence(sentence: string): boolean {
  return FACTUAL_CLAIM_INDICATORS.test(sentence);
}

export function isInternalLinkReferenceSentence(
  sentence: string,
  sentenceCves: string[],
  approvedInternalCves: Set<string>,
  approvedInternalContent: Map<string, ApprovedInternalContentRecord>,
): boolean {
  if (sentenceCves.length === 0) {
    return false;
  }

  if (!sentenceCves.every((cveId) => approvedInternalCves.has(cveId))) {
    return false;
  }

  if (isFactualClaimSentence(sentence)) {
    return false;
  }

  if (INTERNAL_LINK_REFERENCE_INDICATORS.test(sentence)) {
    return true;
  }

  const normalizedSentence = sentence.toLowerCase();

  for (const record of approvedInternalContent.values()) {
    const titleMatches = sentenceCves.some(
      (cveId) =>
        record.cveIds.has(cveId) &&
        normalizedSentence.includes(record.title.toLowerCase()),
    );
    if (titleMatches) {
      return true;
    }
  }

  return false;
}

export function isResearchCveMentionSupported(
  cveId: string,
  sentence: string,
  researchCveIds: Set<string>,
  approvedInternalCves: Set<string>,
  approvedInternalContent: Map<string, ApprovedInternalContentRecord>,
): boolean {
  if (researchCveIds.has(cveId)) {
    return true;
  }

  const sentenceCves = extractCveIds(sentence);
  return isInternalLinkReferenceSentence(
    sentence,
    sentenceCves,
    approvedInternalCves,
    approvedInternalContent,
  );
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function addToMapSet(
  map: Map<string, Set<string>>,
  key: string,
  value: string,
): void {
  const existing = map.get(key) ?? new Set<string>();
  existing.add(value);
  map.set(key, existing);
}

function parseCvssScoreFromStatement(statement: string): string | null {
  const match = statement.match(CVSS_SCORE_PATTERN);
  return match?.[1] ? normalizeCvssScore(match[1]) : null;
}

function parseCvssSeverityFromStatement(statement: string): string | null {
  const match = statement.match(CVSS_SEVERITY_PATTERN);
  const severity = match?.[1] ?? match?.[2];
  return severity ? normalizeCvssSeverity(severity) : null;
}

function parseCvssVectorFromStatement(statement: string): string | null {
  const match = statement.match(CVSS_VECTOR_PATTERN);
  return match?.[0] ? normalizeCvssVector(match[0]) : null;
}

function isKevListingStatement(statement: string): boolean {
  return KEV_LISTING_PATTERN.test(statement);
}

export function buildVerifiedFactIndex(
  claims: VerifiedClaim[],
): VerifiedFactIndex {
  const index: VerifiedFactIndex = {
    cveIds: new Set<string>(),
    cvssScores: new Map<string, Set<string>>(),
    cvssSeverities: new Map<string, Set<string>>(),
    cvssVectors: new Map<string, Set<string>>(),
    kevListedCves: new Set<string>(),
    kevAddedDates: new Map<string, string>(),
    affectedProducts: new Set<string>(),
    patchIds: new Set<string>(),
  };

  for (const claim of claims) {
    const cveIds = extractCveIds(claim.statement);

    for (const cveId of cveIds) {
      index.cveIds.add(cveId);
    }

    const primaryCve = cveIds[0];

    if (claim.type === "cvss" && primaryCve) {
      const score = parseCvssScoreFromStatement(claim.statement);
      if (score) {
        addToMapSet(index.cvssScores, primaryCve, score);
      }

      const severity = parseCvssSeverityFromStatement(claim.statement);
      if (severity) {
        addToMapSet(index.cvssSeverities, primaryCve, severity);
      }

      const vector = parseCvssVectorFromStatement(claim.statement);
      if (vector) {
        addToMapSet(index.cvssVectors, primaryCve, vector);
      }
    }

    if (claim.type === "exploitation_status" && primaryCve) {
      if (isKevListingStatement(claim.statement)) {
        index.kevListedCves.add(primaryCve);
      }
    }

    if (claim.type === "disclosure_date" && primaryCve) {
      const dateMatch = claim.statement.match(KEV_ADDED_DATE_PATTERN);
      if (dateMatch?.[1]) {
        index.kevAddedDates.set(primaryCve, dateMatch[1]);
        index.kevListedCves.add(primaryCve);
      }
    }

    if (claim.type === "patch_information") {
      for (const match of claim.statement.match(PATCH_PATTERN) ?? []) {
        index.patchIds.add(normalizePatchId(match));
      }
    }

    if (claim.type === "affected_product") {
      const productMatch = claim.statement.match(
        /affected product as ([^.]+)\./i,
      );
      if (productMatch?.[1]) {
        index.affectedProducts.add(normalizeProduct(productMatch[1]));
      }

      const includesMatch = claim.statement.match(/including ([^.]+)\./i);
      if (includesMatch?.[1]) {
        for (const part of includesMatch[1].split(/[;,]/)) {
          const normalized = normalizeProduct(part);
          if (normalized) {
            index.affectedProducts.add(normalized);
          }
        }
      }
    }
  }

  return index;
}

export interface DraftFactExtractionContext {
  researchCveIds: Set<string>;
  approvedInternalCves: Set<string>;
  approvedInternalContent: Map<string, ApprovedInternalContentRecord>;
}

export function extractDraftFacts(
  text: string,
  context?: DraftFactExtractionContext,
): ExtractedDraftFact[] {
  const plain = stripHtml(text);
  const documentCves = extractCveIds(plain);
  const facts: ExtractedDraftFact[] = [];
  const seen = new Set<string>();
  const researchCveIds = context?.researchCveIds ?? new Set<string>();
  const approvedInternalCves = context?.approvedInternalCves ?? new Set<string>();
  const approvedInternalContent =
    context?.approvedInternalContent ??
    new Map<string, ApprovedInternalContentRecord>();

  const pushFact = (fact: ExtractedDraftFact): void => {
    const key = [
      fact.type,
      fact.cveId ?? "",
      fact.value,
      fact.negated ? "negated" : "affirmed",
    ].join("|");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    facts.push(fact);
  };

  for (const sentence of splitSentences(plain)) {
    const sentenceCves = extractCveIds(sentence);
    for (const cveId of sentenceCves) {
      if (
        !isResearchCveMentionSupported(
          cveId,
          sentence,
          researchCveIds,
          approvedInternalCves,
          approvedInternalContent,
        )
      ) {
        pushFact({
          type: "cve",
          cveId,
          value: cveId,
          raw: cveId,
        });
      }
    }

    const associatedCves =
      sentenceCves.length > 0 ? sentenceCves : documentCves;
    const primaryCve = associatedCves[0];

    const scoreMatch = sentence.match(CVSS_SCORE_PATTERN);
    if (scoreMatch?.[1]) {
      const normalizedScore = normalizeCvssScore(scoreMatch[1]);
      if (normalizedScore) {
        pushFact({
          type: "cvss_score",
          cveId: primaryCve,
          value: normalizedScore,
          raw: scoreMatch[0],
        });
      }
    }

    const severityMatch = sentence.match(CVSS_SEVERITY_PATTERN);
    const severity = severityMatch?.[1] ?? severityMatch?.[2];
    if (severity && primaryCve) {
      pushFact({
        type: "cvss_severity",
        cveId: primaryCve,
        value: normalizeCvssSeverity(severity),
        raw: severityMatch?.[0] ?? severity,
      });
    }

    const vectorMatch = sentence.match(CVSS_VECTOR_PATTERN);
    if (vectorMatch?.[0]) {
      pushFact({
        type: "cvss_vector",
        cveId: primaryCve,
        value: normalizeCvssVector(vectorMatch[0]),
        raw: vectorMatch[0],
      });
    }

    if (
      associatedCves.length > 0 &&
      /\b(known exploited vulnerabilities|cisa kev|kev catalog)\b/i.test(sentence)
    ) {
      const negated = KEV_NEGATION_PATTERN.test(sentence);
      for (const cveId of associatedCves) {
        pushFact({
          type: "kev_status",
          cveId,
          value: negated ? "not_listed" : "listed",
          raw: sentence.slice(0, 160),
          negated,
        });
      }
    }

    if (primaryCve) {
      const productMatch = sentence.match(AFFECTED_PRODUCT_PATTERN);
      if (productMatch?.[1]) {
        for (const part of productMatch[1].split(/[;,]/)) {
          const trimmed = part.trim();
          if (trimmed) {
            pushFact({
              type: "affected_product",
              cveId: primaryCve,
              value: trimmed,
              raw: productMatch[0],
            });
          }
        }
      }
    }
  }

  for (const match of plain.match(PATCH_PATTERN) ?? []) {
    pushFact({
      type: "patch_id",
      value: normalizePatchId(match),
      raw: match,
    });
  }

  return facts;
}

export function isDraftFactSupported(
  fact: ExtractedDraftFact,
  index: VerifiedFactIndex,
): boolean {
  switch (fact.type) {
    case "cve":
      return index.cveIds.has(fact.cveId ?? fact.value);
    case "cvss_score": {
      if (!fact.cveId) {
        return false;
      }
      const scores = index.cvssScores.get(fact.cveId);
      if (!scores) {
        return false;
      }
      return [...scores].some((score) => scoresEquivalent(score, fact.value));
    }
    case "cvss_severity": {
      if (!fact.cveId) {
        return false;
      }
      const severities = index.cvssSeverities.get(fact.cveId);
      return severities?.has(normalizeCvssSeverity(fact.value)) ?? false;
    }
    case "cvss_vector": {
      if (!fact.cveId) {
        return false;
      }
      const vectors = index.cvssVectors.get(fact.cveId);
      return vectors?.has(normalizeCvssVector(fact.value)) ?? false;
    }
    case "kev_status": {
      if (!fact.cveId) {
        return false;
      }
      const listed = index.kevListedCves.has(fact.cveId);
      return fact.negated ? !listed : listed;
    }
    case "patch_id":
      return index.patchIds.has(normalizePatchId(fact.value));
    case "affected_product":
      return isAffectedProductSupported(fact.value, index);
    default:
      return false;
  }
}

export function findUnsupportedDraftFacts(
  text: string,
  index: VerifiedFactIndex,
  context?: DraftFactExtractionContext,
): ExtractedDraftFact[] {
  return extractDraftFacts(text, context).filter(
    (fact) => !isDraftFactSupported(fact, index),
  );
}

function validateInternalLinkReferences(
  links: InternalLinkSuggestion[],
  allowedContentIds: Set<string>,
  approvedInternalContent: Map<string, ApprovedInternalContentRecord>,
): {
  invalidInternalLinks: string[];
  unsupportedClaims: string[];
} {
  const invalidInternalLinks: string[] = [];
  const unsupportedClaims: string[] = [];

  for (const link of links) {
    if (!allowedContentIds.has(link.contentId)) {
      invalidInternalLinks.push(link.contentId);
      continue;
    }

    const record = approvedInternalContent.get(link.contentId);
    if (!record) {
      invalidInternalLinks.push(link.contentId);
      continue;
    }

    const anchorCves = extractCveIds(link.anchorText);
    for (const cveId of anchorCves) {
      if (!record.cveIds.has(cveId)) {
        unsupportedClaims.push(
          `internal_link:${link.contentId}:${cveId}`,
        );
      }
    }
  }

  return { invalidInternalLinks, unsupportedClaims };
}

function collectDraftBodyParts(draft: GeneratedDraft): string[] {
  if (draft.contentType === "article") {
    return [draft.content, draft.excerpt, draft.keyTakeaways.join(" ")];
  }

  if (draft.contentType === "tutorial") {
    return [
      draft.description,
      draft.requirements,
      draft.introduction,
      draft.instructions,
      draft.keyTakeaways,
      draft.securityNotes,
    ];
  }

  return [
    draft.description,
    draft.learningObjectives,
    draft.requirementsTools,
    draft.introduction,
    draft.instructions,
    draft.expectedResult,
    draft.securityNotes,
  ];
}

function formatUnsupportedClaim(fact: ExtractedDraftFact): string {
  if (fact.cveId) {
    return `${fact.type}:${fact.cveId}:${fact.value}`;
  }

  return `${fact.type}:${fact.value}`;
}

export function auditGrounding({
  draft,
  verifiedClaims,
  allowedSourceUrls,
  allowedContentIds,
  approvedInternalContent = [],
}: {
  draft: GeneratedDraft;
  verifiedClaims: VerifiedClaim[];
  allowedSourceUrls: string[];
  allowedContentIds: Set<string>;
  approvedInternalContent?: ApprovedInternalContentInput[];
}): GroundingAuditResult {
  const allowedUrls = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );
  const verifiedFactIndex = buildVerifiedFactIndex(verifiedClaims);
  const approvedInternalContentIndex = buildApprovedInternalContentIndex(
    approvedInternalContent,
  );
  const approvedInternalCves = collectApprovedInternalCveIds(
    approvedInternalContentIndex,
  );
  const factExtractionContext: DraftFactExtractionContext = {
    researchCveIds: verifiedFactIndex.cveIds,
    approvedInternalCves,
    approvedInternalContent: approvedInternalContentIndex,
  };
  const unsupportedClaims: string[] = [];
  const invalidSourceUrls: string[] = [];
  const invalidInternalLinks: string[] = [];
  const warnings: string[] = [];

  const combinedBody = collectDraftBodyParts(draft).join("\n");
  for (const fact of findUnsupportedDraftFacts(
    combinedBody,
    verifiedFactIndex,
    factExtractionContext,
  )) {
    unsupportedClaims.push(formatUnsupportedClaim(fact));
  }

  for (const mapping of draft.sourceMappings) {
    for (const url of mapping.sourceUrls) {
      if (!allowedUrls.has(url.trim().toLowerCase())) {
        invalidSourceUrls.push(url);
      }
    }
  }

  const internalLinkAudit = validateInternalLinkReferences(
    draft.internalLinks,
    allowedContentIds,
    approvedInternalContentIndex,
  );
  invalidInternalLinks.push(...internalLinkAudit.invalidInternalLinks);
  unsupportedClaims.push(...internalLinkAudit.unsupportedClaims);

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
