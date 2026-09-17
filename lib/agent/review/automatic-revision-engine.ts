import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import { runDeterministicPreCheck, buildReviewContextPayload } from "@/lib/agent/review/build-context-core";
import {
  assessAutomaticRevisionEligibility,
  buildPhase5AutomaticRevisionMetadataUpdate,
  buildRevisionChangeSummary,
  buildRevisionIdempotencyKey,
  countAutomaticRevisionAttempts,
  mergeRevisedDraftWithSnapshot,
  repairFeaturedImageAltText,
  revisionAlreadyCompletedForReview,
  type Phase5AutomaticRevisionRecord,
} from "@/lib/agent/review/automatic-revision-core";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import { mapAgentReviewRowToRecord } from "@/lib/agent/review/map-review-core";
import { runAgentReview } from "@/lib/agent/review/engine";
import { reviseDraftWithOpenAi } from "@/lib/agent/review/revision-generate";
import {
  buildArticleRevisionUpdatePayload,
  buildLabRevisionUpdatePayload,
  buildTutorialRevisionUpdatePayload,
  contentTableForRevision,
  prepareArticleRevisionContent,
} from "@/lib/agent/review/revision-save-core";
import { validateRevisedDraftBeforeSave } from "@/lib/agent/review/revision-validate-core";
import type { RunReviewResult } from "@/lib/agent/review/types";
import { getCurrentDraftFingerprintFromSnapshot } from "@/lib/agent/readiness/readiness-gate-core";
import { getAgentRun, getAgentSources, updateAgentRun } from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

const activeAutomaticRevisions = new Map<string, Promise<ApplyAutomaticRevisionOutcome>>();

export type ApplyAutomaticRevisionOutcome =
  | {
      ok: true;
      changeSummary: string[];
      previousFingerprint: string;
      revisedFingerprint: string;
      review: RunReviewResult;
    }
  | { ok: false; error: string };

export async function runPhase5AutomaticSafeRevision(input: {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string;
}): Promise<ApplyAutomaticRevisionOutcome> {
  noStore();
  const trimmedRunId = input.agentRunId.trim();

  const inFlight = activeAutomaticRevisions.get(trimmedRunId);
  if (inFlight) {
    return inFlight;
  }

  const task = executeAutomaticSafeRevision(input);
  activeAutomaticRevisions.set(trimmedRunId, task);

  try {
    return await task;
  } finally {
    activeAutomaticRevisions.delete(trimmedRunId);
  }
}

