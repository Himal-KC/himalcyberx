"use server";

import { AGENT_CONTENT_TYPES } from "@/lib/agent/constants";
import {
  analyzeContentAwareness,
  isSafeToContinueAnalysis,
} from "@/lib/agent/content-awareness";
import { loadSiteContentInventory } from "@/lib/agent/content-inventory";
import { applyRecommendedArticleCategoryToDraft } from "@/lib/agent/category/apply-article-category";
import { runAgentGeneration } from "@/lib/agent/generation/engine";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import { runAgentReview } from "@/lib/agent/review/engine";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import { runDeterministicPreCheck } from "@/lib/agent/review/build-context-core";
import { buildPhase5WorkflowUiState } from "@/lib/agent/review/phase5-workflow-ui-core";
import { getCurrentDraftFingerprintFromSnapshot } from "@/lib/agent/review/fingerprint-core";
import { getAgentRun, getAgentSources } from "@/lib/supabase/admin-agent";
import { acceptAgentReviewFindings } from "@/lib/agent/review/accept-review";
import { runPhase5AutomaticSafeRevision } from "@/lib/agent/review/automatic-revision-engine";
import { runDeterministicAgentDraftCleanup } from "@/lib/agent/content/deterministic-cleanup-engine";
import type { AutomaticRevisionUiState } from "@/lib/agent/review/automatic-revision-core";
import type { DeterministicCleanupUiState } from "@/lib/agent/content/deterministic-cleanup-core";
import type { RunReviewResult } from "@/lib/agent/review/types";
import type { Phase5HumanAcceptanceUiState } from "@/lib/agent/review/human-acceptance-core";
import { resumePersistedAgentRun } from "@/lib/agent/resume/resume-run";
import { runAgentFeaturedImageGeneration } from "@/lib/agent/image/engine";
import type { GeneratedFeaturedImageResult } from "@/lib/agent/image/types";
import { runAgentReadinessEvaluation } from "@/lib/agent/readiness/engine";
import type { RunReadinessResult } from "@/lib/agent/readiness/types";
import { runAgentContentPublication } from "@/lib/agent/publish/engine";
import type { PublishAgentContentState } from "@/lib/agent/publish/types";
import {
  isValidAgentRunId,
  type ResumedAgentRunResult,
} from "@/lib/agent/resume/resume-core";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import { runAgentResearch } from "@/lib/agent/research/engine";
import type {
  ContentDuplicateRisk,
  ContentSimilarityMatch,
  RecommendedCategory,
  ResearchResult,
} from "@/lib/agent/types";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import type { AgentContentType } from "@/lib/supabase/types";
import { getAuthenticatedServerClient } from "@/lib/supabase/admin-session";

const MIN_TOPIC_LENGTH = 8;
const MAX_TOPIC_LENGTH = 500;

export interface AgentTopicAnalysisMatch extends ContentSimilarityMatch {
  status: string | null;
  adminHref: string;
}

export interface AnalyzeAgentTopicState {
  success?: boolean;
  error?: string;
  contentType?: AgentContentType;
  topic?: string;
  duplicateRisk?: ContentDuplicateRisk;
  recommendedCategory?: RecommendedCategory;
  contentGapSummary?: string | null;
  similarContent?: AgentTopicAnalysisMatch[];
  relatedContent?: AgentTopicAnalysisMatch[];
  safeToContinue?: boolean;
}

function buildAdminHref(
  contentType: AgentContentType,
  id: string,
): string {
  switch (contentType) {
    case "article":
      return `/admin/articles/${id}/edit`;
    case "tutorial":
      return `/admin/tutorials/${id}/edit`;
    case "lab":
      return `/admin/labs/${id}/edit`;
  }
}

function enrichMatch(
  match: ContentSimilarityMatch,
  inventory: Awaited<ReturnType<typeof loadSiteContentInventory>>,
): AgentTopicAnalysisMatch {
  let status: string | null = null;

  if (match.contentType === "article") {
    status =
      inventory.articles.find((item) => item.id === match.id)?.status ?? null;
  } else if (match.contentType === "tutorial") {
    status =
      inventory.tutorials.find((item) => item.id === match.id)?.status ?? null;
  } else {
    status = inventory.labs.find((item) => item.id === match.id)?.status ?? null;
  }

  return {
    ...match,
    status,
    adminHref: buildAdminHref(match.contentType, match.id),
  };
}

