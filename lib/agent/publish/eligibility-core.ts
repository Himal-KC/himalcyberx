import type { PersistedReadinessResult } from "../readiness/types";
import type { AgentReviewRecord } from "../review/types";
import type { AgentContentType, AgentRunStage, AgentRunStatus } from "../../supabase/types";
import type {
  PublishEligibilityCode,
  PublishEligibilityResult,
} from "./types";

export interface PublishContentSnapshot {
  id: string;
  slug: string;
  status: string;
  agentRunId: string | null;
  featuredImage: string | null;
}

export interface PublishArticleSnapshot extends PublishContentSnapshot {
  contentType: "article";
  title: string;
  excerpt: string;
  content: string;
  author: string | null;
  categoryId: string | null;
  featuredImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

export interface PublishTutorialSnapshot extends PublishContentSnapshot {
  contentType: "tutorial";
  title: string;
  description: string;
  category: string | null;
  difficulty: string;
  estimatedTime: string | null;
  requirements: string | null;
  introduction: string;
  instructions: string;
  keyTakeaways: string | null;
  securityNotes: string | null;
}

export interface PublishLabSnapshot extends PublishContentSnapshot {
  contentType: "lab";
  title: string;
  description: string;
  category: string | null;
  difficulty: string;
  estimatedTime: string | null;
  learningObjectives: string | null;
  requirementsTools: string | null;
  introduction: string;
  instructions: string;
  expectedResult: string | null;
  securityNotes: string | null;
}

export type PublishContentRowSnapshot =
  | PublishArticleSnapshot
  | PublishTutorialSnapshot
  | PublishLabSnapshot;

export interface EvaluatePublishEligibilityInput {
  agentRunId: string;
  runStage: AgentRunStage;
  runStatus: AgentRunStatus;
  content: PublishContentRowSnapshot | null;
  review: AgentReviewRecord | null;
  finalReadiness: PersistedReadinessResult | null;
  currentReadinessFingerprint: string;
  currentDraftFingerprint: string;
  categoriesAvailable?: boolean;
}

function ineligible(
  code: PublishEligibilityCode,
  message: string,
): PublishEligibilityResult {
  return { eligible: false, code, message };
}

function eligible(): PublishEligibilityResult {
  return {
    eligible: true,
    code: "READY",
    message: "Content is eligible for safe publishing.",
  };
}

function validateContentForPublish(input: {
  content: PublishContentRowSnapshot;
}): PublishEligibilityResult | null {
  if (!input.content.featuredImage?.trim()) {
    return ineligible(
      "IMAGE_MISSING",
      "Featured image is required before publishing.",
    );
  }

  return null;
}

export function evaluatePublishEligibility(
  input: EvaluatePublishEligibilityInput,
): PublishEligibilityResult {
  if (input.runStage === "publishing" && input.runStatus === "running") {
    return ineligible(
      "PUBLISH_IN_PROGRESS",
      "Publication is already in progress for this agent run.",
    );
  }

  if (!input.content) {
    return ineligible(
      "CONTENT_MISSING",
      "No linked draft content exists for this agent run.",
    );
  }

  if (input.content.status === "published") {
    return ineligible(
      "ALREADY_PUBLISHED",
      "Linked content is already published.",
    );
  }

  if (input.content.status !== "draft") {
    return ineligible(
      "CONTENT_NOT_DRAFT",
      "Only draft content can be published through the agent.",
    );
  }

  if (input.content.agentRunId !== input.agentRunId) {
    return ineligible(
      "CONTENT_MISMATCH",
      "Linked draft does not belong to this agent run.",
    );
  }

  if (!input.review) {
    return ineligible(
      "REVIEW_MISSING",
      "No Phase 5 review exists for this agent run.",
    );
  }

  if (input.review.status === "fail") {
    return ineligible(
      "REVIEW_FAILED",
      "Phase 5 review status is FAIL. Resolve review failures before publishing.",
    );
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    return ineligible(
      "REVIEW_STALE",
      "Phase 5 review is outdated. Rerun Independent Review before publishing.",
    );
  }

  if (!input.finalReadiness) {
    return ineligible(
      "READINESS_MISSING",
      "No Phase 7 final readiness result exists. Run Final Readiness Check first.",
    );
  }

  if (input.finalReadiness.status !== "READY_TO_PUBLISH") {
    return ineligible(
      "READINESS_NOT_READY",
      "Phase 7 readiness is not READY TO PUBLISH.",
    );
  }

  if (input.finalReadiness.stale === true) {
    return ineligible(
      "READINESS_STALE",
      "Phase 7 final readiness is outdated. Rerun Final Readiness Check before publishing.",
    );
  }

  if (input.finalReadiness.fingerprint !== input.currentReadinessFingerprint) {
    return ineligible(
      "READINESS_STALE",
      "Phase 7 final readiness is outdated. Rerun Final Readiness Check before publishing.",
    );
  }

  const contentValidation = validateContentForPublish({
    content: input.content,
  });
  if (contentValidation) {
    return contentValidation;
  }

  return eligible();
}

export function parseFinalReadinessFromMetadata(
  metadata: Record<string, unknown> | null,
): PersistedReadinessResult | null {
  if (!metadata) {
    return null;
  }

  const value = metadata.finalReadiness;
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as PersistedReadinessResult;
  if (
    typeof record.status !== "string" ||
    typeof record.readinessScore !== "number" ||
    typeof record.fingerprint !== "string"
  ) {
    return null;
  }

  return record;
}

export function contentTypeLabel(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}
