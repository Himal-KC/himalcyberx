import "server-only";

import { getExistingDraftFromRun } from "@/lib/agent/generation/save-draft";
import {
  buildGenerateDraftResult,
  targetTableForContentType,
} from "@/lib/agent/generation/save-draft-core";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { loadReviewRunContext } from "@/lib/agent/review/load-draft";
import {
  buildRunReviewResult,
  mapAgentReviewRowToRecord,
} from "@/lib/agent/review/map-review-core";
import {
  buildResumableAgentRunSummary,
  buildResumedAgentRunResult,
  type FeaturedImageState,
  type LinkedContentRecord,
  type ResumableAgentRunSummary,
  type ResumedAgentRunResult,
  validateResumeAgentRunInput,
} from "@/lib/agent/resume/resume-core";
import {
  getAgentRun,
  listResumableAgentRuns,
} from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import type { AgentRun } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

async function loadLinkedContentRecord(
  supabase: AdminSupabase,
  run: AgentRun,
): Promise<LinkedContentRecord | null> {
  const table = targetTableForContentType(run.content_type);
  const contentId =
    run.content_type === "article"
      ? run.article_id
      : run.content_type === "tutorial"
        ? run.tutorial_id
        : run.lab_id;

  if (!contentId) {
    return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select("id, title, slug, status, agent_run_id, featured_image, featured_image_alt")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LinkedContentRecord;
}

async function loadDraftTitleForRun(
  supabase: AdminSupabase,
  run: AgentRun,
): Promise<string | null> {
  const content = await loadLinkedContentRecord(supabase, run);
  return content?.title ?? null;
}

export async function loadResumableAgentRunSummaries(
  supabase: AdminSupabase,
  limit = 10,
): Promise<{ data: ResumableAgentRunSummary[]; error: string | null }> {
  const listed = await listResumableAgentRuns(supabase, limit);
  if (listed.error) {
    return { data: [], error: listed.error };
  }

  const summaries: ResumableAgentRunSummary[] = [];

  for (const run of listed.data) {
    const draftTitle = await loadDraftTitleForRun(supabase, run);
    const summary = buildResumableAgentRunSummary({ run, draftTitle });
    if (summary) {
      summaries.push(summary);
    }
  }

  return { data: summaries, error: null };
}

export async function resumePersistedAgentRun(
  supabase: AdminSupabase,
  agentRunId: string,
): Promise<
  | { ok: true; result: ResumedAgentRunResult }
  | { ok: false; error: string }
> {
  const trimmedRunId = agentRunId.trim();
  const loadedRun = await getAgentRun(supabase, trimmedRunId);
  const linkedContent = loadedRun.data
    ? await loadLinkedContentRecord(supabase, loadedRun.data)
    : null;
  const reviewContext = await loadReviewRunContext(supabase, trimmedRunId);

  const validation = validateResumeAgentRunInput({
    agentRunId: trimmedRunId,
    run: loadedRun.data,
    content: linkedContent,
    hasResearchPayload: loadedRun.data
      ? getResearchPayloadFromRun(loadedRun.data) !== null
      : false,
    hasDraftSnapshot: Boolean(reviewContext.snapshot),
  });

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const run = loadedRun.data!;
  const content = linkedContent!;
  const draft =
    getExistingDraftFromRun(run) ??
    buildGenerateDraftResult({
      contentType: run.content_type,
      row: content,
      factCheckStatus: run.fact_check_status ?? "pending",
      qualityScore: run.quality_score ?? 0,
      warnings: [],
      existingDraft: true,
    });

  draft.title = content.title;
  draft.slug = content.slug;

  const latestReviewResult = await getLatestAgentReviewForRun(
    supabase,
    run.id,
  );
  const latestReview = latestReviewResult.data
    ? buildRunReviewResult(
        mapAgentReviewRowToRecord(latestReviewResult.data, false),
      )
    : null;

  const featuredImage: FeaturedImageState = {
    url: content.featured_image ?? null,
    alt: content.featured_image_alt ?? null,
  };

  return {
    ok: true,
    result: buildResumedAgentRunResult({
      run,
      draft,
      latestReview,
      featuredImage,
    }),
  };
}
