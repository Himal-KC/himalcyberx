import "server-only";

import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import {
  mapAgentReviewRowToRecord,
} from "@/lib/agent/review/map-review-core";
import { contentIdForRun } from "@/lib/agent/review/persist-core";
import {
  buildReadinessFingerprint,
} from "@/lib/agent/readiness/readiness-fingerprint-core";
import {
  getCurrentDraftFingerprintFromSnapshot,
} from "@/lib/agent/readiness/readiness-gate-core";
import {
  evaluatePublishEligibility,
  parseFinalReadinessFromMetadata,
  type PublishContentRowSnapshot,
} from "@/lib/agent/publish/eligibility-core";
import { validatePublishCmsState } from "@/lib/agent/publish/cms-validation-core";
import {
  buildAgentRunPublicationMetadataUpdate,
  buildAgentRunReconciliationMetadataUpdate,
  buildPublicationAuditFromAttempt,
  getPhase8PublicationProofFromMetadata,
  type Phase8PublicationAudit,
} from "@/lib/agent/publish/metadata-core";
import { buildAgentContentPublicUrl } from "@/lib/agent/publish/public-url-core";
import {
  buildAlreadyPublishedResult,
  buildOutOfBandPublishedResult,
  type PublishedContentContext,
} from "@/lib/agent/publish/published-content-core";
import type { RunPublishResult } from "@/lib/agent/publish/types";
import {
  publishDraftContentRow,
  revalidatePublishedContentPaths,
} from "@/lib/content/publish-content-core";
import {
  isValidAgentRunId,
  validateContentBelongsToRun,
} from "@/lib/agent/resume/resume-core";
import { getAgentRun, updateAgentRun } from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import type { AgentRun } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface RunAgentPublishInput {
  supabase: AdminSupabase;
  agentRunId: string;
}

export type RunAgentPublishOutcome =
  | { ok: true; result: RunPublishResult }
  | { ok: false; result: RunPublishResult };

async function categoriesAvailable(
  supabase: AdminSupabase,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

async function loadPublishContentSnapshot(
  supabase: AdminSupabase,
  run: AgentRun,
  contentId: string,
): Promise<PublishContentRowSnapshot | null> {
  if (run.content_type === "article") {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, content, author, category_id, status, featured_image, featured_image_alt, seo_title, seo_description, og_title, og_description, agent_run_id",
      )
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      contentType: "article",
      id: data.id,
      slug: data.slug,
      status: data.status,
      agentRunId: data.agent_run_id,
      title: data.title,
      excerpt: data.excerpt ?? "",
      content: data.content ?? "",
      author: data.author,
      categoryId: data.category_id,
      featuredImage: data.featured_image,
      featuredImageAlt: data.featured_image_alt,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      ogTitle: data.og_title,
      ogDescription: data.og_description,
    };
  }

  if (run.content_type === "tutorial") {
    const { data, error } = await supabase
      .from("tutorials")
      .select(
        "id, title, slug, description, category, difficulty, estimated_time, requirements, introduction, instructions, key_takeaways, security_notes, status, featured_image, agent_run_id",
      )
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      contentType: "tutorial",
      id: data.id,
      slug: data.slug,
      status: data.status,
      agentRunId: data.agent_run_id,
      title: data.title,
      description: data.description ?? "",
      category: data.category,
      difficulty: data.difficulty,
      estimatedTime: data.estimated_time,
      requirements: data.requirements,
      introduction: data.introduction ?? "",
      instructions: data.instructions ?? "",
      keyTakeaways: data.key_takeaways,
      securityNotes: data.security_notes,
      featuredImage: data.featured_image,
    };
  }

  const { data, error } = await supabase
    .from("labs")
    .select(
      "id, title, slug, description, category, difficulty, estimated_time, learning_objectives, requirements_tools, introduction, instructions, expected_result, security_notes, status, featured_image, agent_run_id",
    )
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    contentType: "lab",
    id: data.id,
    slug: data.slug,
    status: data.status,
    agentRunId: data.agent_run_id,
    title: data.title,
    description: data.description ?? "",
    category: data.category,
    difficulty: data.difficulty,
    estimatedTime: data.estimated_time,
    learningObjectives: data.learning_objectives,
    requirementsTools: data.requirements_tools,
    introduction: data.introduction ?? "",
    instructions: data.instructions ?? "",
    expectedResult: data.expected_result,
    securityNotes: data.security_notes,
    featuredImage: data.featured_image,
  };
}

