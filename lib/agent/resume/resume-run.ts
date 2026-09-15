import "server-only";

import { getExistingDraftFromRun } from "@/lib/agent/generation/save-draft";
import {
  buildGenerateDraftResult,
  targetTableForContentType,
} from "@/lib/agent/generation/save-draft-core";
import {
  getResearchPayloadFromRun,
  parsePersistedResearchPayload,
} from "@/lib/agent/generation/research-payload";
import { loadReviewRunContext } from "@/lib/agent/review/load-draft";
import {
  buildRunReviewResult,
  mapAgentReviewRowToRecord,
} from "@/lib/agent/review/map-review-core";
import {
  buildResumableAgentRunSummary,
  buildResearchResultFromPersistedRun,
  buildResumedAgentRunResult,
  isValidAgentRunId,
  mapAgentSourceToResearchSource,
  selectAutoRestoreAgentRunId,
  type AgentRunPageHydration,
  type FeaturedImageState,
  type LinkedContentRecord,
  type ResumableAgentRunSummary,
  type ResumedAgentRunResult,
  validateResumeAgentRunInput,
} from "@/lib/agent/resume/resume-core";
import {
  buildOutOfBandPublishedResult,
  buildProvenPhase8PublishedResult,
  type PublishedContentContext,
} from "@/lib/agent/publish/published-content-core";
import { getPhase8PublicationProofFromMetadata } from "@/lib/agent/publish/metadata-core";
import type { RunPublishResult } from "@/lib/agent/publish/types";
import { buildReadinessFingerprint } from "@/lib/agent/readiness/readiness-fingerprint-core";
import { loadPersistedReadinessForRun } from "@/lib/agent/readiness/engine";
import {
  getAgentRun,
  getAgentSources,
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
    .select("id, title, slug, status, agent_run_id, featured_image, featured_image_alt, seo_title, seo_description, og_title, og_description")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LinkedContentRecord;
}

function buildLatestPublishFromRun(input: {
  run: AgentRun;
  content: LinkedContentRecord;
}): RunPublishResult | null {
  const metadata =
    input.run.generation_metadata && typeof input.run.generation_metadata === "object"
      ? (input.run.generation_metadata as Record<string, unknown>)
      : null;

  const context: PublishedContentContext = {
    agentRunId: input.run.id,
    contentType: input.run.content_type,
    contentId: input.content.id,
    slug: input.content.slug,
  };

  const proof = getPhase8PublicationProofFromMetadata(metadata, {
    contentId: input.content.id,
    contentType: input.run.content_type,
  });

  if (proof) {
    return buildProvenPhase8PublishedResult({
      context,
      proof,
    });
  }

  if (input.content.status === "published") {
    return buildOutOfBandPublishedResult({ context });
  }

  return null;
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

async function hydratePersistedAgentRun(
  supabase: AdminSupabase,
  agentRunId: string,
): Promise<
  | { ok: true; hydration: AgentRunPageHydration }
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
  const payload = parsePersistedResearchPayload(run.research_payload);
  if (!payload) {
    return { ok: false, error: "Research evidence is insufficient." };
  }

  const sourcesResult = await getAgentSources(supabase, run.id);
  const research = buildResearchResultFromPersistedRun({
    run,
    payload,
    sources: (sourcesResult.data ?? []).map(mapAgentSourceToResearchSource),
  });

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

  const latestReadiness =
    reviewContext.snapshot
      ? loadPersistedReadinessForRun(
          run,
          buildReadinessFingerprint({
            snapshot: reviewContext.snapshot,
            seoFields: {
              seoTitle: content.seo_title ?? null,
              seoDescription: content.seo_description ?? null,
              ogTitle: content.og_title ?? null,
              ogDescription: content.og_description ?? null,
            },
            featuredImage: content.featured_image ?? null,
            featuredImageAlt: content.featured_image_alt ?? null,
            reviewFingerprint: latestReviewResult.data?.draft_fingerprint ?? null,
          }),
        )
      : null;

  const latestPublish = buildLatestPublishFromRun({ run, content });
  const resumed = buildResumedAgentRunResult({
    run,
    draft,
    latestReview,
    featuredImage,
    latestReadiness,
    latestPublish,
  });

  return {
    ok: true,
    hydration: {
      agentRunId: run.id,
      resumed,
      research,
      contentAwareness: payload.contentAwareness ?? null,
    },
  };
}

export async function resolveAgentPageHydration(
  supabase: AdminSupabase,
  input: {
    requestedRunId?: string | null;
    startNew?: boolean;
    summaryLimit?: number;
  },
): Promise<{
  hydration: AgentRunPageHydration | null;
  resumableRuns: ResumableAgentRunSummary[];
  hydrationError: string | null;
  activeRunId: string | null;
}> {
  const summariesResult = await loadResumableAgentRunSummaries(
    supabase,
    input.summaryLimit ?? 10,
  );
  const resumableRuns = summariesResult.data;

  if (input.startNew) {
    return {
      hydration: null,
      resumableRuns,
      hydrationError: null,
      activeRunId: null,
    };
  }

  let targetRunId: string | null = null;

  if (input.requestedRunId) {
    if (!isValidAgentRunId(input.requestedRunId)) {
      return {
        hydration: null,
        resumableRuns,
        hydrationError: "Invalid agent run ID.",
        activeRunId: null,
      };
    }
    targetRunId = input.requestedRunId.trim();
  } else {
    const listed = await listResumableAgentRuns(supabase, 10);
    if (listed.error) {
      return {
        hydration: null,
        resumableRuns,
        hydrationError: listed.error,
        activeRunId: null,
      };
    }
    targetRunId = selectAutoRestoreAgentRunId(listed.data);
  }

  if (!targetRunId) {
    return {
      hydration: null,
      resumableRuns,
      hydrationError: null,
      activeRunId: null,
    };
  }

  const outcome = await hydratePersistedAgentRun(supabase, targetRunId);
  if (!outcome.ok) {
    return {
      hydration: null,
      resumableRuns,
      hydrationError: input.requestedRunId ? outcome.error : null,
      activeRunId: null,
    };
  }

  return {
    hydration: outcome.hydration,
    resumableRuns,
    hydrationError: null,
    activeRunId: targetRunId,
  };
}

export async function resumePersistedAgentRun(
  supabase: AdminSupabase,
  agentRunId: string,
): Promise<
  | { ok: true; result: ResumedAgentRunResult }
  | { ok: false; error: string }
> {
  const outcome = await hydratePersistedAgentRun(supabase, agentRunId);
  if (!outcome.ok) {
    return outcome;
  }

  return {
    ok: true,
    result: outcome.hydration.resumed,
  };
}
