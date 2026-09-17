import "server-only";

import { analyzeContentAwareness } from "@/lib/agent/content-awareness";
import { loadSiteContentInventory } from "@/lib/agent/content-inventory";
import { buildPersistedResearchPayload } from "@/lib/agent/generation/research-payload";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { hasTavilyApiKey } from "@/lib/agent/research/env";
import {
  finalizeResearchEvidence,
  mergeResearchSourcesByUrl,
} from "@/lib/agent/research/research-finalize-core";
import { resolveResearchGenerationEligibility } from "@/lib/agent/research/research-generation-eligibility-core";
import {
  assessResearchSufficiency,
  MAX_RESEARCH_IMPROVEMENTS,
} from "@/lib/agent/research/research-sufficiency-core";
import { buildGapTargetedResearchQueries } from "@/lib/agent/research/search-queries";
import { searchAuthoritativeSourcesForQueries } from "@/lib/agent/research/tavily";
import { mapAgentSourceToResearchSource } from "@/lib/agent/resume/resume-core";
import type { ResearchResult } from "@/lib/agent/types";
import {
  deleteAgentSourcesForRun,
  getAgentRun,
  getAgentSources,
  insertAgentSources,
  updateAgentRun,
} from "@/lib/supabase/admin-agent";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export type ImproveResearchOutcome =
  | { ok: true; result: ResearchResult }
  | { ok: false; error: string };

function runHasLinkedDraft(run: {
  article_id: string | null;
  tutorial_id: string | null;
  lab_id: string | null;
}): boolean {
  return Boolean(run.article_id || run.tutorial_id || run.lab_id);
}

export async function runAgentResearchImprovement(input: {
  supabase: AdminSupabase;
  agentRunId: string;
}): Promise<ImproveResearchOutcome> {
  if (!hasTavilyApiKey()) {
    return {
      ok: false,
      error: "Research is unavailable because Tavily is not configured.",
    };
  }

  const loadedRun = await getAgentRun(input.supabase, input.agentRunId);
  if (!loadedRun.data || loadedRun.error) {
    return { ok: false, error: loadedRun.error ?? "Unable to load research run." };
  }

  const run = loadedRun.data;
  if (runHasLinkedDraft(run)) {
    return {
      ok: false,
      error: "Improve Research is only available before a draft is generated.",
    };
  }

  const payload = getResearchPayloadFromRun(run);
  if (!payload) {
    return { ok: false, error: "Research evidence is missing for this run." };
  }

  const sourcesResult = await getAgentSources(input.supabase, input.agentRunId);
  if (sourcesResult.error) {
    return { ok: false, error: sourcesResult.error };
  }

  const existingSources = sourcesResult.data.map(mapAgentSourceToResearchSource);
  const improvementCount = payload.researchImprovementCount ?? 0;

  if (improvementCount >= MAX_RESEARCH_IMPROVEMENTS) {
    return {
      ok: false,
      error: "Maximum research improvement attempts reached for this run.",
    };
  }

  const eligibility = resolveResearchGenerationEligibility({
    topic: run.topic,
    contentType: run.content_type,
    recommendedAngle: run.recommended_angle,
    payload,
    sources: existingSources,
  });

  if (eligibility.researchSufficiency.status === "sufficient") {
    return {
      ok: false,
      error: "Research already meets draft generation requirements.",
    };
  }

  if (eligibility.researchSufficiency.status === "blocked") {
    return {
      ok: false,
      error:
        "Research cannot be improved automatically. Review uncertain evidence or start a new topic.",
    };
  }

  const gapQueries = buildGapTargetedResearchQueries(
    run.topic,
    eligibility.researchSufficiency.missingIntentAreas,
  );
  const gapSearch = await searchAuthoritativeSourcesForQueries(gapQueries);
  if (!gapSearch.ok) {
    return {
      ok: false,
      error: gapSearch.error ?? "Unable to find additional authoritative sources.",
    };
  }

  const mergedSources = mergeResearchSourcesByUrl(
    existingSources,
    gapSearch.sources,
  );

  const inventory = await loadSiteContentInventory();
  const awareness = analyzeContentAwareness({
    contentType: run.content_type,
    topic: run.topic,
    inventory,
  });

  const nextImprovementCount = improvementCount + 1;
  const finalized = await finalizeResearchEvidence({
    runId: run.id,
    topic: run.topic,
    contentType: run.content_type,
    awareness,
    discoveredSources: mergedSources,
    researchImprovementCount: nextImprovementCount,
  });

  if (!finalized.ok) {
    return { ok: false, error: finalized.error };
  }

  const result = finalized.result;
  const deleted = await deleteAgentSourcesForRun(input.supabase, run.id);
  if (deleted.error) {
    return { ok: false, error: deleted.error };
  }

  const sourceInserts = result.sources.map((source, index) => ({
    agent_run_id: run.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher ?? null,
    source_type: source.sourceType ?? "secondary",
    published_at: source.publishedAt ?? null,
    accessed_at: new Date().toISOString(),
    supports_claims: source.supportsClaims ?? null,
    sort_order: source.sortOrder ?? index,
  }));

  const insertedSources = await insertAgentSources(input.supabase, sourceInserts);
  if (insertedSources.error) {
    return { ok: false, error: insertedSources.error };
  }

  const researchPayload = buildPersistedResearchPayload(result, awareness, {
    researchSufficiency: result.researchSufficiency ?? null,
    researchImprovementCount: nextImprovementCount,
  });

  const updated = await updateAgentRun(input.supabase, run.id, {
    research_summary: result.summary,
    recommended_angle: result.recommendedAngle,
    primary_keyword: result.primaryKeyword,
    secondary_keywords: result.secondaryKeywords,
    research_payload: researchPayload as unknown as Record<string, unknown>,
    stage: "planning",
    status: "ready",
    error_message: null,
  });

  if (!updated.data || updated.error) {
    return {
      ok: false,
      error: updated.error ?? "Unable to save improved research results.",
    };
  }

  return { ok: true, result };
}

export function previewResearchImprovementBlockedReason(input: {
  improvementCount: number;
  assessment: ReturnType<typeof assessResearchSufficiency>;
  hasLinkedDraft: boolean;
}): string | null {
  if (input.hasLinkedDraft) {
    return "Improve Research is only available before a draft is generated.";
  }

  if (input.improvementCount >= MAX_RESEARCH_IMPROVEMENTS) {
    return "Maximum research improvement attempts reached for this run.";
  }

  if (input.assessment.status === "sufficient") {
    return "Research already meets draft generation requirements.";
  }

  if (input.assessment.status === "blocked") {
    return "Research is blocked and cannot be improved automatically.";
  }

  return null;
}