async function executeAutomaticSafeRevision(input: {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string;
}): Promise<ApplyAutomaticRevisionOutcome> {
  if (!hasOpenAiApiKey()) {
    return { ok: false, error: "OpenAI is not configured." };
  }

  const allowed = await enforceRateLimit("agent-revision", input.adminUserId);
  if (!allowed) {
    return { ok: false, error: RATE_LIMIT_MESSAGES.agentRevision };
  }

  const loadedRun = await getAgentRun(input.supabase, input.agentRunId);
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

  const snapshot = snapshotResult.snapshot;
  const currentDraftFingerprint = getCurrentDraftFingerprintFromSnapshot(snapshot);

  const latestReviewResult = await getLatestAgentReviewForRun(
    input.supabase,
    input.agentRunId,
  );
  if (!latestReviewResult.data || latestReviewResult.error) {
    return { ok: false, error: "No Phase 5 review exists for this run." };
  }

  const review = mapAgentReviewRowToRecord(latestReviewResult.data, false);

  const sourcesResult = await getAgentSources(input.supabase, input.agentRunId);
  if (sourcesResult.error) {
    return { ok: false, error: sourcesResult.error };
  }

  const allowedSourceUrls = sourcesResult.data.map((source) => source.url);
  const allowedContentIds = payload.relatedHCXContent.map((item) => item.id);

  const groundingAudit = runDeterministicPreCheck({
    draftSnapshot: snapshot,
    verifiedClaims: payload.verifiedClaims,
    allowedSourceUrls,
    approvedInternalContent: payload.relatedHCXContent.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      slug: item.slug,
    })),
  });

  const existingMetadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;

  const eligibility = assessAutomaticRevisionEligibility({
    agentRunId: input.agentRunId,
    review,
    currentDraftFingerprint,
    groundingAudit,
    metadata: existingMetadata,
    snapshot,
  });

  if (eligibility.status === "blocked") {
    return { ok: false, error: eligibility.reason };
  }

  if (eligibility.status === "not_needed" || !eligibility.plan) {
    return { ok: false, error: eligibility.reason };
  }

  if (
    revisionAlreadyCompletedForReview({
      metadata: existingMetadata,
      agentReviewId: review.id,
      sourceDraftFingerprint: currentDraftFingerprint,
    })
  ) {
    return {
      ok: false,
      error: "Safe revisions were already applied for this review and draft.",
    };
  }

  const reviewContext = buildReviewContextPayload({
    run,
    researchPayload: payload,
    draftSnapshot: snapshot,
    sources: sourcesResult.data,
    groundingAudit,
  });

  const revised = await reviseDraftWithOpenAi({
    context: reviewContext,
    plan: eligibility.plan,
    verifiedClaims: payload.verifiedClaims,
  });

  if (!revised.draft || revised.error) {
    await persistRevisionFailure({
      supabase: input.supabase,
      runId: input.agentRunId,
      existingMetadata,
      review,
      previousFingerprint: currentDraftFingerprint,
      plan: eligibility.plan,
      reason: revised.error ?? "Revision model returned invalid output.",
    });
    return {
      ok: false,
      error: revised.error ?? "Automatic revision failed.",
    };
  }

  const mergedDraft = mergeRevisedDraftWithSnapshot({
    snapshot,
    revisedDraft: revised.draft,
  });

  const validation = validateRevisedDraftBeforeSave({
    draft: mergedDraft,
    contentType: run.content_type,
    allowedSourceUrls,
    allowedContentIds,
    researchPayload: payload,
  });

  if (!validation.ok) {
    await persistRevisionFailure({
      supabase: input.supabase,
      runId: input.agentRunId,
      existingMetadata,
      review,
      previousFingerprint: currentDraftFingerprint,
      plan: eligibility.plan,
      reason: validation.reason,
    });
    return { ok: false, error: validation.reason };
  }

  const reloadBeforeSave = await loadReviewDraftSnapshot(input.supabase, run);
  if (
    !reloadBeforeSave.snapshot ||
    getCurrentDraftFingerprintFromSnapshot(reloadBeforeSave.snapshot) !==
      currentDraftFingerprint
  ) {
    return {
      ok: false,
      error: "Draft changed before revision could be saved. Reload and try again.",
    };
  }

  const saveError = await saveRevisedDraftToCms({
    supabase: input.supabase,
    run,
    snapshot: reloadBeforeSave.snapshot,
    draft: validation.draft,
    existingMetadata,
  });

  if (saveError) {
    await persistRevisionFailure({
      supabase: input.supabase,
      runId: input.agentRunId,
      existingMetadata,
      review,
      previousFingerprint: currentDraftFingerprint,
      plan: eligibility.plan,
      reason: saveError,
    });
    return { ok: false, error: saveError };
  }

  const reloaded = await loadReviewDraftSnapshot(input.supabase, run);
  if (!reloaded.snapshot) {
    return { ok: false, error: "Unable to reload revised draft." };
  }

  const revisedFingerprint = getCurrentDraftFingerprintFromSnapshot(
    reloaded.snapshot,
  );

  const changeSummary = buildRevisionChangeSummary(eligibility.plan.actions);
  const attempts = countAutomaticRevisionAttempts(existingMetadata) + 1;
  const revisionRecord: Phase5AutomaticRevisionRecord = {
    version: "phase5-auto-revision-v1",
    attempts,
    lastCompletedKey: buildRevisionIdempotencyKey(
      review.id,
      currentDraftFingerprint,
    ),
    lastStatus: "completed",
    previousReviewId: review.id,
    previousFingerprint: currentDraftFingerprint,
    revisedFingerprint,
    revisedAt: new Date().toISOString(),
    actions: eligibility.plan.actions,
    changeSummary,
    failureReason: null,
  };

  await updateAgentRun(input.supabase, input.agentRunId, {
    generation_metadata: buildPhase5AutomaticRevisionMetadataUpdate({
      existingMetadata,
      record: revisionRecord,
    }),
  });

  const reviewOutcome = await runAgentReview({
    supabase: input.supabase,
    agentRunId: input.agentRunId,
    adminUserId: input.adminUserId,
  });

  if (!reviewOutcome.ok) {
    return {
      ok: false,
      error: reviewOutcome.error,
    };
  }

  return {
    ok: true,
    changeSummary,
    previousFingerprint: currentDraftFingerprint,
    revisedFingerprint,
    review: reviewOutcome.result,
  };
}

