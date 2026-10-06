import type { GeneratedDraft } from "../generation/types";
import type { ReviewFinding } from "./types";

export function normalizeRevisionProbeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const MECHANISM_TERM_HINT =
  /improper|input.validation|remote code execution|unauthenticated|\brce\b|gateway and adc|adc and gateway/i;

const ASSERTIVE_MECHANISM_PATTERN =
  /(?:is|are|was|were|involves?|represents?|allows?|permits?|enables?|enabling|confirming|confirmed)\b.{0,48}\b(?:improper|input.validation|remote code execution|unauthenticated|\brce\b)/i;

const EVIDENCE_LIMITATION_SENTENCE =
  /\b(?:does|do|did|cannot|can't|could not|without)\s+(?:not\s+)?(?:establish|confirm|substantiate|verify|demonstrate|prove|support|show|indicate)\b/i;

const NEGATED_MECHANISM_PATTERN =
  /\b(?:not|nor|without)\s+(?:establish(?:ed|ing)?|confirm(?:ed|ing)?|substantiat(?:e|ed|ing)|verif(?:y|ied|ying)|demonstrat(?:e|ed|ing)|prove(?:n|d|s)?|support(?:ed|ing)?)\b.{0,80}\b(?:improper|input.validation|remote code execution|unauthenticated|\brce\b)/i;

const NOT_ESTABLISHED_PATTERN =
  /\b(?:is|are|was|were|mechanism|mechanistic|exploit details?)\b.{0,40}\bnot established\b/i;

export type DraftTextSurface =
  | "title"
  | "excerpt"
  | "content"
  | "key_takeaways"
  | "seo_title"
  | "seo_description"
  | "og_title"
  | "og_description"
  | "seo_keywords"
  | "description"
  | "introduction"
  | "instructions"
  | "requirements"
  | "learning_objectives"
  | "expected_result"
  | "security_notes";

export interface DraftSurfaceEntry {
  surface: DraftTextSurface;
  text: string;
}

export function listDraftSurfaceEntries(draft: GeneratedDraft): DraftSurfaceEntry[] {
  const entries: DraftSurfaceEntry[] = [{ surface: "title", text: draft.title }];

  if (draft.contentType === "article") {
    entries.push(
      { surface: "excerpt", text: draft.excerpt },
      { surface: "content", text: draft.content },
      ...draft.keyTakeaways.map((text, index) => ({
        surface: `key_takeaways` as const,
        text: `[${index}] ${text}`,
      })),
      { surface: "seo_title", text: draft.seo.seoTitle },
      { surface: "seo_description", text: draft.seo.seoDescription },
      { surface: "og_title", text: draft.seo.ogTitle },
      { surface: "og_description", text: draft.seo.ogDescription },
      { surface: "seo_keywords", text: draft.seo.seoKeywords.join(" ") },
    );
    return entries.filter((entry) => entry.text.trim().length > 0);
  }

  if (draft.contentType === "tutorial") {
    entries.push(
      { surface: "description", text: draft.description },
      { surface: "requirements", text: draft.requirements },
      { surface: "introduction", text: draft.introduction },
      { surface: "instructions", text: draft.instructions },
      { surface: "key_takeaways", text: draft.keyTakeaways },
      { surface: "security_notes", text: draft.securityNotes },
      { surface: "seo_title", text: draft.seo.seoTitle },
      { surface: "seo_description", text: draft.seo.seoDescription },
      { surface: "og_title", text: draft.seo.ogTitle },
      { surface: "og_description", text: draft.seo.ogDescription },
    );
    return entries.filter((entry) => entry.text.trim().length > 0);
  }

  entries.push(
    { surface: "description", text: draft.description },
    { surface: "learning_objectives", text: draft.learningObjectives },
    { surface: "requirements", text: draft.requirementsTools },
    { surface: "introduction", text: draft.introduction },
    { surface: "instructions", text: draft.instructions },
    { surface: "expected_result", text: draft.expectedResult },
    { surface: "security_notes", text: draft.securityNotes },
    { surface: "seo_title", text: draft.seo.seoTitle },
    { surface: "seo_description", text: draft.seo.seoDescription },
    { surface: "og_title", text: draft.seo.ogTitle },
    { surface: "og_description", text: draft.seo.ogDescription },
  );

  return entries.filter((entry) => entry.text.trim().length > 0);
}

export function splitIntoRevisionSentences(text: string): string[] {
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) {
    return [];
  }

  return stripped
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function isEvidenceLimitationSentence(sentence: string): boolean {
  const normalized = normalizeRevisionProbeText(sentence);
  if (!normalized) {
    return false;
  }

  if (EVIDENCE_LIMITATION_SENTENCE.test(normalized)) {
    return true;
  }

  if (NEGATED_MECHANISM_PATTERN.test(normalized)) {
    return true;
  }

  if (NOT_ESTABLISHED_PATTERN.test(normalized)) {
    return true;
  }

  return false;
}

function extractMechanismAssertionPhrases(text: string): string[] {
  const normalized = normalizeRevisionProbeText(text);
  if (!normalized || !MECHANISM_TERM_HINT.test(normalized)) {
    return [];
  }

  const phrases = new Set<string>();

  const patterns = [
    /\bimproper input validation flaw enabling unauthenticated remote code execution\b/g,
    /\bimproper input validation flaw\b/g,
    /\binput validation flaw enabling unauthenticated remote code execution\b/g,
    /\benabling unauthenticated remote code execution\b/g,
    /\benables unauthenticated remote code execution\b/g,
    /\bunauthenticated remote code execution\b/g,
    /\bboth netscaler adc and gateway\b/g,
    /\bnetscaler adc and gateway\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const phrase = match[0]?.trim();
      if (phrase && phrase.length >= 24) {
        phrases.add(phrase);
      }
    }
  }

  return [...phrases];
}