export interface ResearchAgentTopicState {
  success?: boolean;
  error?: string;
  research?: ResearchResult;
}

export interface GenerateAgentDraftState {
  success?: boolean;
  error?: string;
  draft?: GenerateDraftResult;
}

export interface ReviewAgentDraftState {
  success?: boolean;
  error?: string;
  review?: RunReviewResult;
  phase5HumanAcceptance?: Phase5HumanAcceptanceUiState;
  phase5AutomaticRevision?: AutomaticRevisionUiState;
}

export interface ApplyRecommendedArticleCategoryState {
  success?: boolean;
  error?: string;
  categoryId?: string;
  categoryName?: string;
}

export interface ResumeAgentRunState {
  success?: boolean;
  error?: string;
  resumed?: ResumedAgentRunResult;
}

export interface GenerateAgentFeaturedImageState {
  success?: boolean;
  error?: string;
  image?: GeneratedFeaturedImageResult;
}

export interface EvaluateAgentReadinessState {
  success?: boolean;
  error?: string;
  readiness?: RunReadinessResult;
}

export interface AcceptAgentReviewFindingsState {
  success?: boolean;
  error?: string;
  readiness?: RunReadinessResult;
  phase5HumanAcceptance?: Phase5HumanAcceptanceUiState;
}

export interface ApplyPhase5AutomaticRevisionState {
  success?: boolean;
  error?: string;
  review?: RunReviewResult;
  changeSummary?: string[];
  phase5AutomaticRevision?: AutomaticRevisionUiState;
}

export interface ApplyDeterministicCleanupState {
  success?: boolean;
  error?: string;
  review?: RunReviewResult;
  changeSummary?: string[];
  phase5DeterministicCleanup?: DeterministicCleanupUiState;
}

export type { PublishAgentContentState };

export async function researchAgentTopic(
  _prevState: ResearchAgentTopicState,
  formData: FormData,
): Promise<ResearchAgentTopicState> {
  const auth = await getAuthenticatedServerClient("researchAgentTopic");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const allowed = await enforceRateLimit("agent-research", auth.user.id);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGES.agentResearch };
  }

  const contentType = String(formData.get("contentType") ?? "").trim() as AgentContentType;
  const topic = String(formData.get("topic") ?? "").trim();

  if (!AGENT_CONTENT_TYPES.includes(contentType)) {
    return { error: "Please select Article, Tutorial, or Cyber Lab." };
  }

  if (topic.length < MIN_TOPIC_LENGTH) {
    return {
      error: `Topic must be at least ${MIN_TOPIC_LENGTH} characters.`,
    };
  }

  if (topic.length > MAX_TOPIC_LENGTH) {
    return {
      error: `Topic must be ${MAX_TOPIC_LENGTH} characters or fewer.`,
    };
  }

  const inventory = await loadSiteContentInventory();
  const awareness = analyzeContentAwareness({
    contentType,
    topic,
    inventory,
  });

  if (!isSafeToContinueAnalysis(awareness.duplicateRisk)) {
    return {
      error:
        "High duplicate risk detected. Review similar content before starting research.",
    };
  }

  const outcome = await runAgentResearch({
    supabase: auth.supabase,
    contentType,
    topic,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    research: outcome.result,
  };
}

export async function generateAgentDraft(
  _prevState: GenerateAgentDraftState,
  formData: FormData,
): Promise<GenerateAgentDraftState> {
  const auth = await getAuthenticatedServerClient("generateAgentDraft");

  if (!auth.ok) {
    return { error: auth.error };
  }

  if (!hasOpenAiApiKey()) {
    return { error: "OpenAI is not configured." };
  }

  const allowed = await enforceRateLimit("agent-generation", auth.user.id);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGES.agentGeneration };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!agentRunId) {
    return { error: "A research run is required before generating a draft." };
  }

  const outcome = await runAgentGeneration({
    supabase: auth.supabase,
    agentRunId,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    draft: outcome.result,
  };
}

