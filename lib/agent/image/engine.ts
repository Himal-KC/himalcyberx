import "server-only";

import {
  buildAdminUrls,
  targetTableForContentType,
} from "@/lib/agent/generation/save-draft-core";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import {
  assertImageAttachPayloadSafe,
  buildLinkedContentImageAttachUpdate,
  contentTableForImageAttach,
} from "@/lib/agent/image/attach-core";
import { generateFeaturedImageWithOpenAi } from "@/lib/agent/image/generate";
import {
  buildAgentFeaturedImageFilename,
  buildAgentRunImageMetadataUpdate,
  buildFeaturedImageAltText,
  buildFeaturedImagePrompt,
  buildImagePromptContext,
  evaluateExistingFeaturedImageReuse,
  evaluateImageGenerationEligibility,
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_WIDTH,
  isAgentGeneratedStoragePath,
  storageFolderForContentType,
  summarizeResearchForImagePrompt,
} from "@/lib/agent/image/image-core";
import {
  logImageError,
  logImageTrace,
  sanitizePromptForLogging,
} from "@/lib/agent/image/image-log-core";
import { processFeaturedImageBuffer } from "@/lib/agent/image/process-image-core";
import { extractVerifiedConceptsForVisualBrief } from "@/lib/agent/image/image-core";
import type { GeneratedFeaturedImageResult } from "@/lib/agent/image/types";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import type { ReviewDraftSnapshot } from "@/lib/agent/review/types";
import { contentIdForRun } from "@/lib/agent/review/persist-core";
import {
  isValidAgentRunId,
  validateContentBelongsToRun,
} from "@/lib/agent/resume/resume-core";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import {
  deleteArticleImage,
  extractArticleImageStoragePath,
  uploadImageBuffer,
} from "@/lib/storage/article-images";
import { getAgentRun, updateAgentRun } from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import type { AgentReviewRow } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface RunFeaturedImageInput {
  supabase: AdminSupabase;
  agentRunId: string;
  adminUserId: string;
  forceRegenerate?: boolean;
}

export type RunFeaturedImageOutcome =
  | { ok: true; result: GeneratedFeaturedImageResult }
  | { ok: false; error: string };

const activeImageGenerations = new Map<
  string,
  Promise<RunFeaturedImageOutcome>
>();

function mapReviewStatus(
  row: AgentReviewRow | null,
): "pass" | "needs_review" | "fail" | null {
  if (!row) {
    return null;
  }

  return row.status;
}

function extractDescriptionFromSnapshot(snapshot: ReviewDraftSnapshot): string {
  if (snapshot.contentType === "article" && snapshot.draft.contentType === "article") {
    return snapshot.draft.excerpt;
  }

  if (
    snapshot.draft.contentType === "tutorial" ||
    snapshot.draft.contentType === "lab"
  ) {
    return snapshot.draft.description;
  }

  return "";
}

function extractPrimaryKeywordFromSnapshot(snapshot: ReviewDraftSnapshot): string {
  return snapshot.draft.primaryKeyword ?? "";
}

function extractContentAngleFromSnapshot(snapshot: ReviewDraftSnapshot): string {
  return snapshot.draft.generationPlan.contentAngle ?? "";
}

function extractCategoryLabelFromSnapshot(
  snapshot: ReviewDraftSnapshot,
  payload: NonNullable<ReturnType<typeof getResearchPayloadFromRun>>,
): string {
  if (snapshot.draft.contentType === "article") {
    return (
      snapshot.draft.categoryRecommendation ||
      payload.categoryRecommendation ||
      ""
    );
  }

  if (
    snapshot.draft.contentType === "tutorial" ||
    snapshot.draft.contentType === "lab"
  ) {
    return snapshot.draft.category;
  }

  return "";
}

function extractSectionFocusFromSnapshot(snapshot: ReviewDraftSnapshot): string {
  const sections = snapshot.draft.generationPlan.sectionPlan ?? [];
  return sections.slice(0, 2).join("; ");
}

