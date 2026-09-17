import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import {
  applyArticleDeterministicCleanup,
  articleNeedsDeterministicCleanup,
  resolveVisualConceptForAltRepair,
} from "@/lib/agent/content/deterministic-cleanup-core";
import { getCurrentDraftFingerprintFromSnapshot } from "@/lib/agent/readiness/readiness-gate-core";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import { runAgentReview } from "@/lib/agent/review/engine";
import type { RunReviewResult } from "@/lib/agent/review/types";
import {
  buildArticleRevisionUpdatePayload,
  prepareArticleRevisionContent,
  contentTableForRevision,
} from "@/lib/agent/review/revision-save-core";
import { getAgentRun } from "@/lib/supabase/admin-agent";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export type ApplyDeterministicCleanupOutcome =
  | {
      ok: true;
      changeSummary: string[];
      previousFingerprint: string;
      revisedFingerprint: string;
      review: RunReviewResult;
    }
  | { ok: false; error: string };

export async function runDeterministicAgentDraftCleanup(input: {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string;
}): Promise<ApplyDeterministicCleanupOutcome> {
  noStore();
  const trimmedRunId = input.agentRunId.trim();

  const allowed = await enforceRateLimit("agent-review", input.adminUserId);
  if (!allowed) {
    return { ok: false, error: RATE_LIMIT_MESSAGES.agentReview };
  }

  const loadedRun = await getAgentRun(input.supabase, trimmedRunId);
  if (!loadedRun.data || loadedRun.error) {
    return {
      ok: false,
      error: loadedRun.error ?? "Unable to load research run.",
    };
  }

  const run = loadedRun.data;
  if (run.content_type !== "article") {
    return {
      ok: false,
      error: "Deterministic cleanup is only supported for article drafts.",
    };
  }

  const snapshotResult = await loadReviewDraftSnapshot(input.supabase, run);
  if (!snapshotResult.snapshot || snapshotResult.error) {
    return {
      ok: false,
      error: snapshotResult.error ?? "No draft exists for this research run.",
    };
  }

  const snapshot = snapshotResult.snapshot;
  if (snapshot.draft.contentType !== "article") {
    return { ok: false, error: "Draft snapshot is not an article." };
  }

  const previousFingerprint = getCurrentDraftFingerprintFromSnapshot(snapshot);
  const contentId = snapshot.contentId;

  const { data: articleRow, error: articleError } = await input.supabase
    .from("articles")
    .select("slug, status, featured_image, featured_image_alt, category_id")
    .eq("id", contentId)
    .maybeSingle();

  if (articleError || !articleRow) {
    return { ok: false, error: "Unable to load article draft for cleanup." };
  }

  const existingMetadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;

  const visualConcept = resolveVisualConceptForAltRepair({
    metadata: existingMetadata,
    recommendedAngle: run.recommended_angle,
    topic: run.topic,
  });

  if (
    !articleNeedsDeterministicCleanup({
      draft: snapshot.draft,
      slug: articleRow.slug,
      featuredImage: articleRow.featured_image,
      featuredImageAlt: articleRow.featured_image_alt,
    })
  ) {
    return {
      ok: false,
      error: "No deterministic cleanup is needed for the current draft.",
    };
  }

  const cleanup = applyArticleDeterministicCleanup({
    draft: snapshot.draft,
    slug: articleRow.slug,
    featuredImage: articleRow.featured_image,
    featuredImageAlt: articleRow.featured_image_alt,
    visualConcept,
    topic: run.topic,
  });

  if (cleanup.changeSummary.length === 0) {
    return {
      ok: false,
      error: "Deterministic cleanup made no changes.",
    };
  }

  const updatePayload = buildArticleRevisionUpdatePayload({
    draft: cleanup.draft,
    existingRow: articleRow,
    preparedContent: prepareArticleRevisionContent(cleanup.draft),
    featuredImageAlt: cleanup.featuredImageAlt,
  });

  const table = contentTableForRevision(run.content_type);
  const updated = await input.supabase
    .from(table)
    .update(updatePayload)
    .eq("id", contentId)
    .eq("agent_run_id", run.id);

  if (updated.error) {
    return { ok: false, error: "Unable to save cleaned article draft." };
  }

  const reloaded = await loadReviewDraftSnapshot(input.supabase, run);
  if (!reloaded.snapshot) {
    return { ok: false, error: "Unable to reload draft after cleanup." };
  }

  const revisedFingerprint = getCurrentDraftFingerprintFromSnapshot(
    reloaded.snapshot,
  );

  if (revisedFingerprint === previousFingerprint) {
    return {
      ok: false,
      error: "Draft fingerprint did not change after cleanup.",
    };
  }

  const reviewOutcome = await runAgentReview({
    supabase: input.supabase,
    agentRunId: trimmedRunId,
    adminUserId: input.adminUserId,
  });

  if (!reviewOutcome.ok) {
    return { ok: false, error: reviewOutcome.error };
  }

  return {
    ok: true,
    changeSummary: cleanup.changeSummary,
    previousFingerprint,
    revisedFingerprint,
    review: reviewOutcome.result,
  };
}
