import "server-only";

import { analyzeContentAwareness } from "@/lib/agent/content-awareness";
import { loadSiteContentInventory } from "@/lib/agent/content-inventory";
import { lookupKevEntry } from "@/lib/agent/research/cisa-kev";
import {
  attachDiscoveryContext,
  buildDiscoveryContexts,
} from "@/lib/agent/research/discovery-context";
import { deriveCanGenerateDraft } from "@/lib/agent/research/derive-can-generate";
import {
  applyClaimLabelsToSources,
  extractClaims,
  rankSourcesByTopicRelevance,
} from "@/lib/agent/research/extract-claims";
import { extractCveIds, verifyCvesInTopic } from "@/lib/agent/research/cve";
import { hasTavilyApiKey } from "@/lib/agent/research/env";
import { fetchAuthoritativeSourcePages } from "@/lib/agent/research/fetch-source";
import { evaluateResearchQuality } from "@/lib/agent/research/quality";
import {
  deriveResearchConfidence,
  synthesizeResearchBrief,
} from "@/lib/agent/research/synthesis";
import { searchAuthoritativeSources } from "@/lib/agent/research/tavily";
import type {
  ContentAwarenessResult,
  ResearchResult,
} from "@/lib/agent/types";
import type { AgentContentType } from "@/lib/supabase/types";
import {
  createAgentRun,
  insertAgentSources,
  updateAgentRun,
} from "@/lib/supabase/admin-agent";
import { createClient } from "@/lib/supabase/server";

export type ResearchStage =
  | "creating_run"
  | "finding_sources"
  | "verifying_evidence"
  | "building_brief";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface RunResearchInput {
  supabase: AdminSupabase;
  contentType: AgentContentType;
  topic: string;
  onStage?: (stage: ResearchStage) => void;
}

export type RunResearchOutcome =
  | { ok: true; result: ResearchResult }
  | { ok: false; error: string; agentRunId?: string };

function sanitizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

async function failRun(
  supabase: AdminSupabase,
  runId: string,
  message: string,
): Promise<void> {
  await updateAgentRun(supabase, runId, {
    status: "failed",
    stage: "failed",
    error_message: sanitizeErrorMessage(message),
    completed_at: new Date().toISOString(),
  });
}

export async function runAgentResearch(
  input: RunResearchInput,
): Promise<RunResearchOutcome> {
  const { supabase, contentType, topic, onStage } = input;

  if (!hasTavilyApiKey()) {
    return {
      ok: false,
      error: "Research is unavailable because Tavily is not configured.",
    };
  }

  onStage?.("creating_run");

  const startedAt = new Date().toISOString();
  const created = await createAgentRun(supabase, {
    topic,
    content_type: contentType,
    status: "running",
    stage: "research",
    fact_check_status: "pending",
    started_at: startedAt,
  });

  if (!created.data || created.error) {
    return {
      ok: false,
      error: created.error ?? "Unable to start research run.",
    };
  }

  const runId = created.data.id;

  const inventory = await loadSiteContentInventory();
  const awareness: ContentAwarenessResult = analyzeContentAwareness({
    contentType,
    topic,
    inventory,
  });

  onStage?.("finding_sources");

  const tavily = await searchAuthoritativeSources(topic);
  if (!tavily.ok) {
    await failRun(
      supabase,
      runId,
      tavily.error ?? "Unable to find authoritative sources.",
    );
    return {
      ok: false,
      error: tavily.error ?? "Unable to find authoritative sources.",
      agentRunId: runId,
    };
  }

  if (tavily.sources.length === 0) {
    await failRun(
      supabase,
      runId,
      "No authoritative cybersecurity sources were found for this topic.",
    );
    return {
      ok: false,
      error: "No authoritative cybersecurity sources were found for this topic.",
      agentRunId: runId,
    };
  }

  onStage?.("verifying_evidence");

  const cveIds = extractCveIds(topic);
  const cveResults = await verifyCvesInTopic(topic);
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

    await failRun(
      supabase,
      runId,
      `${missing} could not be verified in NVD.`,
    );

    return {
      ok: false,
      error: `${missing} could not be verified in NVD.`,
      agentRunId: runId,
    };
  }

  onStage?.("building_brief");

  const sourcesWithDiscovery = rankSourcesByTopicRelevance(
    topic,
    attachDiscoveryContext(tavily.sources),
  );
  const fetchedPages = await fetchAuthoritativeSourcePages(sourcesWithDiscovery);

  const claimExtraction = extractClaims({
    topic,
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
    topic,
    contentType,
    sources: sourcesWithClaims,
    verifiedClaims: claimExtraction.verifiedClaims,
    uncertainClaims: claimExtraction.uncertainClaims,
    awareness,
    unpromotedDiscoveryCount: claimExtraction.unpromotedDiscoveryCount,
    pageBackedClaimCount: claimExtraction.pageBackedClaimCount,
    highRelevanceClaimCount: claimExtraction.highRelevanceClaimCount,
    researchQuality,
  });

  const canGenerateDraft = deriveCanGenerateDraft(
    researchQuality,
    sourcesWithClaims,
  );

  if (researchQuality === "failed") {
    await failRun(
      supabase,
      runId,
      finalSynthesis.summary,
    );
    return {
      ok: false,
      error: finalSynthesis.summary,
      agentRunId: runId,
    };
  }

  const sourceInserts = sourcesWithClaims.map((source, index) => ({
    agent_run_id: runId,
    title: source.title,
    url: source.url,
    publisher: source.publisher ?? null,
    source_type: source.sourceType ?? "secondary",
    published_at: source.publishedAt ?? null,
    accessed_at: new Date().toISOString(),
    supports_claims: source.supportsClaims ?? null,
    sort_order: source.sortOrder ?? index,
  }));

  const insertedSources = await insertAgentSources(supabase, sourceInserts);
  if (insertedSources.error) {
    await failRun(supabase, runId, insertedSources.error);
    return {
      ok: false,
      error: insertedSources.error,
      agentRunId: runId,
    };
  }

  const updated = await updateAgentRun(supabase, runId, {
    research_summary: finalSynthesis.summary,
    recommended_angle: finalSynthesis.recommendedAngle,
    primary_keyword: finalSynthesis.primaryKeyword,
    secondary_keywords: finalSynthesis.secondaryKeywords,
    stage: "planning",
    status: "ready",
    error_message: null,
  });

  if (!updated.data || updated.error) {
    await failRun(supabase, runId, updated.error ?? "Unable to save research results.");
    return {
      ok: false,
      error: updated.error ?? "Unable to save research results.",
      agentRunId: runId,
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[agent-research] extraction stats", claimExtraction.extractionStats);
  }

  const relatedHCXContent = [
    ...awareness.similarContent,
    ...awareness.relatedContent,
  ];

  const result: ResearchResult = {
    agentRunId: runId,
    topic,
    contentType,
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
    extractionStats: claimExtraction.extractionStats,
  };

  return { ok: true, result };
}
