import type { GeneratedDraft } from "../generation/types";
import type { RevisionPlan, RevisionPlanAction } from "./automatic-revision-core";
import type { AgentReviewRecord, ReviewFinding } from "./types";

const CORRECTION_PROBE_HINT =
  /improper|input.validation|remote code execution|unauthenticated|\brce\b|gateway and adc|adc and gateway/i;

const PROBE_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "that",
  "this",
  "these",
  "those",
  "with",
  "without",
  "from",
  "into",
  "about",
  "main",
  "factual",
  "concern",
  "detailed",
  "characterization",
  "vulnerability",
  "draft",
  "claim",
  "statement",
  "supported",
  "verified",
  "research",
  "supplied",
  "claims",
  "full",
  "technical",
  "not",
  "established",
  "by",
]);

export function collectRevisionDraftTextSurfaces(
  draft: GeneratedDraft,
): string[] {
  const surfaces: string[] = [draft.title.trim()];

  if (draft.contentType === "article") {
    surfaces.push(
      draft.excerpt,
      draft.content,
      ...draft.keyTakeaways,
      draft.seo.seoTitle,
      draft.seo.seoDescription,
      draft.seo.ogTitle,
      draft.seo.ogDescription,
      draft.seo.seoKeywords.join(" "),
    );
    return surfaces.filter((value) => value.trim().length > 0);
  }

  if (draft.contentType === "tutorial") {
    surfaces.push(
      draft.description,
      draft.requirements,
      draft.introduction,
      draft.instructions,
      draft.keyTakeaways,
      draft.securityNotes,
      draft.seo.seoTitle,
      draft.seo.seoDescription,
      draft.seo.ogTitle,
      draft.seo.ogDescription,
    );
    return surfaces.filter((value) => value.trim().length > 0);
  }

  surfaces.push(
    draft.description,
    draft.learningObjectives,
    draft.requirementsTools,
    draft.introduction,
    draft.instructions,
    draft.expectedResult,
    draft.securityNotes,
    draft.seo.seoTitle,
    draft.seo.seoDescription,
    draft.seo.ogTitle,
    draft.seo.ogDescription,
  );

  return surfaces.filter((value) => value.trim().length > 0);
}

export function normalizeRevisionProbeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeProbe(value: string): string[] {
  return normalizeRevisionProbeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 0 && !PROBE_STOPWORDS.has(token));
}

function buildPhraseProbesFromText(text: string): string[] {
  const normalized = normalizeRevisionProbeText(text);
  if (!normalized) {
    return [];
  }

  const probes = new Set<string>();
  probes.add(normalized);

  for (const chunk of normalized.split(/[,;]/)) {
    const trimmed = chunk.trim();
    if (trimmed.length >= 24) {
      probes.add(trimmed);
    }
  }

  const tokens = tokenizeProbe(normalized);
  for (let size = Math.min(6, tokens.length); size >= 3; size -= 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phrase = tokens.slice(index, index + size).join(" ");
      if (phrase.length >= 24) {
        probes.add(phrase);
      }
    }
  }

  return [...probes].sort((left, right) => right.length - left.length);
}

export function buildUnsupportedClaimProbesFromFinding(
  finding: ReviewFinding,
): string[] {
  const probes = new Set<string>();

  for (const probe of buildPhraseProbesFromText(finding.claimText)) {
    probes.add(probe);
  }

  for (const probe of buildPhraseProbesFromText(finding.explanation)) {
    probes.add(probe);
  }

  const correction = finding.suggestedCorrection?.trim() ?? "";
  if (correction && CORRECTION_PROBE_HINT.test(correction)) {
    for (const probe of buildPhraseProbesFromText(correction)) {
      if (CORRECTION_PROBE_HINT.test(probe)) {
        probes.add(probe);
      }
    }
  }

  return [...probes];
}

export function draftSurfacesContainProbe(
  draft: GeneratedDraft,
  probe: string,
): boolean {
  const normalizedProbe = normalizeRevisionProbeText(probe);
  if (normalizedProbe.length < 12) {
    return false;
  }

  const blob = normalizeRevisionProbeText(
    collectRevisionDraftTextSurfaces(draft).join("\n"),
  );

  return blob.includes(normalizedProbe);
}

function findingForAction(
  review: AgentReviewRecord,
  action: RevisionPlanAction,
): ReviewFinding | null {
  if (!action.findingId) {
    return null;
  }

  return (
    review.findings.find((finding) => finding.findingId === action.findingId) ??
    null
  );
}

export function verifyRevisionPostconditions(input: {
  plan: RevisionPlan;
  review: AgentReviewRecord;
  revisedDraft: GeneratedDraft;
}): { ok: boolean; failures: string[]; verifiedActionFindingIds: string[] } {
  const failures: string[] = [];
  const verifiedActionFindingIds: string[] = [];

  for (const action of input.plan.actions) {
    if (
      action.issueType !== "unsupported_explanation" &&
      action.issueType !== "editorial_scope" &&
      action.issueType !== "seo_alignment" &&
      action.issueType !== "keyword_wording"
    ) {
      continue;
    }

    const finding = findingForAction(input.review, action);
    if (!finding) {
      if (action.issueType === "seo_alignment") {
        verifiedActionFindingIds.push(action.findingId ?? "seo");
      }
      continue;
    }

    const probes = buildUnsupportedClaimProbesFromFinding(finding);
    const remaining = probes.filter((probe) =>
      draftSurfacesContainProbe(input.revisedDraft, probe),
    );

    if (remaining.length > 0) {
      failures.push(
        `unsupported_claim_still_present:${finding.findingId}:${remaining[0]}`,
      );
      continue;
    }

    if (action.findingId) {
      verifiedActionFindingIds.push(action.findingId);
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    verifiedActionFindingIds,
  };
}
