import { deriveCanGenerateDraft } from "./derive-can-generate.ts";
import {
  assessResearchSufficiency,
  type ResearchSufficiencyAssessment,
} from "./research-sufficiency-core.ts";
import type { PersistedResearchPayload } from "../generation/types.ts";
import type { ContentIntentProfile } from "./research-content-intent-core.ts";
import type {
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
} from "@/lib/agent/types";
import type { AgentContentType } from "@/lib/supabase/types";

export interface ResearchGenerationEligibility {
  canGenerateDraft: boolean;
  researchSufficiency: ResearchSufficiencyAssessment;
  baseCanGenerateDraft: boolean;
}

export function resolveResearchGenerationEligibility(input: {
  topic: string;
  contentType: AgentContentType;
  recommendedAngle?: string | null;
  payload: PersistedResearchPayload;
  sources: ResearchSource[];
}): ResearchGenerationEligibility {
  const researchSufficiency = assessResearchSufficiency({
    topic: input.topic,
    contentType: input.contentType,
    recommendedAngle: input.recommendedAngle,
    verifiedClaims: input.payload.verifiedClaims,
    uncertainClaims: input.payload.uncertainClaims,
    sources: input.sources,
    researchConfidence: input.payload.researchConfidence,
    researchQuality: input.payload.researchQuality,
    researchImprovementCount: input.payload.researchImprovementCount ?? 0,
    intentProfile: input.payload.contentIntentProfile ?? undefined,
  });

  const baseCanGenerateDraft = deriveCanGenerateDraft(
    input.payload.researchQuality,
    input.sources,
  );

  const canGenerateDraft =
    baseCanGenerateDraft &&
    input.payload.researchQuality !== "failed" &&
    researchSufficiency.status === "sufficient";

  return {
    canGenerateDraft,
    researchSufficiency,
    baseCanGenerateDraft,
  };
}

export function attachResearchSufficiencyToPayload(input: {
  topic: string;
  contentType: AgentContentType;
  recommendedAngle?: string | null;
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  sources: ResearchSource[];
  researchConfidence: ResearchConfidence;
  researchQuality: ResearchQuality;
  researchImprovementCount?: number;
  intentProfile?: ContentIntentProfile | PersistedResearchPayload["contentIntentProfile"];
}): {
  researchSufficiency: ResearchSufficiencyAssessment;
  canGenerateDraft: boolean;
} {
  const researchSufficiency = assessResearchSufficiency({
    topic: input.topic,
    contentType: input.contentType,
    recommendedAngle: input.recommendedAngle,
    verifiedClaims: input.verifiedClaims,
    uncertainClaims: input.uncertainClaims,
    sources: input.sources,
    researchConfidence: input.researchConfidence,
    researchQuality: input.researchQuality,
    researchImprovementCount: input.researchImprovementCount ?? 0,
    intentProfile: input.intentProfile ?? undefined,
  });

  const baseCanGenerateDraft = deriveCanGenerateDraft(
    input.researchQuality,
    input.sources,
  );

  const canGenerateDraft =
    baseCanGenerateDraft &&
    input.researchQuality !== "failed" &&
    researchSufficiency.status === "sufficient";

  return { researchSufficiency, canGenerateDraft };
}
