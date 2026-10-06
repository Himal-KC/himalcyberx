import type { GeneratedDraft } from "../generation/types";
import type { RevisionPlan, RevisionPlanAction } from "./automatic-revision-core";
import {
  buildAssertionProbesFromFinding,
  draftRetainsTargetedMechanismAssertion,
  normalizeRevisionProbeText as normalizeAssertionProbeText,
} from "./revision-assertion-core.ts";
import type { AgentReviewRecord, ReviewFinding } from "./types";

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
  return normalizeAssertionProbeText(value);
}

export function buildUnsupportedClaimProbesFromFinding(
  finding: ReviewFinding,
): string[] {
  return buildAssertionProbesFromFinding(finding);
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

    const probes = buildAssertionProbesFromFinding(finding);
    const retained = draftRetainsTargetedMechanismAssertion(
      input.revisedDraft,
      probes,
    );

    if (retained) {
      failures.push(
        `unsupported_assertion:${finding.findingId}:${retained.surface}:${retained.probe}`,
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
