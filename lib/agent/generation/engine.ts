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
  recoverDraftByAgentRunId,
  saveGeneratedDraft,
} from "@/lib/agent/generation/save-draft";
import {
  buildAgentRunSaveUpdate,
  resolveFactCheckStatus,
} from "@/lib/agent/generation/save-draft-core";
import {
  extractSupabaseErrorDetails,
  logGenerationSave,
} from "@/lib/agent/generation/save-log";
import type {
  GenerateDraftResult,
  GenerationMetadata,
} from "@/lib/agent/generation/types";
import {
  filterSourceMappings,
  sanitizeGeneratedRichFields,
  validateDraftReferencesDetailed,
  validateGeneratedDraftStructure,
  validateGeneratedDraftStructureDetailed,
  analyzeStructureHtmlValidationFailure,
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
import { resolveResearchGenerationEligibility } from "@/lib/agent/research/research-generation-eligibility-core";
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
  let existingDraft = getExistingDraftFromRun(run);
  if (!existingDraft) {
    existingDraft = await recoverDraftByAgentRunId(supabase, run);
  }
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

  const eligibility = resolveResearchGenerationEligibility({
    topic: run.topic,
    contentType: run.content_type,
    recommendedAngle: run.recommended_angle,
    payload,
    sources: sourcesResult.data.map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      sourceType: source.source_type,
    })),
  });

  if (!eligibility.canGenerateDraft) {
    return {
      ok: false,
      error:
        eligibility.researchSufficiency.status === "needs_more_research"
          ? "More research is needed before a grounded draft can be generated."
          : "Research evidence is insufficient.",
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
    context.allowedSourceUrls,
  );

  const structureError = validateGeneratedDraftStructure(
    draft,
    run.content_type,
    context.allowedSourceUrls,
  );
  if (structureError) {
    const structureDetails = validateGeneratedDraftStructureDetailed(
      draft,
      run.content_type,
      context.allowedSourceUrls,
    );
    const htmlFailure = analyzeStructureHtmlValidationFailure(
      draft,
      context.allowedSourceUrls,
    );
    logGenerationValidationFailure(
      buildValidationFailureLog({
        agentRunId,
        contentType: run.content_type,
        validationStage: "structure_validation",
        issueCodes: issueCodesForStructureError(structureError),
        reason:
          structureDetails?.message ??
          structureError,
        failingField: htmlFailure?.field ?? structureDetails?.field ?? null,
        htmlIssue: htmlFailure?.issue ?? structureDetails?.issue ?? null,
        htmlValidationPhase: htmlFailure?.htmlValidationPhase ?? null,
        markupExcerpt: htmlFailure?.excerpt ?? null,
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
    approvedInternalContent: context.relatedHCXContent,
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
  });

  let draftResult = saved.result;
  if (!draftResult || saved.error) {
    const recovered = await recoverDraftByAgentRunId(supabase, run);
    if (!recovered) {
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

    draftResult = recovered;
  }

  const factCheckStatus = resolveFactCheckStatus(payload.researchQuality);
  const metadata: GenerationMetadata = {
    usage: generated.usage,
    quality,
    groundingAudit,
    generatedAt: new Date().toISOString(),
    sourceMappings: draft.sourceMappings,
    internalLinks: draft.internalLinks,
    generationWarnings: draft.warnings,
  };

  logGenerationSave({
    checkpoint: "agent_run_update_start",
    agentRunId,
    contentType: run.content_type,
    draftId: draftResult.contentId,
    stage: saved.stage ?? "insert",
  });

  const updated = await updateAgentRun(
    supabase,
    agentRunId,
    buildAgentRunSaveUpdate({
      contentType: run.content_type,
      contentId: draftResult.contentId,
      qualityScore: quality.score,
      factCheckStatus,
      metadata,
    }),
  );

  if (!updated.data || updated.error) {
    logGenerationSave({
      checkpoint: "agent_run_update_failed",
      agentRunId,
      contentType: run.content_type,
      draftId: draftResult.contentId,
      stage: "update",
      ...extractSupabaseErrorDetails({
        message: updated.error ?? "Unable to update agent research run.",
      }),
    });

    logGenerationTrace("save_success", {
      agentRunId,
      contentType: run.content_type,
    });

    return {
      ok: true,
      result: {
        ...draftResult,
        warnings: [
          ...draftResult.warnings,
          "Draft saved, but the agent run link could not be updated automatically.",
        ],
      },
    };
  }

  logGenerationSave({
    checkpoint: "agent_run_update_success",
    agentRunId,
    contentType: run.content_type,
    draftId: draftResult.contentId,
    stage: "update",
  });

  logGenerationTrace("save_success", {
    agentRunId,
    contentType: run.content_type,
  });

  return { ok: true, result: draftResult };
}