async function persistRevisionFailure(input: {
  supabase: AdminSupabase;
  runId: string;
  existingMetadata: Record<string, unknown> | null;
  review: { id: string };
  previousFingerprint: string;
  plan: { actions: Phase5AutomaticRevisionRecord["actions"] };
  reason: string;
}): Promise<void> {
  const attempts = countAutomaticRevisionAttempts(input.existingMetadata) + 1;
  const record: Phase5AutomaticRevisionRecord = {
    version: "phase5-auto-revision-v1",
    attempts,
    lastCompletedKey: null,
    lastStatus: "failed",
    previousReviewId: input.review.id,
    previousFingerprint: input.previousFingerprint,
    revisedFingerprint: null,
    revisedAt: null,
    actions: input.plan.actions,
    changeSummary: [],
    failureReason: input.reason,
  };

  await updateAgentRun(input.supabase, input.runId, {
    generation_metadata: buildPhase5AutomaticRevisionMetadataUpdate({
      existingMetadata: input.existingMetadata,
      record,
    }),
  });
}

async function saveRevisedDraftToCms(input: {
  supabase: AdminSupabase;
  run: NonNullable<Awaited<ReturnType<typeof getAgentRun>>["data"]>;
  snapshot: NonNullable<Awaited<ReturnType<typeof loadReviewDraftSnapshot>>["snapshot"]>;
  draft: import("@/lib/agent/generation/types").GeneratedDraft;
  existingMetadata: Record<string, unknown> | null;
}): Promise<string | null> {
  const table = contentTableForRevision(input.run.content_type);
  const contentId = input.snapshot.contentId;

  if (input.run.content_type === "article" && input.draft.contentType === "article") {
    const { data, error } = await input.supabase
      .from("articles")
      .select("slug, status, featured_image, featured_image_alt, category_id")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return "Unable to load article draft for revision save.";
    }

    const visualConcept =
      typeof input.existingMetadata?.latestReview === "object"
        ? null
        : (input.existingMetadata?.visualConcept as string | undefined);

    const repairedAlt = repairFeaturedImageAltText({
      title: input.draft.title,
      currentAlt: data.featured_image_alt,
      visualConcept: visualConcept ?? input.run.recommended_angle,
    });

    const updatePayload = buildArticleRevisionUpdatePayload({
      draft: input.draft,
      existingRow: data,
      preparedContent: prepareArticleRevisionContent(input.draft),
      featuredImageAlt: repairedAlt,
    });

    const updated = await input.supabase
      .from(table)
      .update(updatePayload)
      .eq("id", contentId)
      .eq("agent_run_id", input.run.id);

    if (updated.error) {
      return "Unable to save revised article draft.";
    }

    return null;
  }

  if (input.run.content_type === "tutorial" && input.draft.contentType === "tutorial") {
    const { data, error } = await input.supabase
      .from("tutorials")
      .select("slug, status")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return "Unable to load tutorial draft for revision save.";
    }

    const updated = await input.supabase
      .from(table)
      .update(buildTutorialRevisionUpdatePayload({ draft: input.draft, existingRow: data }))
      .eq("id", contentId)
      .eq("agent_run_id", input.run.id);

    if (updated.error) {
      return "Unable to save revised tutorial draft.";
    }

    return null;
  }

  if (input.run.content_type === "lab" && input.draft.contentType === "lab") {
    const { data, error } = await input.supabase
      .from("labs")
      .select("slug, status")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return "Unable to load lab draft for revision save.";
    }

    const updated = await input.supabase
      .from(table)
      .update(buildLabRevisionUpdatePayload({ draft: input.draft, existingRow: data }))
      .eq("id", contentId)
      .eq("agent_run_id", input.run.id);

    if (updated.error) {
      return "Unable to save revised lab draft.";
    }

    return null;
  }

  return "Revised draft content type mismatch.";
}