export function buildAssertionProbesFromFinding(finding: ReviewFinding): string[] {
  const probes = new Set<string>();

  for (const source of [finding.claimText, finding.suggestedCorrection ?? ""]) {
    for (const phrase of extractMechanismAssertionPhrases(source)) {
      probes.add(phrase);
    }
  }

  return [...probes].sort((left, right) => right.length - left.length);
}

export function sentenceContainsUnsupportedAssertion(sentence: string): boolean {
  const normalized = normalizeRevisionProbeText(sentence);
  if (!normalized || !MECHANISM_TERM_HINT.test(normalized)) {
    return false;
  }

  if (isEvidenceLimitationSentence(sentence)) {
    return false;
  }

  return ASSERTIVE_MECHANISM_PATTERN.test(normalized);
}

export function locateUnsupportedAssertionInDraft(
  draft: GeneratedDraft,
): { surface: DraftTextSurface; sentence: string; probe: string } | null {
  for (const entry of listDraftSurfaceEntries(draft)) {
    for (const sentence of splitIntoRevisionSentences(entry.text)) {
      if (sentenceContainsUnsupportedAssertion(sentence)) {
        const normalized = normalizeRevisionProbeText(sentence);
        const probe =
          extractMechanismAssertionPhrases(sentence)[0] ??
          normalized.slice(0, Math.min(80, normalized.length));
        return { surface: entry.surface, sentence: sentence.trim(), probe };
      }
    }
  }

  return null;
}

export function draftRetainsTargetedMechanismAssertion(
  draft: GeneratedDraft,
  probes: string[],
): { probe: string; surface: DraftTextSurface; sentence: string } | null {
  const located = locateUnsupportedAssertionInDraft(draft);
  if (!located) {
    return null;
  }

  const normalizedSentence = normalizeRevisionProbeText(located.sentence);
  const matchedProbe =
    probes.find((probe) => normalizedSentence.includes(normalizeRevisionProbeText(probe))) ??
    located.probe;

  return {
    probe: matchedProbe,
    surface: located.surface,
    sentence: located.sentence,
  };
}
