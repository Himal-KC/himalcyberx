import "server-only";

import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import {
  buildReviewContextPayload,
  runDeterministicPreCheck,
} from "@/lib/agent/review/build-context-core";
import { buildDraftFingerprint } from "@/lib/agent/review/fingerprint-core";
import { reviewDraftWithOpenAi, repairSolReviewWithOpenAi } from "@/lib/agent/review/generate";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import {
  buildRunReviewResult,
  mapAgentReviewRowToRecord,
} from "@/lib/agent/review/map-review-core";
import {
  evaluateDeterministicInternalLinkIntegrity,
  evaluateDeterministicSourceIntegrity,
  evaluateReviewQualityGate,
  mergeIntegritySectionsForDisplay,
} from "@/lib/agent/review/quality-gate-core";
import {
  buildAgentRunReviewUpdate,
  buildLinkedContentReviewUpdate,
  buildReviewInsertPayload,
  contentIdForRun,
} from "@/lib/agent/review/persist-core";
import { logReviewError, logReviewTrace } from "@/lib/agent/review/review-log-core";
import type { RunReviewResult } from "@/lib/agent/review/types";
import { REVIEW_VERSION } from "@/lib/agent/review/types";
import { shouldAttemptReviewRepair } from "@/lib/agent/review/repair-core";
import {
  buildReviewEvidenceIndex,
  collectValidationDiagnostics,
  listAllowedEvidenceCatalogIds,
  validateSolReviewOutput,
} from "@/lib/agent/review/validate-review-core";
import {
  getAgentRun,
  getAgentSources,
  updateAgentRun,
} from "@/lib/supabase/admin-agent";
import {
  getLatestAgentReviewByFingerprint,
  insertAgentReview,
} from "@/lib/supabase/admin-agent-review";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface RunReviewInput {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string;
}

export type RunReviewOutcome =
  | { ok: true; result: RunReviewResult }
  | { ok: false; error: string };

async function updateLinkedContentReviewStatus(
  supabase: AdminSupabase,
  run: Awaited<ReturnType<typeof getAgentRun>>["data"],
  factCheckStatus: RunReviewResult["review"]["factCheckStatus"],
  qualityScore: number,
): Promise<void> {
  if (!run) {
    return;
  }

  const contentId = contentIdForRun(run);
  if (!contentId) {
    return;
  }

  const update = buildLinkedContentReviewUpdate({
    factCheckStatus,
    qualityScore,
  });

  if (run.content_type === "article") {
    await supabase.from("articles").update(update).eq("id", contentId);
    return;
  }

  if (run.content_type === "tutorial") {
    await supabase.from("tutorials").update(update).eq("id", contentId);
    return;
  }

  await supabase.from("labs").update(update).eq("id", contentId);
}

