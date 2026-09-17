import "server-only";

import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { runDeterministicPreCheck } from "@/lib/agent/review/build-context-core";
import {
  assessPhase5HumanAcceptanceEligibility,
  buildAgentRunHumanAcceptanceMetadataUpdate,
  buildPhase5HumanReviewAcceptanceRecord,
  readPhase5HumanReviewAcceptanceFromMetadata,
} from "@/lib/agent/review/human-acceptance-core";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import { mapAgentReviewRowToRecord } from "@/lib/agent/review/map-review-core";
import { getCurrentDraftFingerprintFromSnapshot } from "@/lib/agent/readiness/readiness-gate-core";
import { runAgentReadinessEvaluation } from "@/lib/agent/readiness/engine";
import type { RunReadinessResult } from "@/lib/agent/readiness/types";
import type { Phase5HumanReviewAcceptanceRecord } from "@/lib/agent/review/human-acceptance-core";
import { getAgentRun, getAgentSources, updateAgentRun } from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export type AcceptAgentReviewFindingsOutcome =
  | {
      ok: true;
      acceptance: Phase5HumanReviewAcceptanceRecord;
      readiness: RunReadinessResult;
    }
  | { ok: false; error: string };

export async function acceptAgentReviewFindings(input: {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string | null;
}): Promise<AcceptAgentReviewFindingsOutcome> {
  const trimmedRunId = input.agentRunId.trim();
  const loadedRun = await getAgentRun(input.supabase, trimmedRunId);
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

  const snapshotResult = await loadReviewDraftSnapshot(input.supabase, run);
  if (!snapshotResult.snapshot || snapshotResult.error) {
    return {
      ok: false,
      error: snapshotResult.error ?? "No draft exists for this research run.",
    };
  }

  const latestReviewResult = await getLatestAgentReviewForRun(
    input.supabase,
    trimmedRunId,
  );
  if (!latestReviewResult.data || latestReviewResult.error) {
    return { ok: false, error: "No Phase 5 review exists for this run." };
  }

  const review = mapAgentReviewRowToRecord(latestReviewResult.data, false);
  const currentDraftFingerprint = getCurrentDraftFingerprintFromSnapshot(
    snapshotResult.snapshot,
  );

  const sourcesResult = await getAgentSources(input.supabase, trimmedRunId);
  if (sourcesResult.error) {
    return { ok: false, error: sourcesResult.error };
  }

  const groundingAudit = runDeterministicPreCheck({
    draftSnapshot: snapshotResult.snapshot,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls: sourcesResult.data.map((source) => source.url),
    approvedInternalContent: payload.relatedHCXContent.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      slug: item.slug,
    })),
  });

  const eligibility = assessPhase5HumanAcceptanceEligibility({
    agentRunId: trimmedRunId,
    review,
    currentDraftFingerprint,
    groundingAudit,
  });
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason };
  }

  const acceptance = buildPhase5HumanReviewAcceptanceRecord({
    agentRunId: trimmedRunId,
    review,
    currentDraftFingerprint,
    resolvedBy: input.adminUserId,
  });

  const existingMetadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;

  const updated = await updateAgentRun(input.supabase, trimmedRunId, {
    generation_metadata: buildAgentRunHumanAcceptanceMetadataUpdate({
      existingMetadata,
      acceptance,
    }),
  });
  if (updated.error || !updated.data) {
    return { ok: false, error: "Unable to record review acceptance." };
  }

  const readinessOutcome = await runAgentReadinessEvaluation({
    supabase: input.supabase,
    agentRunId: trimmedRunId,
  });
  if (!readinessOutcome.ok) {
    return { ok: false, error: readinessOutcome.error };
  }

  const persistedAcceptance = readPhase5HumanReviewAcceptanceFromMetadata(
    updated.data.generation_metadata as Record<string, unknown> | null,
  );
  if (!persistedAcceptance) {
    return { ok: false, error: "Unable to verify saved review acceptance." };
  }

  return {
    ok: true,
    acceptance: persistedAcceptance,
    readiness: readinessOutcome.result,
  };
}