function parseLatestAgentImageMetadata(run: import("@/lib/supabase/types").AgentRun): {
  storagePath: string;
  publicUrl: string;
  width?: number;
  height?: number;
  mimeType?: string;
  byteSize?: number;
} | null {
  const metadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;
  const latest = metadata?.latestFeaturedImage;
  if (!latest || typeof latest !== "object") {
    return null;
  }

  const record = latest as Record<string, unknown>;
  if (
    typeof record.storagePath !== "string" ||
    typeof record.publicUrl !== "string"
  ) {
    return null;
  }

  return {
    storagePath: record.storagePath,
    publicUrl: record.publicUrl,
    width: typeof record.width === "number" ? record.width : undefined,
    height: typeof record.height === "number" ? record.height : undefined,
    mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined,
    byteSize: typeof record.byteSize === "number" ? record.byteSize : undefined,
  };
}

async function loadLinkedContentImageState(
  supabase: AdminSupabase,
  contentType: import("@/lib/supabase/types").AgentContentType,
  contentId: string,
): Promise<{
  featured_image: string | null;
  featured_image_alt: string | null;
  status: string;
  published_at: string | null;
  fact_check_status: string | null;
  quality_score: number | null;
  agent_run_id: string | null;
} | null> {
  const table = contentTableForImageAttach(contentType);
  const { data, error } = await supabase
    .from(table)
    .select(
      "featured_image, featured_image_alt, status, published_at, fact_check_status, quality_score, agent_run_id",
    )
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function runAgentFeaturedImageGeneration(
  input: RunFeaturedImageInput,
): Promise<RunFeaturedImageOutcome> {
  const trimmedRunId = input.agentRunId.trim();
  const existing = activeImageGenerations.get(trimmedRunId);
  if (existing) {
    return existing;
  }

  const promise = runAgentFeaturedImageGenerationInternal(input).finally(() => {
    activeImageGenerations.delete(trimmedRunId);
  });
  activeImageGenerations.set(trimmedRunId, promise);
  return promise;
}

async function runAgentFeaturedImageGenerationInternal(
  input: RunFeaturedImageInput,
): Promise<RunFeaturedImageOutcome> {
  const { supabase, agentRunId, adminUserId } = input;
  const trimmedRunId = agentRunId.trim();

  logImageTrace("image_start", { agentRunId: trimmedRunId });

  if (!isValidAgentRunId(trimmedRunId)) {
    return { ok: false, error: "Invalid agent run ID." };
  }

  if (!hasOpenAiApiKey()) {
    return { ok: false, error: "OpenAI is not configured." };
  }

  const loadedRun = await getAgentRun(supabase, trimmedRunId);
  if (!loadedRun.data || loadedRun.error) {
    return {
      ok: false,
      error: loadedRun.error ?? "Unable to load research run.",
    };
  }

  const run = loadedRun.data;
  const linkedContentId = contentIdForRun(run);
  if (!linkedContentId) {
    return { ok: false, error: "No draft exists for this research run." };
  }

  const contentRow = await loadLinkedContentImageState(
    supabase,
    run.content_type,
    linkedContentId,
  );
  if (!contentRow) {
    return { ok: false, error: "Unable to load linked draft content." };
  }

  if (
    !validateContentBelongsToRun({
      run,
      content: {
        id: linkedContentId,
        title: "",
        slug: "",
        status: contentRow.status,
        agent_run_id: contentRow.agent_run_id,
      },
    })
  ) {
    return {
      ok: false,
      error: "Linked draft does not belong to this agent run.",
    };
  }

  const latestReviewResult = await getLatestAgentReviewForRun(
    supabase,
    trimmedRunId,
  );
  const reviewStatus = mapReviewStatus(latestReviewResult.data);
  const eligibility = evaluateImageGenerationEligibility({
    hasReview: Boolean(latestReviewResult.data),
    reviewStatus,
  });
  if (!eligibility.allowed) {
    logImageError({
      checkpoint: "image_start",
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      errorCode: eligibility.errorCode,
      errorMessage: eligibility.message,
    });
    return { ok: false, error: eligibility.message };
  }

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

  const forceRegenerate = input.forceRegenerate === true;
  const previousImageUrl = contentRow.featured_image;
  const previousStoragePath = previousImageUrl
    ? extractArticleImageStoragePath(previousImageUrl)
    : null;

  if (
    evaluateExistingFeaturedImageReuse({
      featuredImageUrl: previousImageUrl,
      storagePath: previousStoragePath,
      agentRunId: trimmedRunId,
      forceRegenerate,
    })
  ) {
    const latestImageMetadata = parseLatestAgentImageMetadata(run);
    const urls = buildAdminUrls(run.content_type, linkedContentId);
    logImageTrace("image_complete", {
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      model: "reused",
      width: latestImageMetadata?.width ?? FEATURED_IMAGE_WIDTH,
      height: latestImageMetadata?.height ?? FEATURED_IMAGE_HEIGHT,
      mime: latestImageMetadata?.mimeType ?? "image/webp",
      byteSize: latestImageMetadata?.byteSize,
    });

    return {
      ok: true,
      result: {
        agentRunId: trimmedRunId,
        contentType: run.content_type,
        contentId: linkedContentId,
        featuredImageUrl: previousImageUrl!,
        featuredImageAlt: contentRow.featured_image_alt ?? "",
        storagePath:
          latestImageMetadata?.storagePath ?? previousStoragePath ?? "",
        width: latestImageMetadata?.width ?? FEATURED_IMAGE_WIDTH,
        height: latestImageMetadata?.height ?? FEATURED_IMAGE_HEIGHT,
        mimeType: latestImageMetadata?.mimeType ?? "image/webp",
        byteSize: latestImageMetadata?.byteSize ?? 0,
        model: "reused",
        regenerated: false,
        reused: true,
        editUrl: urls.editUrl,
        previewUrl: urls.previewUrl,
      },
    };
  }

  const allowed = await enforceRateLimit("agent-image-generation", adminUserId);
  if (!allowed) {
    return { ok: false, error: RATE_LIMIT_MESSAGES.agentImageGeneration };
  }

  const promptContext = buildImagePromptContext({
    contentType: run.content_type,
    topic: run.topic,
    title: snapshotResult.snapshot.draft.title,
    description: extractDescriptionFromSnapshot(snapshotResult.snapshot),
    contentAngle: extractContentAngleFromSnapshot(snapshotResult.snapshot),
    primaryKeyword: extractPrimaryKeywordFromSnapshot(snapshotResult.snapshot),
    researchSummary: summarizeResearchForImagePrompt(payload.keyFindings),
    reviewSummary: latestReviewResult.data?.summary ?? "",
    categoryLabel: extractCategoryLabelFromSnapshot(snapshotResult.snapshot, payload),
    keyFindings: payload.keyFindings,
    verifiedConcepts: extractVerifiedConceptsForVisualBrief(payload.verifiedClaims),
    sectionFocus: extractSectionFocusFromSnapshot(snapshotResult.snapshot),
  });
  const prompt = buildFeaturedImagePrompt(promptContext);
  const altText = buildFeaturedImageAltText({
    visualBrief: promptContext.visualBrief,
  });

  logImageTrace("image_context_ready", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  await updateAgentRun(supabase, trimmedRunId, {
    stage: "image",
    status: "running",
    error_message: null,
  });

  logImageTrace("image_model_start", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  const generated = await generateFeaturedImageWithOpenAi(prompt);
  if (!generated.ok) {
    await updateAgentRun(supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: null,
    });
    logImageError({
      checkpoint: "image_model_start",
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      errorCode: "IMAGE_MODEL_ERROR",
      errorMessage: generated.message,
    });
    console.log("[agent-image:prompt]", {
      agentRunId: trimmedRunId,
      promptPreview: sanitizePromptForLogging(prompt),
    });
    return {
      ok: false,
      error: "Unable to generate featured image. Please try again.",
    };
  }

  logImageTrace("image_model_success", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
  });

  logImageTrace("image_processing_start", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
  });

  const processed = await processFeaturedImageBuffer(generated.result.buffer);
  if (!processed.ok) {
    await updateAgentRun(supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: null,
    });
    logImageError({
      checkpoint: "image_processing_start",
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      model: generated.result.model,
      errorCode: processed.errorCode,
      errorMessage: processed.message,
    });
    return {
      ok: false,
      error: "Unable to process featured image. Please try again.",
    };
  }

  logImageTrace("image_processing_success", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
    width: processed.image.width,
    height: processed.image.height,
    mime: processed.image.mimeType,
    byteSize: processed.image.byteSize,
  });

  logImageTrace("image_validation_success", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
    width: processed.image.width,
    height: processed.image.height,
    mime: processed.image.mimeType,
    byteSize: processed.image.byteSize,
  });

  const folder = storageFolderForContentType(run.content_type);
  const filename = buildAgentFeaturedImageFilename(trimmedRunId);

  logImageTrace("image_upload_start", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
  });

  const uploaded = await uploadImageBuffer(supabase, {
    buffer: processed.image.buffer,
    mimeType: processed.image.mimeType,
    folder,
    filename,
  });

  if (!uploaded.data || uploaded.error) {
    await updateAgentRun(supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: null,
    });
    logImageError({
      checkpoint: "image_upload_start",
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      model: generated.result.model,
      errorCode: "IMAGE_UPLOAD_FAILED",
      errorMessage: uploaded.error ?? "Upload failed.",
    });
    return {
      ok: false,
      error: "Unable to upload featured image. Please try again.",
    };
  }

  logImageTrace("image_upload_success", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
    width: processed.image.width,
    height: processed.image.height,
    mime: processed.image.mimeType,
    byteSize: processed.image.byteSize,
  });

  const attachUpdate = buildLinkedContentImageAttachUpdate({
    featuredImage: uploaded.data.publicUrl,
    featuredImageAlt: altText,
  });
  const attachSafety = assertImageAttachPayloadSafe(
    attachUpdate as Record<string, unknown>,
  );
  if (!attachSafety.safe) {
    await updateAgentRun(supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: null,
    });
    return {
      ok: false,
      error: "Unable to attach featured image safely.",
    };
  }

  logImageTrace("image_attach_start", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
  });

  const table = targetTableForContentType(run.content_type);
  const { error: attachError } = await supabase
    .from(table)
    .update(attachUpdate)
    .eq("id", linkedContentId)
    .eq("agent_run_id", trimmedRunId);

  if (attachError) {
    await updateAgentRun(supabase, trimmedRunId, {
      stage: "fact_check",
      status: "ready",
      error_message: null,
    });
    logImageError({
      checkpoint: "image_attach_start",
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      model: generated.result.model,
      errorCode: "IMAGE_ATTACH_FAILED",
      errorMessage: attachError.message,
    });
    return {
      ok: false,
      error: "Unable to attach featured image to draft.",
    };
  }

  await updateAgentRun(supabase, trimmedRunId, {
    stage: "fact_check",
    status: "ready",
    error_message: null,
    generation_metadata: buildAgentRunImageMetadataUpdate({
      existingMetadata:
        run.generation_metadata &&
        typeof run.generation_metadata === "object"
          ? (run.generation_metadata as Record<string, unknown>)
          : null,
      storagePath: uploaded.data.storagePath,
      publicUrl: uploaded.data.publicUrl,
      width: processed.image.width,
      height: processed.image.height,
      mimeType: processed.image.mimeType,
      byteSize: processed.image.byteSize,
    }),
  });

  if (
    previousStoragePath &&
    previousStoragePath !== uploaded.data.storagePath &&
    isAgentGeneratedStoragePath(previousStoragePath, trimmedRunId)
  ) {
    await deleteArticleImage(supabase, previousStoragePath);
  }

  logImageTrace("image_attach_success", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
    width: processed.image.width,
    height: processed.image.height,
    mime: processed.image.mimeType,
    byteSize: processed.image.byteSize,
  });

  logImageTrace("image_complete", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    model: generated.result.model,
    width: processed.image.width,
    height: processed.image.height,
    mime: processed.image.mimeType,
    byteSize: processed.image.byteSize,
  });

  const urls = buildAdminUrls(run.content_type, linkedContentId);

  return {
    ok: true,
    result: {
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      contentId: linkedContentId,
      featuredImageUrl: uploaded.data.publicUrl,
      featuredImageAlt: altText,
      storagePath: uploaded.data.storagePath,
      width: processed.image.width,
      height: processed.image.height,
      mimeType: processed.image.mimeType,
      byteSize: processed.image.byteSize,
      model: generated.result.model,
      regenerated: Boolean(previousImageUrl),
      reused: false,
      editUrl: urls.editUrl,
      previewUrl: urls.previewUrl,
    },
  };
}

export function resetActiveImageGenerationsForTests(): void {
  activeImageGenerations.clear();
}
