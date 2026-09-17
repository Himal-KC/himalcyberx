import type {
  ContentAwarenessResult,
  ResearchResult,
} from "@/lib/agent/types";
import type { PersistedResearchPayload } from "@/lib/agent/generation/types";
import { deriveContentIntentProfile } from "../research/research-content-intent-core.ts";
import type { AgentRun } from "@/lib/supabase/types";

export function buildPersistedResearchPayload(
  result: ResearchResult,
  contentAwareness?: ContentAwarenessResult | null,
  extras?: {
    contentIntentProfile?: PersistedResearchPayload["contentIntentProfile"];
    researchSufficiency?: PersistedResearchPayload["researchSufficiency"];
    researchImprovementCount?: number;
  },
): PersistedResearchPayload {
  const intentProfile =
    extras?.contentIntentProfile ??
    serializeContentIntentProfile(
      deriveContentIntentProfile({
        topic: result.topic,
        contentType: result.contentType,
        recommendedAngle: result.recommendedAngle,
      }),
    );

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
    contentIntentProfile: intentProfile,
    researchSufficiency: extras?.researchSufficiency ?? result.researchSufficiency ?? null,
    researchImprovementCount:
      extras?.researchImprovementCount ?? result.researchImprovementCount ?? 0,
  };
}

function serializeContentIntentProfile(
  profile: ReturnType<typeof deriveContentIntentProfile>,
): PersistedResearchPayload["contentIntentProfile"] {
  return {
    areas: profile.areas.map((area) => ({ id: area.id, label: area.label })),
    topicAnchors: profile.topicAnchors,
    topicPhrases: profile.topicPhrases,
    audienceLabels: profile.audienceLabels,
    expectsExplanation: profile.expectsExplanation,
    expectsDefensiveGuidance: profile.expectsDefensiveGuidance,
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