export async function reviewAgentDraft(
  _prevState: ReviewAgentDraftState,
  formData: FormData,
): Promise<ReviewAgentDraftState> {
  const auth = await getAuthenticatedServerClient("reviewAgentDraft");

  if (!auth.ok) {
    return { error: auth.error };
  }

  if (!hasOpenAiApiKey()) {
    return { error: "OpenAI is not configured." };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!agentRunId) {
    return { error: "A research run is required before running review." };
  }

  const outcome = await runAgentReview({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  const loadedRun = await getAgentRun(auth.supabase, agentRunId);
  if (!loadedRun.data) {
    return { error: "Unable to reload run after review." };
  }

  const payload = getResearchPayloadFromRun(loadedRun.data);
  if (!payload) {
    return { error: "Research evidence is insufficient." };
  }

  const snapshotResult = await loadReviewDraftSnapshot(auth.supabase, loadedRun.data);
  if (!snapshotResult.snapshot) {
    return { error: snapshotResult.error ?? "Unable to reload draft after review." };
  }

  const sourcesResult = await getAgentSources(auth.supabase, agentRunId);
  if (sourcesResult.error) {
    return { error: sourcesResult.error };
  }

  const currentDraftFingerprint = getCurrentDraftFingerprintFromSnapshot(
    snapshotResult.snapshot,
  );
  const groundingAudit = runDeterministicPreCheck({
    draftSnapshot: snapshotResult.snapshot,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls: sourcesResult.data.map((source) => source.url),
    approvedInternalContent: payload.relatedHCXContent.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      slug: item.slug,
    })),
  });

  const runMetadata =
    loadedRun.data.generation_metadata &&
    typeof loadedRun.data.generation_metadata === "object"
      ? (loadedRun.data.generation_metadata as Record<string, unknown>)
      : null;

  const workflow = buildPhase5WorkflowUiState({
    agentRunId,
    review: outcome.result.review,
    currentDraftFingerprint,
    groundingAudit,
    metadata: runMetadata,
    snapshot: snapshotResult.snapshot,
  });

  return {
    success: true,
    review: outcome.result,
    phase5HumanAcceptance: workflow.phase5HumanAcceptance ?? undefined,
    phase5AutomaticRevision: workflow.phase5AutomaticRevision ?? undefined,
  };
}

export async function applyRecommendedArticleCategory(
  _prevState: ApplyRecommendedArticleCategoryState,
  formData: FormData,
): Promise<ApplyRecommendedArticleCategoryState> {
  const auth = await getAuthenticatedServerClient("applyRecommendedArticleCategory");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await applyRecommendedArticleCategoryToDraft({
    supabase: auth.supabase,
    agentRunId,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    categoryId: outcome.categoryId,
    categoryName: outcome.categoryName,
  };
}

export async function resumeAgentRun(
  _prevState: ResumeAgentRunState,
  formData: FormData,
): Promise<ResumeAgentRunState> {
  const auth = await getAuthenticatedServerClient("resumeAgentRun");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await resumePersistedAgentRun(auth.supabase, agentRunId);
  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    resumed: outcome.result,
  };
}

