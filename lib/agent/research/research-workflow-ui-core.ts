import { buildImproveResearchQueries } from "./search-queries-core.ts";
import { deriveCanGenerateDraft } from "./derive-can-generate.ts";
import {
  MAX_RESEARCH_IMPROVEMENTS,
  type ResearchSufficiencyAssessment,
} from "./research-sufficiency-core.ts";
import type {
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
} from "@/lib/agent/types";

export const IMPROVE_BEFORE_DRAFT_HEADLINE =
  "Improve the research before generating a draft.";

export const POST_DRAFT_INSUFFICIENT_EVIDENCE_MESSAGE =
  "Start a new research run to improve the evidence. This draft is tied to the original research evidence.";

export interface ResearchWorkflowUiInput {
  researchQuality: ResearchQuality;
  researchConfidence: ResearchConfidence;
  sources: ResearchSource[];
  /** Authoritative eligibility from hydration / server recompute. */
  canGenerateDraft: boolean;
  researchSufficiency?: ResearchSufficiencyAssessment | null;
  hasLinkedDraft: boolean;
  researchImprovementCount?: number;
}

export interface ResearchGenerateDraftUi {
  /** Must match backend `canGenerateDraft`; never overridden in UI. */
  enabled: boolean;
  showPreDraftImproveBanner: boolean;
  showPostDraftInsufficientEvidence: boolean;
  showNeedsReviewAllowedNotice: boolean;
  helperMessage: string;
  blockedHeadline: string | null;
}

export function isResearchEvidenceInsufficient(
  researchSufficiency?: ResearchSufficiencyAssessment | null,
): boolean {
  return researchSufficiency?.status !== "sufficient";
}

export function shouldShowImproveBeforeDraftBanner(
  input: Pick<
    ResearchWorkflowUiInput,
    "researchSufficiency" | "hasLinkedDraft"
  >,
): boolean {
  return (
    !input.hasLinkedDraft &&
    input.researchSufficiency?.status === "needs_more_research"
  );
}

export function canShowImproveResearchAction(
  input: Pick<
    ResearchWorkflowUiInput,
    "hasLinkedDraft" | "researchSufficiency" | "researchImprovementCount"
  > & { topic: string },
): boolean {
  if (input.hasLinkedDraft) {
    return false;
  }

  if (input.researchSufficiency?.status !== "needs_more_research") {
    return false;
  }

  if ((input.researchImprovementCount ?? 0) >= MAX_RESEARCH_IMPROVEMENTS) {
    return false;
  }

  return (
    buildImproveResearchQueries(input.topic, input.researchSufficiency).length >
    0
  );
}

export function resolveImproveResearchUnavailableMessage(input: {
  topic: string;
  researchSufficiency?: ResearchSufficiencyAssessment | null;
  researchImprovementCount?: number;
  hasLinkedDraft?: boolean;
}): string | null {
  if (
    !input.researchSufficiency ||
    input.researchSufficiency.status !== "needs_more_research" ||
    input.hasLinkedDraft
  ) {
    return null;
  }

  if ((input.researchImprovementCount ?? 0) >= MAX_RESEARCH_IMPROVEMENTS) {
    return "Maximum research improvement attempts reached for this run.";
  }

  if (
    buildImproveResearchQueries(input.topic, input.researchSufficiency)
      .length === 0
  ) {
    return "Follow-up research queries could not be derived from the current evidence gaps.";
  }

  return null;
}

export function shouldShowPostDraftInsufficientEvidence(
  input: Pick<
    ResearchWorkflowUiInput,
    "hasLinkedDraft" | "researchSufficiency"
  >,
): boolean {
  return (
    input.hasLinkedDraft && isResearchEvidenceInsufficient(input.researchSufficiency)
  );
}

function resolveBlockedGenerateDraftMessage(
  input: ResearchWorkflowUiInput,
): string {
  const sufficiency = input.researchSufficiency;

  if (sufficiency?.status === "needs_more_research") {
    return IMPROVE_BEFORE_DRAFT_HEADLINE;
  }

  if (sufficiency?.status === "blocked") {
    return "Research is blocked for draft generation. Review uncertain evidence or start a new run.";
  }

  if (input.researchQuality === "failed") {
    return "Draft generation is unavailable because research failed.";
  }

  const baseAllowed = deriveCanGenerateDraft(
    input.researchQuality,
    input.sources,
  );

  if (!baseAllowed) {
    return "Draft generation is unavailable because research did not meet the minimum evidence threshold.";
  }

  if (
    input.researchQuality === "needs_review" ||
    input.researchConfidence === "low"
  ) {
    return "Draft generation is unavailable until research evidence meets grounding requirements.";
  }

  return "Draft generation is unavailable because research evidence is insufficient.";
}

export function resolveResearchGenerateDraftUi(
  input: ResearchWorkflowUiInput,
): ResearchGenerateDraftUi {
  const enabled = input.canGenerateDraft;
  const showPreDraftImproveBanner = shouldShowImproveBeforeDraftBanner(input);
  const showPostDraftInsufficientEvidence =
    shouldShowPostDraftInsufficientEvidence(input);

  if (enabled) {
    return {
      enabled: true,
      showPreDraftImproveBanner,
      showPostDraftInsufficientEvidence,
      showNeedsReviewAllowedNotice: input.researchQuality === "needs_review",
      blockedHeadline: null,
      helperMessage:
        input.researchQuality === "needs_review"
          ? "Generation is allowed because authoritative evidence meets grounding rules, but this research still needs review before publication."
          : "Creates a grounded draft in the existing HimalCyberX editor. Nothing is published automatically.",
    };
  }

  const blockedHeadline =
    input.researchSufficiency?.status === "needs_more_research"
      ? IMPROVE_BEFORE_DRAFT_HEADLINE
      : null;

  return {
    enabled: false,
    showPreDraftImproveBanner,
    showPostDraftInsufficientEvidence,
    showNeedsReviewAllowedNotice: false,
    blockedHeadline,
    helperMessage: resolveBlockedGenerateDraftMessage(input),
  };
}
