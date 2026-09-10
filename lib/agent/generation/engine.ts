import "server-only";

import { auditGrounding } from "@/lib/agent/generation/grounding-audit";
import {
  buildGroundedGenerationContext,
} from "@/lib/agent/generation/build-context";
import {
  generateDraftWithOpenAi,
  type OpenAiGenerateFn,
} from "@/lib/agent/generation/generate";
import { assessDraftQuality } from "@/lib/agent/generation/quality-score";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import {
  getExistingDraftFromRun,
  saveGeneratedDraft,
} from "@/lib/agent/generation/save-draft";
import type {
  GenerateDraftResult,
  GenerationMetadata,
} from "@/lib/agent/generation/types";
import {
  filterSourceMappings,
  sanitizeGeneratedRichFields,
  validateGeneratedDraftStructure,
} from "@/lib/agent/generation/validate-output";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import { deriveCanGenerateDraft } from "@/lib/agent/research/derive-can-generate";
import {
  getAgentRun,
  getAgentSources,
  updateAgentRun,
} from "@/lib/supabase/admin-agent";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export type GenerationStage =
  | "loading_research"
  | "planning"
  | "writing"
  | "validating"
  | "saving";

export interface RunGenerationInput {
  supabase: AdminSupabase;
  agentRunId: string;
  onStage?: (stage: GenerationStage) => void;
  generateFn?: OpenAiGenerateFn;
}

export type RunGenerationOutcome =
  | { ok: true; result: GenerateDraftResult }
  | { ok: false; error: string };

function sanitizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

async function failGeneration(
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

export async function runAgentGeneration(
  input: RunGenerationInput,
): Promise<RunGenerationOutcome> {
  const { supabase, agentRunId, onStage, generateFn = generateDraftWithOpenAi } =
    input;

  if (!hasOpenAiApiKey()) {
    return { ok: false, error: "OpenAI is not configured." };
  }

  onStage?.("loading_research");

  const loadedRun = await getAgentRun(supabase, agentRunId);
  if (!loadedRun.data || loadedRun.error) {
    return { ok: false, error: loadedRun.error ?? "Unable to load research run." };
  }

  const run = loadedRun.data;
  const existingDraft = getExistingDraftFromRun(run);
  if (existingDraft) {
    return { ok: true, result: existingDraft };
  }

  const payload = getResearchPayloadFromRun(run);
  if (!payload) {
    return {
      ok: false,
      error: "Research evidence is insufficient.",
    };
  }

  const sourcesResult = await getAgentSources(supabase, agentRunId);
  if (sourcesResult.error) {
    return { ok: false, error: sourcesResult.error };
  }

  const canGenerate = deriveCanGenerateDraft(
    payload.researchQuality,
    sourcesResult.data.map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      sourceType: source.source_type,
    })),
  );

  if (!canGenerate || payload.researchQuality === "failed") {
    return {
      ok: false,
      error: "Research evidence is insufficient.",
    };
  }

  await updateAgentRun(supabase, agentRunId, {
    status: "running",
    stage: "writing",
    error_message: null,
  });

  onStage?.("planning");

  const context = buildGroundedGenerationContext({
    run,
    payload,
    sources: sourcesResult.data,
  });

  onStage?.("writing");

  const generated = await generateFn(context);
  if (!generated.draft || generated.error) {
    if (generated.error === "Generation is temporarily unavailable.") {
      console.error("[agent-generation:engine]", {
        agentRunId,
        contentType: run.content_type,
        stage: "writing",
        outcome: generated.error,
      });
    }

    await failGeneration(
      supabase,
      agentRunId,
      generated.error ?? "Generated output failed validation.",
    );
    return {
      ok: false,
      error: generated.error ?? "Generated output failed validation.",
    };
  }

  onStage?.("validating");

  const draft = sanitizeGeneratedRichFields(
    filterSourceMappings(generated.draft, context.allowedSourceUrls),
  );

  const structureError = validateGeneratedDraftStructure(
    draft,
    run.content_type,
  );
  if (structureError) {
    await failGeneration(supabase, agentRunId, structureError);
    return { ok: false, error: structureError };
  }

  const allowedContentIds = new Set(
    context.relatedHCXContent.map((item) => item.id),
  );

  const groundingAudit = auditGrounding({
    draft,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls: context.allowedSourceUrls,
    allowedContentIds,
  });

  if (!groundingAudit.passed) {
    await failGeneration(
      supabase,
      agentRunId,
      "Generated output failed validation.",
    );
    return {
      ok: false,
      error: "Generated output failed validation.",
    };
  }

  const quality = assessDraftQuality({
    draft,
    groundingAudit,
    researchQuality: payload.researchQuality,
  });

  onStage?.("saving");

  const saved = await saveGeneratedDraft({
    supabase,
    run,
    draft,
    researchQuality: payload.researchQuality,
    qualityScore: quality.score,
    categoryId: context.categoryId,
  });

  if (!saved.result || saved.error) {
    await failGeneration(
      supabase,
      agentRunId,
      saved.error ?? "Unable to save draft.",
    );
    return {
      ok: false,
      error: saved.error ?? "Unable to save draft.",
    };
  }

  const metadata: GenerationMetadata = {
    usage: generated.usage,
    quality,
    groundingAudit,
    generatedAt: new Date().toISOString(),
  };

  const updated = await updateAgentRun(supabase, agentRunId, {
    status: "ready",
    stage: "ready",
    quality_score: quality.score,
    fact_check_status:
      payload.researchQuality === "needs_review" ? "needs_review" : "pending",
    error_message: null,
    generation_metadata: metadata as unknown as Record<string, unknown>,
    article_id:
      run.content_type === "article" ? saved.result.contentId : undefined,
    tutorial_id:
      run.content_type === "tutorial" ? saved.result.contentId : undefined,
    lab_id: run.content_type === "lab" ? saved.result.contentId : undefined,
  });
  if (!updated.data || updated.error) {
    return {
      ok: true,
      result: {
        ...saved.result,
        warnings: [
          ...saved.result.warnings,
          "Draft saved, but the agent run link could not be updated automatically.",
        ],
      },
    };
  }

  return { ok: true, result: saved.result };
}