export async function generateAgentFeaturedImage(
  _prevState: GenerateAgentFeaturedImageState,
  formData: FormData,
): Promise<GenerateAgentFeaturedImageState> {
  const auth = await getAuthenticatedServerClient("generateAgentFeaturedImage");

  if (!auth.ok) {
    return { error: auth.error };
  }

  if (!hasOpenAiApiKey()) {
    return { error: "OpenAI is not configured." };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const forceRegenerate = String(formData.get("forceRegenerate") ?? "") === "1";

  const outcome = await runAgentFeaturedImageGeneration({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
    forceRegenerate,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    image: outcome.result,
  };
}

export async function evaluateAgentReadiness(
  _prevState: EvaluateAgentReadinessState,
  formData: FormData,
): Promise<EvaluateAgentReadinessState> {
  const auth = await getAuthenticatedServerClient("evaluateAgentReadiness");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await runAgentReadinessEvaluation({
    supabase: auth.supabase,
    agentRunId,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    readiness: outcome.result,
  };
}

export async function acceptAgentReviewFindingsAction(
  _prevState: AcceptAgentReviewFindingsState,
  formData: FormData,
): Promise<AcceptAgentReviewFindingsState> {
  const auth = await getAuthenticatedServerClient("acceptAgentReviewFindings");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await acceptAgentReviewFindings({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    readiness: outcome.readiness,
    phase5HumanAcceptance: {
      accepted: true,
      valid: true,
      resolvedAt: outcome.acceptance.resolvedAt,
      resolvedBy: outcome.acceptance.resolvedBy,
      canAccept: false,
      acceptBlockedReason:
        "Review findings are already accepted for the current draft.",
    },
  };
}

export async function applyPhase5AutomaticSafeRevisionAction(
  _prevState: ApplyPhase5AutomaticRevisionState,
  formData: FormData,
): Promise<ApplyPhase5AutomaticRevisionState> {
  const auth = await getAuthenticatedServerClient("applyPhase5AutomaticSafeRevision");

  if (!auth.ok) {
    return { error: auth.error };
  }

  if (!hasOpenAiApiKey()) {
    return { error: "OpenAI is not configured." };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await runPhase5AutomaticSafeRevision({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    review: outcome.review,
    changeSummary: outcome.changeSummary,
    phase5AutomaticRevision: {
      status: "not_needed",
      reason: "Safe revisions were applied for the current review.",
      canApply: false,
      attempts: 1,
      maxAttempts: 2,
      changeSummaryPreview: outcome.changeSummary,
      lastRevisedAt: new Date().toISOString(),
      previousFingerprint: outcome.previousFingerprint,
      revisedFingerprint: outcome.revisedFingerprint,
    },
  };
}

export async function applyDeterministicAgentDraftCleanupAction(
  _prevState: ApplyDeterministicCleanupState,
  formData: FormData,
): Promise<ApplyDeterministicCleanupState> {
  const auth = await getAuthenticatedServerClient("applyDeterministicAgentDraftCleanup");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await runDeterministicAgentDraftCleanup({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    review: outcome.review,
    changeSummary: outcome.changeSummary,
    phase5DeterministicCleanup: {
      canApply: false,
      reason: "Deterministic cleanup was applied for the current draft.",
      previewSummary: [],
    },
  };
}

export async function publishAgentContent(
  _prevState: PublishAgentContentState,
  formData: FormData,
): Promise<PublishAgentContentState> {
  const auth = await getAuthenticatedServerClient("publishAgentContent");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const agentRunId = String(formData.get("agentRunId") ?? "").trim();
  if (!isValidAgentRunId(agentRunId)) {
    return { error: "Invalid agent run ID." };
  }

  const outcome = await runAgentContentPublication({
    supabase: auth.supabase,
    agentRunId,
  });

  if (!outcome.result.success) {
    return {
      error: outcome.result.message,
      publish: outcome.result,
    };
  }

  return {
    success: true,
    publish: outcome.result,
  };
}

export async function analyzeAgentTopic(
  _prevState: AnalyzeAgentTopicState,
  formData: FormData,
): Promise<AnalyzeAgentTopicState> {
  const auth = await getAuthenticatedServerClient("analyzeAgentTopic");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const contentType = String(formData.get("contentType") ?? "").trim() as AgentContentType;
  const topic = String(formData.get("topic") ?? "").trim();

  if (!AGENT_CONTENT_TYPES.includes(contentType)) {
    return { error: "Please select Article, Tutorial, or Cyber Lab." };
  }

  if (topic.length < MIN_TOPIC_LENGTH) {
    return {
      error: `Topic must be at least ${MIN_TOPIC_LENGTH} characters.`,
    };
  }

  if (topic.length > MAX_TOPIC_LENGTH) {
    return {
      error: `Topic must be ${MAX_TOPIC_LENGTH} characters or fewer.`,
    };
  }

  const inventory = await loadSiteContentInventory();
  const awareness = analyzeContentAwareness({
    contentType,
    topic,
    inventory,
  });

  return {
    success: true,
    contentType,
    topic,
    duplicateRisk: awareness.duplicateRisk,
    recommendedCategory: awareness.recommendedCategory,
    contentGapSummary: awareness.contentGapSummary,
    similarContent: awareness.similarContent.map((match) =>
      enrichMatch(match, inventory),
    ),
    relatedContent: awareness.relatedContent.map((match) =>
      enrichMatch(match, inventory),
    ),
    safeToContinue: isSafeToContinueAnalysis(awareness.duplicateRisk),
  };
}