export async function runAgentReview(
  input: RunReviewInput,
): Promise<RunReviewOutcome> {
  const { supabase, agentRunId } = input;

  if (!hasOpenAiApiKey()) {
    return { ok: false, error: "OpenAI is not configured." };
  }

  logReviewTrace("review_start", { agentRunId });

  const loadedRun = await getAgentRun(supabase, agentRunId);
  if (!loadedRun.data || loadedRun.error) {
    return {
      ok: false,
      error: loadedRun.error ?? "Unable to load research run.",
    };
  }

  const run = loadedRun.data;
  const payload = getResearchPayloadFromRun(run);
  if (!payload) {
    return { ok: false, error: "Research evidence is insufficient." };
  }

  const snapshotResult = await loadReviewDraftSnapshot(supabase, run);
  if (!snapshotResult.snapshot || snapshotResult.error) {
    return {
      ok: false,
      error: snapshotResult.error ?? "No draft exists for this research run.",
    };
  }

  const fingerprint = buildDraftFingerprint(snapshotResult.snapshot);

  logReviewTrace("cache_check", {
    agentRunId,
    contentType: run.content_type,
  });

  const cached = await getLatestAgentReviewByFingerprint(
    supabase,
    agentRunId,
    fingerprint,
  );
  if (cached.data) {
    const review = mapAgentReviewRowToRecord(cached.data, true);
    logReviewTrace("cache_hit", {
      agentRunId,
      contentType: run.content_type,
    });
    logReviewTrace("review_complete", {
      agentRunId,
      contentType: run.content_type,
    });
    return { ok: true, result: buildRunReviewResult(review) };
  }

  const allowed = await enforceRateLimit("agent-review", input.adminUserId);
  if (!allowed) {
    return { ok: false, error: RATE_LIMIT_MESSAGES.agentReview };
  }

  const sourcesResult = await getAgentSources(supabase, agentRunId);
  if (sourcesResult.error) {
    return { ok: false, error: sourcesResult.error };
  }

  const allowedSourceUrls = sourcesResult.data.map((source) => source.url);
  const groundingAudit = runDeterministicPreCheck({
    draftSnapshot: snapshotResult.snapshot,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls,
    approvedInternalContent: payload.relatedHCXContent.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      slug: item.slug,
    })),
  });

  const reviewContext = buildReviewContextPayload({
    run,
    researchPayload: payload,
    draftSnapshot: snapshotResult.snapshot,
    sources: sourcesResult.data,
    groundingAudit,
  });

  logReviewTrace("context_ready", {
    agentRunId,
    contentType: run.content_type,
  });

  logReviewTrace("openai_start", {
    agentRunId,
    contentType: run.content_type,
  });

  const reviewed = await reviewDraftWithOpenAi(reviewContext);
  if (!reviewed.review || reviewed.error) {
    return {
      ok: false,
      error: reviewed.error ?? "Review output failed validation.",
    };
  }

  logReviewTrace("openai_success", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  logReviewTrace("validation_start", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  const evidenceIndex = buildReviewEvidenceIndex({
    verifiedClaims: payload.verifiedClaims,
    authoritativeSources: reviewContext.authoritativeSources,
    approvedInternalContent: reviewContext.approvedInternalContent,
    discoveryContexts: reviewContext.discoveryContexts,
  });
  const allowedSourceUrlSet = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );

  const runOutputValidation = (review: NonNullable<typeof reviewed.review>) =>
    validateSolReviewOutput({
      review,
      contentType: run.content_type,
      evidenceIndex,
      allowedSourceUrls: allowedSourceUrlSet,
    });

  let validation = runOutputValidation(reviewed.review);
  let finalReview = reviewed.review;
  let repairAttempted = false;

  if (!validation.valid) {
    logReviewTrace("validation_failed", {
      agentRunId,
      contentType: run.content_type,
      model: reviewed.model,
    });

    const diagnostics = collectValidationDiagnostics({
      errors: validation.errors,
      index: evidenceIndex,
      review: reviewed.review,
    });

    logReviewError({
      checkpoint: "validation_failed",
      agentRunId,
      contentType: run.content_type,
      model: reviewed.model,
      errorMessage: validation.errors.join(", "),
      findingContractIssues: diagnostics.findingContractIssues,
      evidenceClassificationDiagnostics:
        diagnostics.evidenceClassificationDiagnostics,
    });

    if (
      shouldAttemptReviewRepair({
        validationErrors: validation.errors,
        repairAttempted,
      })
    ) {
      repairAttempted = true;
      logReviewTrace("repair_start", {
        agentRunId,
        contentType: run.content_type,
        model: reviewed.model,
      });

      const repaired = await repairSolReviewWithOpenAi({
        context: reviewContext,
        originalReview: reviewed.review,
        validationErrors: validation.errors,
        allowedEvidenceIds: listAllowedEvidenceCatalogIds(evidenceIndex),
      });

      if (!repaired.review || repaired.error) {
        return {
          ok: false,
          error: repaired.error ?? "Review output failed validation.",
        };
      }

      logReviewTrace("repair_success", {
        agentRunId,
        contentType: run.content_type,
        model: repaired.model,
      });

      logReviewTrace("repair_validation_start", {
        agentRunId,
        contentType: run.content_type,
        model: repaired.model,
      });

      validation = runOutputValidation(repaired.review);
      finalReview = validation.sanitizedReview ?? repaired.review;

      if (!validation.valid) {
        const repairDiagnostics = collectValidationDiagnostics({
          errors: validation.errors,
          index: evidenceIndex,
          review: repaired.review,
        });

        logReviewError({
          checkpoint: "repair_validation_start",
          agentRunId,
          contentType: run.content_type,
          model: repaired.model,
          errorMessage: validation.errors.join(", "),
          findingContractIssues: repairDiagnostics.findingContractIssues,
          evidenceClassificationDiagnostics:
            repairDiagnostics.evidenceClassificationDiagnostics,
        });

        return { ok: false, error: "Review output failed validation." };
      }

      logReviewTrace("repair_validation_success", {
        agentRunId,
        contentType: run.content_type,
        model: repaired.model,
      });
      reviewed.model = repaired.model;
    } else {
      return { ok: false, error: "Review output failed validation." };
    }
  } else {
    finalReview = validation.sanitizedReview ?? reviewed.review;
  }

  reviewed.review = finalReview;

  logReviewTrace("validation_success", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  logReviewTrace("quality_gate_start", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  const deterministicSourceIntegrity = evaluateDeterministicSourceIntegrity({
    invalidSourceUrls: groundingAudit.invalidSourceUrls,
  });
  const deterministicInternalLinkIntegrity =
    evaluateDeterministicInternalLinkIntegrity({
      invalidInternalLinks: groundingAudit.invalidInternalLinks,
      internalLinkUnsupportedClaims: groundingAudit.unsupportedClaims.filter(
        (claim) => claim.startsWith("internal_link:"),
      ),
    });

  reviewed.review.sourceIntegrity = mergeIntegritySectionsForDisplay(
    deterministicSourceIntegrity,
    reviewed.review.sourceIntegrity,
  );
  reviewed.review.internalLinkIntegrity = mergeIntegritySectionsForDisplay(
    deterministicInternalLinkIntegrity,
    reviewed.review.internalLinkIntegrity,
  );

  const gate = evaluateReviewQualityGate({
    review: reviewed.review,
    deterministicGroundingPassed: groundingAudit.passed,
    sourceIntegrityPassed: deterministicSourceIntegrity.passed,
    internalLinkIntegrityPassed: deterministicInternalLinkIntegrity.passed,
  });

  reviewed.review.reviewVersion = REVIEW_VERSION;

  logReviewTrace("quality_gate_success", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  logReviewTrace("save_start", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  const contentId = contentIdForRun(run);
  if (!contentId) {
    return { ok: false, error: "No draft exists for this research run." };
  }

  const saved = await insertAgentReview(
    supabase,
    buildReviewInsertPayload({
      agentRunId,
      contentType: run.content_type,
      contentId,
      draftFingerprint: fingerprint,
      reviewModel: reviewed.model,
      review: reviewed.review,
      gate,
    }),
  );

  if (!saved.data || saved.error) {
    logReviewError({
      checkpoint: "save_start",
      agentRunId,
      contentType: run.content_type,
      model: reviewed.model,
      errorMessage: saved.error ?? "Unable to save review.",
    });
    return { ok: false, error: saved.error ?? "Unable to save review." };
  }

  await updateLinkedContentReviewStatus(
    supabase,
    run,
    gate.factCheckStatus,
    gate.overallQualityScore,
  );

  await updateAgentRun(
    supabase,
    agentRunId,
    buildAgentRunReviewUpdate({
      run,
      factCheckStatus: gate.factCheckStatus,
      qualityScore: gate.overallQualityScore,
      reviewMetadata: {
        latestReviewId: saved.data.id,
        latestReviewStatus: gate.overallStatus,
        draftFingerprint: fingerprint,
      },
    }) as never,
  );

  const reviewRecord = mapAgentReviewRowToRecord(saved.data, false);

  logReviewTrace("save_success", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  logReviewTrace("review_complete", {
    agentRunId,
    contentType: run.content_type,
    model: reviewed.model,
  });

  return { ok: true, result: buildRunReviewResult(reviewRecord) };
}
