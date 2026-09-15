import "server-only";

import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import {
  buildArticleDraftFromRow,
  buildLabDraftFromRow,
  buildReviewDraftSnapshot,
  buildTutorialDraftFromRow,
  parseGenerationMetadata,
} from "@/lib/agent/review/load-draft-core";
import type { ReviewDraftSnapshot } from "@/lib/agent/review/types";
import { getAgentRun } from "@/lib/supabase/admin-agent";
import type { AgentRun } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export async function loadReviewDraftSnapshot(
  supabase: AdminSupabase,
  run: AgentRun,
): Promise<{ snapshot: ReviewDraftSnapshot | null; error: string | null }> {
  const metadata = parseGenerationMetadata(run.generation_metadata);
  const contentId =
    run.content_type === "article"
      ? run.article_id
      : run.content_type === "tutorial"
        ? run.tutorial_id
        : run.lab_id;

  if (!contentId) {
    return { snapshot: null, error: "No draft exists for this research run." };
  }

  if (run.content_type === "article") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return { snapshot: null, error: "Unable to load article draft." };
    }

    const draft = buildArticleDraftFromRow(data, metadata, run.topic);
    return {
      snapshot: buildReviewDraftSnapshot({
        contentType: "article",
        contentId,
        status: data.status,
        publishedAt: data.published_at,
        draft,
        metadata,
      }),
      error: null,
    };
  }

  if (run.content_type === "tutorial") {
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return { snapshot: null, error: "Unable to load tutorial draft." };
    }

    const draft = buildTutorialDraftFromRow(data, metadata, run.topic);
    return {
      snapshot: buildReviewDraftSnapshot({
        contentType: "tutorial",
        contentId,
        status: data.status,
        publishedAt: data.published_at,
        draft,
        metadata,
      }),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return { snapshot: null, error: "Unable to load lab draft." };
  }

  const draft = buildLabDraftFromRow(data, metadata, run.topic);
  return {
    snapshot: buildReviewDraftSnapshot({
      contentType: "lab",
      contentId,
      status: data.status,
      publishedAt: data.published_at,
      draft,
      metadata,
    }),
    error: null,
  };
}

export async function loadReviewRunContext(
  supabase: AdminSupabase,
  agentRunId: string,
): Promise<{
  run: AgentRun | null;
  snapshot: ReviewDraftSnapshot | null;
  error: string | null;
}> {
  const loaded = await getAgentRun(supabase, agentRunId);
  if (!loaded.data || loaded.error) {
    return {
      run: null,
      snapshot: null,
      error: loaded.error ?? "Unable to load research run.",
    };
  }

  if (!getResearchPayloadFromRun(loaded.data)) {
    return {
      run: loaded.data,
      snapshot: null,
      error: "Research evidence is insufficient.",
    };
  }

  const snapshotResult = await loadReviewDraftSnapshot(supabase, loaded.data);
  return {
    run: loaded.data,
    snapshot: snapshotResult.snapshot,
    error: snapshotResult.error,
  };
}
