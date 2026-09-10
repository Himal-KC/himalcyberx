import type {
  ContentAwarenessResult,
  ResearchResult,
} from "@/lib/agent/types";
import type { PersistedResearchPayload } from "@/lib/agent/generation/types";
import type { AgentRun } from "@/lib/supabase/types";

export function buildPersistedResearchPayload(
  result: ResearchResult,
  contentAwareness?: ContentAwarenessResult | null,
): PersistedResearchPayload {
  return {
    keyFindings: result.keyFindings,
    verifiedClaims: result.verifiedClaims,
    uncertainClaims: result.uncertainClaims,
    discoveryContexts: result.discoveryContexts,
    relatedHCXContent: result.relatedHCXContent,
    researchConfidence: result.researchConfidence,
    researchQuality: result.researchQuality,
    canGenerateDraft: result.canGenerateDraft,
    contentAwareness: contentAwareness ?? null,
    categoryRecommendation:
      contentAwareness?.recommendedCategory?.name ?? null,
    categoryId: contentAwareness?.recommendedCategory?.id ?? null,
  };
}

export function parsePersistedResearchPayload(
  value: unknown,
): PersistedResearchPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    !Array.isArray(record.verifiedClaims) ||
    typeof record.researchQuality !== "string" ||
    typeof record.canGenerateDraft !== "boolean"
  ) {
    return null;
  }

  return value as PersistedResearchPayload;
}

export function getResearchPayloadFromRun(
  run: AgentRun,
): PersistedResearchPayload | null {
  return parsePersistedResearchPayload(run.research_payload);
}
