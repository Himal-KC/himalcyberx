import type {
  AgentContentType,
  AgentFactCheckStatus,
  AgentReviewInsert,
  AgentRun,
} from "../../supabase/types";
import type { SolReviewOutput, ReviewGateResult } from "./types";

export function buildReviewInsertPayload(input: {
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  draftFingerprint: string;
  reviewModel: string;
  review: SolReviewOutput;
  gate: ReviewGateResult;
}): AgentReviewInsert {
  return {
    agent_run_id: input.agentRunId,
    content_type: input.contentType,
    content_id: input.contentId,
    status: input.gate.overallStatus,
    fact_check_status: input.gate.factCheckStatus,
    review_model: input.reviewModel,
    review_version: input.review.reviewVersion,
    draft_fingerprint: input.draftFingerprint,
    quality_score: input.gate.overallQualityScore,
    summary: input.review.summary,
    findings: input.review.findings as unknown as Record<string, unknown>[],
    quality_breakdown: input.gate.qualityBreakdown as unknown as Record<
      string,
      unknown
    >,
    unsupported_claims: input.review.unsupportedClaims,
    conflicting_claims: input.review.conflictingClaims,
    source_integrity: input.review.sourceIntegrity as unknown as Record<
      string,
      unknown
    >,
    internal_link_integrity:
      input.review.internalLinkIntegrity as unknown as Record<string, unknown>,
    seo_review: input.review.seoReview as unknown as Record<string, unknown>,
    readability_review: input.review.readabilityReview as unknown as Record<
      string,
      unknown
    >,
    originality_review: input.review.originalityReview as unknown as Record<
      string,
      unknown
    >,
    safety_review: input.review.safetyReview as unknown as Record<string, unknown>,
    publication_recommendation: input.review.publicationRecommendation,
    warnings: input.review.warnings,
    review_metadata: {
      hardGateFailures: input.gate.hardGateFailures,
    },
  };
}

export function buildLinkedContentReviewUpdate(input: {
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
}): {
  fact_check_status: AgentFactCheckStatus;
  quality_score: number;
  last_verified_at: string;
} {
  return {
    fact_check_status: input.factCheckStatus,
    quality_score: input.qualityScore,
    last_verified_at: new Date().toISOString(),
  };
}

export function buildAgentRunReviewUpdate(input: {
  run: AgentRun;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  reviewMetadata: Record<string, unknown>;
}): Record<string, unknown> {
  const existingMetadata =
    input.run.generation_metadata &&
    typeof input.run.generation_metadata === "object"
      ? input.run.generation_metadata
      : {};

  return {
    status: input.run.status === "ready" ? "ready" : input.run.status,
    stage: "fact_check",
    fact_check_status: input.factCheckStatus,
    quality_score: input.qualityScore,
    generation_metadata: {
      ...existingMetadata,
      latestReview: input.reviewMetadata,
    },
    error_message: null,
  };
}

export function contentIdForRun(run: AgentRun): string | null {
  if (run.content_type === "article") {
    return run.article_id;
  }
  if (run.content_type === "tutorial") {
    return run.tutorial_id;
  }
  return run.lab_id;
}