function buildFailureResult(input: {
  agentRunId: string;
  run: AgentRun | null;
  content: PublishContentRowSnapshot | null;
  code: RunPublishResult["code"];
  message: string;
  alreadyPublished?: boolean;
  publishedAt?: string | null;
  notificationOutcome?: RunPublishResult["notificationOutcome"];
}): RunPublishResult {
  return {
    agentRunId: input.agentRunId,
    contentType: input.run?.content_type ?? input.content?.contentType ?? "article",
    contentId: input.content?.id ?? contentIdForRun(input.run ?? ({} as AgentRun)) ?? "",
    code: input.code,
    message: input.message,
    success: false,
    alreadyPublished: input.alreadyPublished ?? false,
    publishedAt: input.publishedAt ?? null,
    publicUrl: input.content
      ? buildAgentContentPublicUrl(
          input.content.contentType,
          input.content.slug,
        )
      : null,
    slug: input.content?.slug ?? null,
    notificationOutcome: input.notificationOutcome ?? null,
  };
}

function buildSuccessResult(input: {
  agentRunId: string;
  run: AgentRun;
  content: PublishContentRowSnapshot;
  code: "PUBLISHED" | "ALREADY_PUBLISHED";
  message: string;
  alreadyPublished: boolean;
  publishedAt: string | null;
  notificationOutcome: RunPublishResult["notificationOutcome"];
}): RunPublishResult {
  return {
    agentRunId: input.agentRunId,
    contentType: input.run.content_type,
    contentId: input.content.id,
    code: input.code,
    message: input.message,
    success: true,
    alreadyPublished: input.alreadyPublished,
    publishedAt: input.publishedAt,
    publicUrl: buildAgentContentPublicUrl(input.run.content_type, input.content.slug),
    slug: input.content.slug,
    notificationOutcome: input.notificationOutcome,
  };
}

async function reconcileCompletedRun(input: {
  supabase: AdminSupabase;
  run: AgentRun;
  content: PublishContentRowSnapshot;
  existingMetadata: Record<string, unknown> | null;
  proof: Phase8PublicationAudit & { result: "PUBLISHED" };
}): Promise<RunPublishResult> {
  const context: PublishedContentContext = {
    agentRunId: input.run.id,
    contentType: input.run.content_type,
    contentId: input.content.id,
    slug: input.content.slug,
    publishedAt: input.proof.publishedAt,
  };

  if (input.run.stage !== "completed" || input.run.status !== "completed") {
    await updateAgentRun(input.supabase, input.run.id, {
      stage: "completed",
      status: "completed",
      error_message: null,
      completed_at: input.run.completed_at ?? new Date().toISOString(),
      generation_metadata: buildAgentRunReconciliationMetadataUpdate({
        existingMetadata: input.existingMetadata,
        proof: input.proof,
        reconciledAt: new Date().toISOString(),
      }),
    });
  }

  return buildAlreadyPublishedResult({
    context,
    proof: input.proof,
  });
}

function buildPublishedContentContext(input: {
  run: AgentRun;
  content: PublishContentRowSnapshot;
}): PublishedContentContext {
  return {
    agentRunId: input.run.id,
    contentType: input.run.content_type,
    contentId: input.content.id,
    slug: input.content.slug,
  };
}

async function handleAlreadyPublishedContent(input: {
  supabase: AdminSupabase;
  run: AgentRun;
  content: PublishContentRowSnapshot;
  existingMetadata: Record<string, unknown> | null;
}): Promise<RunAgentPublishOutcome> {
  const proof = getPhase8PublicationProofFromMetadata(input.existingMetadata, {
    contentId: input.content.id,
    contentType: input.run.content_type,
  });

  if (proof) {
    const reconciled = await reconcileCompletedRun({
      supabase: input.supabase,
      run: input.run,
      content: input.content,
      existingMetadata: input.existingMetadata,
      proof,
    });
    return { ok: true, result: reconciled };
  }

  return {
    ok: false,
    result: buildOutOfBandPublishedResult({
      context: buildPublishedContentContext(input),
    }),
  };
}

async function claimPublishingRun(
  supabase: AdminSupabase,
  runId: string,
): Promise<{ claimed: AgentRun | null; inProgress: boolean }> {
  const { data, error } = await supabase
    .from("agent_runs")
    .update({
      stage: "publishing",
      status: "running",
      error_message: null,
    })
    .eq("id", runId)
    .eq("status", "ready")
    .in("stage", ["ready", "fact_check"])
    .select("*")
    .maybeSingle();

  if (error) {
    return { claimed: null, inProgress: false };
  }

  if (data) {
    return { claimed: data as AgentRun, inProgress: false };
  }

  const loaded = await getAgentRun(supabase, runId);
  if (
    loaded.data?.stage === "publishing" &&
    loaded.data.status === "running"
  ) {
    return { claimed: null, inProgress: true };
  }

  return { claimed: null, inProgress: false };
}

