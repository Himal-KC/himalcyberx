import { lookupKevEntry } from "@/lib/agent/research/cisa-kev";
import {
  attachDiscoveryContext,
  buildDiscoveryContexts,
} from "@/lib/agent/research/discovery-context";
import {
  applyClaimLabelsToSources,
  extractClaims,
  rankSourcesByTopicRelevance,
} from "@/lib/agent/research/extract-claims";
import { extractCveIds, verifyCvesInTopic } from "@/lib/agent/research/cve";
import { fetchAuthoritativeSourcePages } from "@/lib/agent/research/fetch-source";
import { evaluateResearchQuality } from "@/lib/agent/research/quality";
import { attachResearchSufficiencyToPayload } from "@/lib/agent/research/research-generation-eligibility-core";
import { deriveContentIntentProfile } from "@/lib/agent/research/research-content-intent-core";
import {
  deriveResearchConfidence,
  synthesizeResearchBrief,
} from "@/lib/agent/research/synthesis";
import type { ContentAwarenessResult, ResearchResult } from "@/lib/agent/types";
import type { AgentContentType } from "@/lib/supabase/types";

export interface FinalizeResearchEvidenceInput {
  runId: string;
  topic: string;
  contentType: AgentContentType;
  awareness: ContentAwarenessResult;
  discoveredSources: import("@/lib/agent/types").ResearchSource[];
  researchImprovementCount?: number;
}

export async function finalizeResearchEvidence(
  input: FinalizeResearchEvidenceInput,
): Promise<
  | {
      ok: true;
      result: ResearchResult;
      researchImprovementCount: number;
    }
  | { ok: false; error: string; researchQuality?: string }
> {
  const cveIds = extractCveIds(input.topic);
  const cveResults = await verifyCvesInTopic(input.topic);
  const kevLookups = await Promise.all(
    cveIds.map(async (cveId) => ({
      cveId,
      result: await lookupKevEntry(cveId),
    })),
  );

  const definitiveCveMiss = cveResults.some(
    (result) => result.status === "not_found",
  );
  if (definitiveCveMiss) {
    const missing = cveResults
      .filter((result) => result.status === "not_found")
      .map((result) => result.cveId)
      .join(", ");

    return {
      ok: false,
      error: `${missing} could not be verified in NVD.`,
    };
  }

  const sourcesWithDiscovery = rankSourcesByTopicRelevance(
    input.topic,
    attachDiscoveryContext(input.discoveredSources),
  );
  const fetchedPages = await fetchAuthoritativeSourcePages(sourcesWithDiscovery);

  const claimExtraction = extractClaims({
    topic: input.topic,
    sources: sourcesWithDiscovery,
    fetchedPages,
    cveResults,
    kevLookups,
  });

  const sourcesWithClaims = applyClaimLabelsToSources(
    sourcesWithDiscovery,
    claimExtraction.sourceClaimMap,
  );

  const researchConfidence = deriveResearchConfidence({
    sources: sourcesWithClaims,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    unpromotedDiscoveryCount: claimExtraction.unpromotedDiscoveryCount,
    pageBackedClaimCount: claimExtraction.pageBackedClaimCount,
    highRelevanceClaimCount: claimExtraction.highRelevanceClaimCount,
  });

  const researchQuality = evaluateResearchQuality({
    sources: sourcesWithClaims,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    cveResults,
    researchConfidence,
    unpromotedDiscoveryCount: claimExtraction.unpromotedDiscoveryCount,
    pageBackedClaimCount: claimExtraction.pageBackedClaimCount,
    highRelevanceClaimCount: claimExtraction.highRelevanceClaimCount,
    successfulPageFetchCount: claimExtraction.successfulPageFetchCount,
    failedPageFetchCount: claimExtraction.failedPageFetchCount,
    topicHasCve: cveIds.length > 0,
  });

  const finalSynthesis = synthesizeResearchBrief({
    topic: input.topic,
    contentType: input.contentType,
    sources: sourcesWithClaims,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    awareness: input.awareness,
    unpromotedDiscoveryCount: claimExtraction.unpromotedDiscoveryCount,
    pageBackedClaimCount: claimExtraction.pageBackedClaimCount,
    highRelevanceClaimCount: claimExtraction.highRelevanceClaimCount,
    researchQuality,
  });

  const intentProfile = deriveContentIntentProfile({
    topic: input.topic,
    contentType: input.contentType,
    recommendedAngle: finalSynthesis.recommendedAngle,
  });

  const { canGenerateDraft, researchSufficiency } = attachResearchSufficiencyToPayload({
    topic: input.topic,
    contentType: input.contentType,
    recommendedAngle: finalSynthesis.recommendedAngle,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    sources: sourcesWithClaims,
    researchConfidence: finalSynthesis.researchConfidence,
    researchQuality,
    researchImprovementCount: input.researchImprovementCount ?? 0,
    intentProfile: {
      areas: intentProfile.areas.map((area) => ({
        id: area.id,
        label: area.label,
      })),
      topicAnchors: intentProfile.topicAnchors,
      topicPhrases: intentProfile.topicPhrases,
      audienceLabels: intentProfile.audienceLabels,
      expectsExplanation: intentProfile.expectsExplanation,
      expectsDefensiveGuidance: intentProfile.expectsDefensiveGuidance,
    },
  });

  if (researchQuality === "failed") {
    return {
      ok: false,
      error: finalSynthesis.summary,
      researchQuality,
    };
  }

  const relatedHCXContent = [
    ...input.awareness.similarContent,
    ...input.awareness.relatedContent,
  ];

  const result: ResearchResult = {
    agentRunId: input.runId,
    topic: input.topic,
    contentType: input.contentType,
    summary: finalSynthesis.summary,
    recommendedAngle: finalSynthesis.recommendedAngle,
    primaryKeyword: finalSynthesis.primaryKeyword,
    secondaryKeywords: finalSynthesis.secondaryKeywords,
    keyFindings: finalSynthesis.keyFindings,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    discoveryContexts: buildDiscoveryContexts(sourcesWithClaims),
    sources: sourcesWithClaims,
    relatedHCXContent,
    researchConfidence: finalSynthesis.researchConfidence,
    researchQuality,
    canGenerateDraft,
    researchSufficiency,
    researchImprovementCount: input.researchImprovementCount ?? 0,
    extractionStats: claimExtraction.extractionStats,
  };

  return {
    ok: true,
    result,
    researchImprovementCount: input.researchImprovementCount ?? 0,
  };
}

export function mergeResearchSourcesByUrl(
  existing: import("@/lib/agent/types").ResearchSource[],
  additional: import("@/lib/agent/types").ResearchSource[],
): import("@/lib/agent/types").ResearchSource[] {
  const merged = new Map<string, import("@/lib/agent/types").ResearchSource>();

  for (const source of [...existing, ...additional]) {
    const key = source.url.trim().toLowerCase();
    if (!key) {
      continue;
    }

    if (!merged.has(key)) {
      merged.set(key, source);
    }
  }

  return [...merged.values()];
}
