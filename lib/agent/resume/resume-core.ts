import type { GenerateDraftResult } from "../generation/types";
import type { RunReviewResult } from "../review/types";
import type {
  AgentContentType,
  AgentRun,
  AgentRunStage,
  AgentRunStatus,
} from "../../supabase/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ResumableAgentRunSummary {
  agentRunId: string;
  topic: string;
  contentType: AgentContentType;
  status: AgentRunStatus;
  stage: AgentRunStage;
  draftTitle: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface FeaturedImageState {
  url: string | null;
  alt: string | null;
}

export interface ResumedAgentRunResult {
  agentRunId: string;
  topic: string;
  contentType: AgentContentType;
  status: AgentRunStatus;
  stage: AgentRunStage;
  draft: GenerateDraftResult;
  latestReview: RunReviewResult | null;
  featuredImage: FeaturedImageState;
}

export interface LinkedContentRecord {
  id: string;
  title: string;
  slug: string;
  status: string;
  agent_run_id: string | null;
  featured_image?: string | null;
  featured_image_alt?: string | null;
}

export function isValidAgentRunId(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function getRunLinkedContentId(run: AgentRun): string | null {
  if (run.content_type === "article") {
    return run.article_id;
  }
  if (run.content_type === "tutorial") {
    return run.tutorial_id;
  }
  return run.lab_id;
}

export function runHasLinkedDraft(run: AgentRun): boolean {
  return getRunLinkedContentId(run) !== null;
}

export function runHasPersistedResearch(run: AgentRun): boolean {
  if (!run.research_payload || typeof run.research_payload !== "object") {
    return false;
  }

  const record = run.research_payload as Record<string, unknown>;
  return (
    Array.isArray(record.verifiedClaims) &&
    typeof record.researchQuality === "string" &&
    typeof record.canGenerateDraft === "boolean"
  );
}

export function isResumableAgentRun(run: AgentRun): boolean {
  return runHasLinkedDraft(run) && runHasPersistedResearch(run);
}

export function validateContentBelongsToRun(input: {
  run: AgentRun;
  content: LinkedContentRecord;
}): boolean {
  const linkedContentId = getRunLinkedContentId(input.run);
  if (!linkedContentId || linkedContentId !== input.content.id) {
    return false;
  }

  return input.content.agent_run_id === input.run.id;
}

export function validateResumeAgentRunInput(input: {
  agentRunId: string;
  run: AgentRun | null;
  content: LinkedContentRecord | null;
  hasResearchPayload: boolean;
  hasDraftSnapshot: boolean;
}): { valid: true } | { valid: false; error: string } {
  if (!isValidAgentRunId(input.agentRunId)) {
    return { valid: false, error: "Invalid agent run ID." };
  }

  if (!input.run) {
    return { valid: false, error: "Unable to load agent research run." };
  }

  if (input.run.id !== input.agentRunId.trim()) {
    return { valid: false, error: "Agent run ID mismatch." };
  }

  if (!runHasLinkedDraft(input.run)) {
    return { valid: false, error: "No draft exists for this research run." };
  }

  if (!input.hasResearchPayload || !input.hasDraftSnapshot) {
    return { valid: false, error: "Research evidence is insufficient." };
  }

  if (!input.content) {
    return { valid: false, error: "Unable to load linked draft content." };
  }

  if (!validateContentBelongsToRun({ run: input.run, content: input.content })) {
    return {
      valid: false,
      error: "Linked draft does not belong to this agent run.",
    };
  }

  return { valid: true };
}

export function buildResumableAgentRunSummary(input: {
  run: AgentRun;
  draftTitle: string | null;
}): ResumableAgentRunSummary | null {
  if (!isResumableAgentRun(input.run)) {
    return null;
  }

  return {
    agentRunId: input.run.id,
    topic: input.run.topic,
    contentType: input.run.content_type,
    status: input.run.status,
    stage: input.run.stage,
    draftTitle: input.draftTitle,
    updatedAt: input.run.updated_at,
    createdAt: input.run.created_at,
  };
}

export function buildResumedAgentRunResult(input: {
  run: AgentRun;
  draft: GenerateDraftResult;
  latestReview: RunReviewResult | null;
  featuredImage: FeaturedImageState;
}): ResumedAgentRunResult {
  return {
    agentRunId: input.run.id,
    topic: input.run.topic,
    contentType: input.run.content_type,
    status: input.run.status,
    stage: input.run.stage,
    draft: input.draft,
    latestReview: input.latestReview,
    featuredImage: input.featuredImage,
  };
}