export async function runAgentContentPublication(
  input: RunAgentPublishInput,
): Promise<RunAgentPublishOutcome> {
  const trimmedRunId = input.agentRunId.trim();

  if (!isValidAgentRunId(trimmedRunId)) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run: null,
        content: null,
        code: "CONTENT_INVALID",
        message: "Invalid agent run ID.",
      }),
    };
  }

  const loadedRun = await getAgentRun(input.supabase, trimmedRunId);
  if (!loadedRun.data || loadedRun.error) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run: null,
        content: null,
        code: "CONTENT_MISSING",
        message: loadedRun.error ?? "Unable to load agent run.",
      }),
    };
  }

  const run = loadedRun.data;
  const contentId = contentIdForRun(run);
  if (!contentId) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content: null,
        code: "CONTENT_MISSING",
        message: "No linked draft content exists for this agent run.",
      }),
    };
  }

  const content = await loadPublishContentSnapshot(
    input.supabase,
    run,
    contentId,
  );
  if (!content) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content: null,
        code: "CONTENT_MISSING",
        message: "Unable to load linked draft content.",
      }),
    };
  }

  if (
    !validateContentBelongsToRun({
      run,
      content: {
        id: content.id,
        title: content.title,
        slug: content.slug,
        status: content.status,
        agent_run_id: content.agentRunId,
      },
    })
  ) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content,
        code: "CONTENT_MISMATCH",
        message: "Linked draft does not belong to this agent run.",
      }),
    };
  }

  const snapshotResult = await loadReviewDraftSnapshot(input.supabase, run);
  const currentDraftFingerprint = snapshotResult.snapshot
    ? getCurrentDraftFingerprintFromSnapshot(snapshotResult.snapshot)
    : null;

  const latestReviewResult = await getLatestAgentReviewForRun(
    input.supabase,
    trimmedRunId,
  );
  const reviewRecord = latestReviewResult.data
    ? mapAgentReviewRowToRecord(latestReviewResult.data, false)
    : null;

  const existingMetadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;
  const finalReadiness = parseFinalReadinessFromMetadata(existingMetadata);

  const currentReadinessFingerprint =
    snapshotResult.snapshot && content
      ? buildReadinessFingerprint({
          snapshot: snapshotResult.snapshot,
          seoFields:
            content.contentType === "article"
              ? {
                  seoTitle: content.seoTitle,
                  seoDescription: content.seoDescription,
                  ogTitle: content.ogTitle,
                  ogDescription: content.ogDescription,
                }
              : {
                  seoTitle: null,
                  seoDescription: null,
                  ogTitle: null,
                  ogDescription: null,
                },
          featuredImage: content.featuredImage,
          featuredImageAlt:
            content.contentType === "article" ? content.featuredImageAlt : null,
          reviewFingerprint: reviewRecord?.draftFingerprint ?? null,
        })
      : "";

  if (content.status === "published") {
    return handleAlreadyPublishedContent({
      supabase: input.supabase,
      run,
      content,
      existingMetadata,
    });
  }

  const eligibility = evaluatePublishEligibility({
    agentRunId: trimmedRunId,
    runStage: run.stage,
    runStatus: run.status,
    content,
    review: reviewRecord,
    finalReadiness,
    currentReadinessFingerprint,
    currentDraftFingerprint: currentDraftFingerprint ?? "",
    categoriesAvailable: await categoriesAvailable(input.supabase),
  });

  if (!eligibility.eligible) {
    if (eligibility.code === "ALREADY_PUBLISHED") {
      return handleAlreadyPublishedContent({
        supabase: input.supabase,
        run,
        content,
        existingMetadata,
      });
    }

    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content,
        code: eligibility.code,
        message: eligibility.message,
      }),
    };
  }

  const cmsValidation = validatePublishCmsState({
    content,
    categoriesAvailable: await categoriesAvailable(input.supabase),
  });
  if (!cmsValidation.valid) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content,
        code: "CONTENT_INVALID",
        message: cmsValidation.message,
      }),
    };
  }

  const claim = await claimPublishingRun(input.supabase, trimmedRunId);
  if (claim.inProgress) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content,
        code: "PUBLISH_IN_PROGRESS",
        message: "Publication is already in progress for this agent run.",
      }),
    };
  }

  if (!claim.claimed) {
    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run,
        content,
        code: "PUBLISH_FAILED",
        message: "Unable to start publication for this agent run.",
      }),
    };
  }

  const publishOutcome = await publishDraftContentRow({
    supabase: input.supabase,
    contentType: run.content_type,
    contentId: content.id,
  });

  if (!publishOutcome.ok) {
    if (publishOutcome.code === "ALREADY_PUBLISHED" && publishOutcome.published) {
      const publishedContent = {
        ...content,
        status: "published",
        slug: publishOutcome.published.slug,
      };
      const claimMetadata =
        claim.claimed.generation_metadata &&
        typeof claim.claimed.generation_metadata === "object"
          ? (claim.claimed.generation_metadata as Record<string, unknown>)
          : existingMetadata;
      const proof = getPhase8PublicationProofFromMetadata(claimMetadata, {
        contentId: content.id,
        contentType: run.content_type,
      });

      if (proof) {
        const reconciled = await reconcileCompletedRun({
          supabase: input.supabase,
          run: claim.claimed,
          content: publishedContent,
          existingMetadata: claimMetadata,
          proof,
        });
        return { ok: true, result: reconciled };
      }

      await updateAgentRun(input.supabase, trimmedRunId, {
        stage: "fact_check",
        status: "ready",
        error_message: null,
      });

      return {
        ok: false,
        result: buildOutOfBandPublishedResult({
          context: {
            ...buildPublishedContentContext({ run: claim.claimed, content: publishedContent }),
            publishedAt: publishOutcome.published.published_at,
          },
        }),
      };
    }

    await updateAgentRun(input.supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: publishOutcome.message,
      generation_metadata: buildAgentRunPublicationMetadataUpdate({
        existingMetadata,
        audit: buildPublicationAuditFromAttempt({
          contentType: run.content_type,
          contentId: content.id,
          readinessFingerprint: finalReadiness?.fingerprint ?? null,
          result: publishOutcome.code === "CONTENT_NOT_DRAFT"
            ? "CONTENT_NOT_DRAFT"
            : "PUBLISH_FAILED",
          notificationOutcome: null,
          errorMessage: publishOutcome.message,
        }),
      }),
    });

    return {
      ok: false,
      result: buildFailureResult({
        agentRunId: trimmedRunId,
        run: claim.claimed,
        content,
        code:
          publishOutcome.code === "CONTENT_NOT_DRAFT"
            ? "CONTENT_NOT_DRAFT"
            : "PUBLISH_FAILED",
        message: publishOutcome.message,
      }),
    };
  }

  try {
    revalidatePublishedContentPaths(run.content_type, publishOutcome.published.slug);
  } catch {
    // Content remains published even if cache revalidation fails.
  }

  const completedAt = new Date().toISOString();
  const finalizeResult = await updateAgentRun(input.supabase, trimmedRunId, {
    stage: "completed",
    status: "completed",
    error_message: null,
    completed_at: completedAt,
    generation_metadata: buildAgentRunPublicationMetadataUpdate({
      existingMetadata,
      audit: buildPublicationAuditFromAttempt({
        contentType: run.content_type,
        contentId: content.id,
        readinessFingerprint: finalReadiness?.fingerprint ?? null,
        result: "PUBLISHED",
        publishedAt: publishOutcome.published.published_at,
        publicUrl: buildAgentContentPublicUrl(
          run.content_type,
          publishOutcome.published.slug,
        ),
        notificationOutcome: publishOutcome.notificationOutcome,
      }),
    }),
  });

  if (finalizeResult.error) {
    return {
      ok: true,
      result: buildSuccessResult({
        agentRunId: trimmedRunId,
        run: claim.claimed,
        content: {
          ...content,
          slug: publishOutcome.published.slug,
        },
        code: "PUBLISHED",
        message:
          "Content was published successfully, but the agent run could not be finalized. Retry to reconcile run state.",
        alreadyPublished: false,
        publishedAt: publishOutcome.published.published_at,
        notificationOutcome: publishOutcome.notificationOutcome,
      }),
    };
  }

  return {
    ok: true,
    result: buildSuccessResult({
      agentRunId: trimmedRunId,
      run: finalizeResult.data ?? claim.claimed,
      content: {
        ...content,
        slug: publishOutcome.published.slug,
      },
      code: "PUBLISHED",
      message: "Content published successfully.",
      alreadyPublished: false,
      publishedAt: publishOutcome.published.published_at,
      notificationOutcome: publishOutcome.notificationOutcome,
    }),
  };
}

export function buildRunPublishResultFromCode(input: {
  agentRunId: string;
  code: RunPublishResult["code"];
  message: string;
}): RunPublishResult {
  return buildFailureResult({
    agentRunId: input.agentRunId,
    run: null,
    content: null,
    code: input.code,
    message: input.message,
  });
}
