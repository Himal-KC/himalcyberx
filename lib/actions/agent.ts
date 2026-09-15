"use server";

import { AGENT_CONTENT_TYPES } from "@/lib/agent/constants";
import {
  analyzeContentAwareness,
  isSafeToContinueAnalysis,
} from "@/lib/agent/content-awareness";
import { loadSiteContentInventory } from "@/lib/agent/content-inventory";
import { runAgentGeneration } from "@/lib/agent/generation/engine";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import { runAgentReview } from "@/lib/agent/review/engine";
import type { RunReviewResult } from "@/lib/agent/review/types";
import { resumePersistedAgentRun } from "@/lib/agent/resume/resume-run";
import { runAgentFeaturedImageGeneration } from "@/lib/agent/image/engine";
import type { GeneratedFeaturedImageResult } from "@/lib/agent/image/types";
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

  return {
    success: true,
    review: outcome.result,
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

  const outcome = await runAgentFeaturedImageGeneration({
    supabase: auth.supabase,
    agentRunId,
    adminUserId: auth.user.id,
  });

  if (!outcome.ok) {
    return { error: outcome.error };
  }

  return {
    success: true,
    image: outcome.result,
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
