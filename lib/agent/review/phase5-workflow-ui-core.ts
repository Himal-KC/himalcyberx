import type { GroundingAuditResult } from "../generation/types";
import {
  assessAutomaticRevisionEligibility,
  buildAutomaticRevisionUiState,
  type AutomaticRevisionUiState,
} from "./automatic-revision-core.ts";
import {
  buildPhase5HumanAcceptanceUiState,
  readPhase5HumanReviewAcceptanceFromMetadata,
  type Phase5HumanAcceptanceUiState,
} from "./human-acceptance-core.ts";
import type { AgentReviewRecord, ReviewDraftSnapshot } from "./types";

export function buildPhase5WorkflowUiState(input: {
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
  groundingAudit: GroundingAuditResult;
  metadata: Record<string, unknown> | null | undefined;
  snapshot: ReviewDraftSnapshot;
}): {
  phase5HumanAcceptance: Phase5HumanAcceptanceUiState | null;
  phase5AutomaticRevision: AutomaticRevisionUiState | null;
} {
  if (!input.review) {
    return {
      phase5HumanAcceptance: null,
      phase5AutomaticRevision: null,
    };
  }

  const acceptanceRecord = readPhase5HumanReviewAcceptanceFromMetadata(input.metadata);

  return {
    phase5HumanAcceptance: buildPhase5HumanAcceptanceUiState({
      acceptance: acceptanceRecord,
      agentRunId: input.agentRunId,
      review: input.review,
      currentDraftFingerprint: input.currentDraftFingerprint,
      groundingAudit: input.groundingAudit,
    }),
    phase5AutomaticRevision: buildAutomaticRevisionUiState({
      eligibility: assessAutomaticRevisionEligibility({
        agentRunId: input.agentRunId,
        review: input.review,
        currentDraftFingerprint: input.currentDraftFingerprint,
        groundingAudit: input.groundingAudit,
        metadata: input.metadata,
        snapshot: input.snapshot,
      }),
      metadata: input.metadata,
    }),
  };
}

export function isPhase5ReviewCurrentForDraft(input: {
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
}): boolean {
  if (!input.review) {
    return false;
  }

  return input.review.draftFingerprint === input.currentDraftFingerprint;
}
