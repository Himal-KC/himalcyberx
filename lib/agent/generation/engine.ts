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
  validateDraftReferencesDetailed,
  validateGeneratedDraftStructure,
} from "@/lib/agent/generation/validate-output";
import {
  buildGroundingValidationLog,
  buildValidationFailureLog,
  issueCodesForReferenceError,
  issueCodesForStructureError,
  logGenerationTrace,
  logGenerationValidationFailure,
} from "@/lib/agent/generation/validation-log";
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
    } else if (generated.error === "Generated output failed validation.") {
      logGenerationValidationFailure(
        buildValidationFailureLog({
          agentRunId,
          contentType: run.content_type,
          validationStage: "openai_parse",
          issueCodes: ["SCHEMA_VALIDATION_FAILED"],
          reason: generated.error,
        }),
      );
    } else if (
      generated.error === "Generated output did not match the requested content type."
    ) {
      logGenerationValidationFailure(
        buildValidationFailureLog({
          agentRunId,
          contentType: run.content_type,
          validationStage: "openai_content_type",
          issueCodes: ["CONTENT_TYPE_MISMATCH"],
          reason: generated.error,
        }),
      );
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

  logGenerationTrace("openai_success", {
    agentRunId,
    contentType: run.content_type,
  });

  onStage?.("validating");
  logGenerationTrace("validation_start", {
    agentRunId,
    contentType: run.content_type,
  });

  const allowedContentIds = new Set(
    context.relatedHCXContent.map((item) => item.id),
  );

  const referenceFailure = validateDraftReferencesDetailed(
    generated.draft,
    context.allowedSourceUrls,
    allowedContentIds,
  );
  if (referenceFailure) {
    logGenerationValidationFailure(
      buildValidationFailureLog({
        agentRunId,
        contentType: run.content_type,
        validationStage: "reference_validation",
        issueCodes: issueCodesForReferenceError(referenceFailure.reason),
        reason: referenceFailure.reason,
        invalidSourceCount:
          referenceFailure.malformedSourceCount +
          referenceFailure.disallowedSourceCount,
        invalidInternalLinkCount:
          referenceFailure.malformedInternalLinkCount +
          referenceFailure.unknownInternalLinkCount,
      }),
    );

    await failGeneration(supabase, agentRunId, referenceFailure.reason);
    return { ok: false, error: referenceFailure.reason };
  }

  const draft = sanitizeGeneratedRichFields(
    filterSourceMappings(generated.draft, context.allowedSourceUrls),
  );

  const structureError = validateGeneratedDraftStructure(
    draft,
    run.content_type,
  );
  if (structureError) {
    logGenerationValidationFailure(
      buildValidationFailureLog({
        agentRunId,
        contentType: run.content_type,
        validationStage: "structure_validation",
        issueCodes: issueCodesForStructureError(structureError),
        reason: structureError,
      }),
    );

    await failGeneration(supabase, agentRunId, structureError);
    return { ok: false, error: structureError };
  }

  logGenerationTrace("validation_success", {
    agentRunId,
    contentType: run.content_type,
  });

  logGenerationTrace("grounding_start", {
    agentRunId,
    contentType: run.content_type,
  });

  const groundingAudit = auditGrounding({
    draft,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls: context.allowedSourceUrls,
    allowedContentIds,
  });

  if (!groundingAudit.passed) {
    logGenerationValidationFailure(
      buildGroundingValidationLog({
        agentRunId,
        contentType: run.content_type,
        audit: groundingAudit,
      }),
    );

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

  logGenerationTrace("grounding_success", {
    agentRunId,
    contentType: run.content_type,
  });

  const quality = assessDraftQuality({
    draft,
    groundingAudit,
    researchQuality: payload.researchQuality,
  });

  onStage?.("saving");
  logGenerationTrace("save_start", {
    agentRunId,
    contentType: run.content_type,
  });

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

  logGenerationTrace("save_success", {
    agentRunId,
    contentType: run.content_type,
  });

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
