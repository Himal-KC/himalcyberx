import type { AutomaticRevisionUiState } from "../review/automatic-revision-core";
import type { DeterministicCleanupUiState } from "../content/deterministic-cleanup-core";
import type { Phase5HumanAcceptanceUiState } from "../review/human-acceptance-core";
import type { GenerateDraftResult, PersistedResearchPayload } from "../generation/types";
import { resolveResearchGenerationEligibility } from "../research/research-generation-eligibility-core.ts";
import type { RunReviewResult } from "../review/types";
import type { RunPublishResult } from "../publish/types";
import type { RunReadinessResult } from "../readiness/types";
import type {
  ContentAwarenessResult,
  ResearchResult,
  ResearchSource,
  RecommendedCategory,
} from "../types";
import type {
  AgentContentType,
  AgentRun,
  AgentRunStage,
  AgentRunStatus,
  AgentSource,
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
  cardStatusLabel: string;
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
  latestReadiness: RunReadinessResult | null;
  latestPublish: RunPublishResult | null;
  phase5HumanAcceptance: Phase5HumanAcceptanceUiState | null;
  phase5AutomaticRevision: AutomaticRevisionUiState | null;
  phase5DeterministicCleanup: DeterministicCleanupUiState | null;
}

export interface AgentRunPageHydration {
  agentRunId: string;
  resumed: ResumedAgentRunResult;
  research: ResearchResult;
  contentAwareness: ContentAwarenessResult | null;
  presentation: import("../status/presentation-core").AgentRunAdminPresentation;
  applicableArticleCategory: RecommendedCategory | null;
  linkedArticleCategoryId: string | null;
}

export function parseAgentRunPageQuery(input: {
  run?: string | null;
  new?: string | null;
}): {
  startNew: boolean;
  requestedRunId: string | null;
} {
  const startNew = input.new === "1" || input.new === "true";
  const requestedRunId =
    startNew || !input.run?.trim() ? null : input.run.trim();

  return {
    startNew,
    requestedRunId,
  };
}

export function buildAgentRunResumeHref(agentRunId: string): string {
  return `/admin/agent?run=${agentRunId}`;
}

export function buildAgentRunNewTopicHref(): string {
  return "/admin/agent?new=1";
}

export function isExcludedFromAutoRestore(run: AgentRun): boolean {
  return (
    run.status === "failed" ||
    run.status === "cancelled" ||
    run.stage === "failed"
  );
}

export function isUnfinishedAgentRun(run: AgentRun): boolean {
  return run.status !== "completed" && run.stage !== "completed";
}

export function selectAutoRestoreAgentRunId(runs: AgentRun[]): string | null {
  for (const run of runs) {
    if (
      isResumableAgentRun(run) &&
      !isExcludedFromAutoRestore(run) &&
      isUnfinishedAgentRun(run)
    ) {
      return run.id;
    }
  }

  return null;
}

export function mapAgentSourceToResearchSource(source: AgentSource): ResearchSource {
  return {
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceType: source.source_type,
    publishedAt: source.published_at,
    supportsClaims: source.supports_claims,
    sortOrder: source.sort_order,
  };
}

export function buildResearchResultFromPersistedRun(input: {
  run: AgentRun;
  payload: PersistedResearchPayload;
  sources: ResearchSource[];
}): ResearchResult {
  const eligibility = resolveResearchGenerationEligibility({
    topic: input.run.topic,
    contentType: input.run.content_type,
    recommendedAngle: input.run.recommended_angle,
    payload: input.payload,
    sources: input.sources,
  });

  return {
    agentRunId: input.run.id,
    topic: input.run.topic,
    contentType: input.run.content_type,
    summary: input.run.research_summary ?? "",
    recommendedAngle: input.run.recommended_angle ?? "",
    primaryKeyword: input.run.primary_keyword ?? "",
    secondaryKeywords: input.run.secondary_keywords ?? [],
    keyFindings: input.payload.keyFindings,
    verifiedClaims: input.payload.verifiedClaims,
    uncertainClaims: input.payload.uncertainClaims,
    discoveryContexts: input.payload.discoveryContexts,
    sources: input.sources,
    relatedHCXContent: input.payload.relatedHCXContent,
    researchConfidence: input.payload.researchConfidence,
    researchQuality: input.payload.researchQuality,
    canGenerateDraft: eligibility.canGenerateDraft,
    researchSufficiency: eligibility.researchSufficiency,
    researchImprovementCount: input.payload.researchImprovementCount ?? 0,
  };
}

export interface LinkedContentRecord {
  id: string;
  title: string;
  slug: string;
  status: string;
  agent_run_id: string | null;
  category_id?: string | null;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
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
  cardStatusLabel: string;
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
    cardStatusLabel: input.cardStatusLabel,
    updatedAt: input.run.updated_at,
    createdAt: input.run.created_at,
  };
}

export function buildResumedAgentRunResult(input: {
  run: AgentRun;
  draft: GenerateDraftResult;
  latestReview: RunReviewResult | null;
  featuredImage: FeaturedImageState;
  latestReadiness: RunReadinessResult | null;
  latestPublish?: RunPublishResult | null;
  phase5HumanAcceptance?: Phase5HumanAcceptanceUiState | null;
  phase5AutomaticRevision?: AutomaticRevisionUiState | null;
  phase5DeterministicCleanup?: DeterministicCleanupUiState | null;
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
    latestReadiness: input.latestReadiness,
    latestPublish: input.latestPublish ?? null,
    phase5HumanAcceptance: input.phase5HumanAcceptance ?? null,
    phase5AutomaticRevision: input.phase5AutomaticRevision ?? null,
    phase5DeterministicCleanup: input.phase5DeterministicCleanup ?? null,
  };
}
