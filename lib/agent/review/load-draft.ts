import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import {
  buildArticleReviewFingerprintFields,
  buildLabReviewFingerprintFields,
  buildTutorialReviewFingerprintFields,
} from "@/lib/agent/review/fingerprint-core";
import {
  buildArticleDraftFromRow,
  buildLabDraftFromRow,
  buildReviewDraftSnapshot,
  buildTutorialDraftFromRow,
  parseGenerationMetadata,
  validateLinkedDraftBelongsToRun,
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
  noStore();

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

    if (
      !validateLinkedDraftBelongsToRun({
        agentRunId: run.id,
        contentAgentRunId: data.agent_run_id,
      })
    ) {
      return {
        snapshot: null,
        error: "Linked draft does not belong to this agent run.",
      };
    }

    const draft = buildArticleDraftFromRow(data, metadata, run.topic);
    return {
      snapshot: buildReviewDraftSnapshot({
        agentRunId: run.id,
        contentType: "article",
        contentId,
        status: data.status,
        publishedAt: data.published_at,
        draft,
        metadata,
        reviewFingerprintFields: buildArticleReviewFingerprintFields({
          row: data,
          metadata,
        }),
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

    if (
      !validateLinkedDraftBelongsToRun({
        agentRunId: run.id,
        contentAgentRunId: data.agent_run_id,
      })
    ) {
      return {
        snapshot: null,
        error: "Linked draft does not belong to this agent run.",
      };
    }

    const draft = buildTutorialDraftFromRow(data, metadata, run.topic);
    return {
      snapshot: buildReviewDraftSnapshot({
        agentRunId: run.id,
        contentType: "tutorial",
        contentId,
        status: data.status,
        publishedAt: data.published_at,
        draft,
        metadata,
        reviewFingerprintFields: buildTutorialReviewFingerprintFields({
          row: data,
          metadata,
        }),
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

  if (
    !validateLinkedDraftBelongsToRun({
      agentRunId: run.id,
      contentAgentRunId: data.agent_run_id,
    })
  ) {
    return {
      snapshot: null,
      error: "Linked draft does not belong to this agent run.",
    };
  }

  const draft = buildLabDraftFromRow(data, metadata, run.topic);
  return {
    snapshot: buildReviewDraftSnapshot({
      agentRunId: run.id,
      contentType: "lab",
      contentId,
      status: data.status,
      publishedAt: data.published_at,
      draft,
      metadata,
      reviewFingerprintFields: buildLabReviewFingerprintFields({
        row: data,
        metadata,
      }),
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
  noStore();

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
