import "server-only";

import { analyzeContentAwareness } from "@/lib/agent/content-awareness";
import { loadSiteContentInventory } from "@/lib/agent/content-inventory";
import { buildPersistedResearchPayload } from "@/lib/agent/generation/research-payload";
import { hasTavilyApiKey } from "@/lib/agent/research/env";
import { finalizeResearchEvidence } from "@/lib/agent/research/research-finalize-core";
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

  onStage?.("building_brief");

  const finalized = await finalizeResearchEvidence({
    runId,
    topic,
    contentType,
    awareness,
    discoveredSources: tavily.sources,
    researchImprovementCount: 0,
  });

  if (!finalized.ok) {
    await failRun(supabase, runId, finalized.error);
    return {
      ok: false,
      error: finalized.error,
      agentRunId: runId,
    };
  }

  const result = finalized.result;

  const sourceInserts = result.sources.map((source, index) => ({
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

  const researchPayload = buildPersistedResearchPayload(result, awareness, {
    researchSufficiency: result.researchSufficiency ?? null,
    researchImprovementCount: result.researchImprovementCount ?? 0,
  });

  const updated = await updateAgentRun(supabase, runId, {
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
    await failRun(supabase, runId, updated.error ?? "Unable to save research results.");
    return {
      ok: false,
      error: updated.error ?? "Unable to save research results.",
      agentRunId: runId,
    };
  }

  if (process.env.NODE_ENV === "development" && result.extractionStats) {
    console.info("[agent-research] extraction stats", result.extractionStats);
  }

  return { ok: true, result };
}
