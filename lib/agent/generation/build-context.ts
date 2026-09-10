import type { AgentContentType, AgentRun } from "@/lib/supabase/types";
import type { AgentSource } from "@/lib/supabase/types";
import type { PersistedResearchPayload } from "@/lib/agent/generation/types";

export interface GroundedGenerationContext {
  topic: string;
  contentType: AgentContentType;
  researchSummary: string;
  recommendedAngle: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  researchQuality: string;
  researchConfidence: string;
  canGenerateDraft: boolean;
  verifiedClaims: Array<{
    id: string;
    type: string;
    statement: string;
    confidence: string;
    relevanceLevel?: string;
    sourceUrls: string[];
  }>;
  uncertainClaims: Array<{
    label: string;
    reason: string;
  }>;
  keyFindings: string[];
  sources: Array<{
    title: string;
    url: string;
    publisher: string | null;
    sourceType: string;
  }>;
  allowedSourceUrls: string[];
  relatedHCXContent: Array<{
    contentType: AgentContentType;
    id: string;
    title: string;
    slug: string;
    similarityScore: number;
    reason: string;
  }>;
  contentGapSummary: string | null;
  categoryRecommendation: string | null;
  categoryId: string | null;
  difficulty: string | null;
}

export function buildGroundedGenerationContext({
  run,
  payload,
  sources,
}: {
  run: AgentRun;
  payload: PersistedResearchPayload;
  sources: AgentSource[];
}): GroundedGenerationContext {
  const allowedSourceUrls = sources.map((source) => source.url);

  return {
    topic: run.topic,
    contentType: run.content_type,
    researchSummary: run.research_summary ?? "",
    recommendedAngle: run.recommended_angle ?? "",
    primaryKeyword: run.primary_keyword ?? payload.verifiedClaims[0]?.statement ?? run.topic,
    secondaryKeywords: run.secondary_keywords ?? [],
    researchQuality: payload.researchQuality,
    researchConfidence: payload.researchConfidence,
    canGenerateDraft: payload.canGenerateDraft,
    verifiedClaims: payload.verifiedClaims.map((claim) => ({
      id: claim.id,
      type: claim.type,
      statement: claim.statement,
      confidence: claim.confidence,
      relevanceLevel: claim.relevanceLevel,
      sourceUrls: claim.sources.map((source) => source.url),
    })),
    uncertainClaims: payload.uncertainClaims.map((claim) => ({
      label: claim.label,
      reason: claim.reason,
    })),
    keyFindings: payload.keyFindings,
    sources: sources.map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      sourceType: source.source_type,
    })),
    allowedSourceUrls,
    relatedHCXContent: payload.relatedHCXContent.map((item) => ({
      contentType: item.contentType,
      id: item.id,
      title: item.title,
      slug: item.slug,
      similarityScore: item.similarityScore,
      reason: item.reason,
    })),
    contentGapSummary:
      payload.contentAwareness?.contentGapSummary ??
      null,
    categoryRecommendation:
      payload.categoryRecommendation ??
      payload.contentAwareness?.recommendedCategory?.name ??
      null,
    categoryId:
      payload.categoryId ??
      payload.contentAwareness?.recommendedCategory?.id ??
      null,
    difficulty: payload.difficulty ?? null,
  };
}

export function serializeContextForPrompt(
  context: GroundedGenerationContext,
): string {
  return JSON.stringify(
    {
      topic: context.topic,
      contentType: context.contentType,
      researchSummary: context.researchSummary,
      recommendedAngle: context.recommendedAngle,
      primaryKeyword: context.primaryKeyword,
      secondaryKeywords: context.secondaryKeywords,
      researchQuality: context.researchQuality,
      researchConfidence: context.researchConfidence,
      keyFindings: context.keyFindings,
      verifiedClaims: context.verifiedClaims,
      uncertainClaims: context.uncertainClaims,
      sources: context.sources,
      allowedSourceUrls: context.allowedSourceUrls,
      relatedHCXContent: context.relatedHCXContent,
      contentGapSummary: context.contentGapSummary,
      categoryRecommendation: context.categoryRecommendation,
      categoryId: context.categoryId,
      difficulty: context.difficulty,
    },
    null,
    2,
  );
}
