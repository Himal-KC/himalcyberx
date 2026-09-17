import "server-only";

import { buildAdminUrls } from "@/lib/agent/generation/save-draft-core";
import { getResearchPayloadFromRun } from "@/lib/agent/generation/research-payload";
import { runDeterministicPreCheck } from "@/lib/agent/review/build-context-core";
import { loadReviewDraftSnapshot } from "@/lib/agent/review/load-draft";
import { contentIdForRun } from "@/lib/agent/review/persist-core";
import {
  mapAgentReviewRowToRecord,
} from "@/lib/agent/review/map-review-core";
import {
  buildAgentRunReadinessMetadataUpdate,
  buildPersistedReadinessResult,
  calculateReadinessScore,
  evaluateReadinessGate,
  getCurrentDraftFingerprintFromSnapshot,
  parsePersistedReadinessResult,
  resolveReadinessStatus,
  type ReadinessArticleContent,
  type ReadinessImageMetadata,
  type ReadinessLabContent,
  type ReadinessTutorialContent,
} from "@/lib/agent/readiness/readiness-gate-core";
import {
  readPhase5HumanReviewAcceptanceFromMetadata,
  reconcilePhase5NeedsReviewReadinessIssues,
} from "@/lib/agent/review/human-acceptance-core";
import {
  buildReadinessFingerprint,
  isPersistedReadinessStale,
} from "@/lib/agent/readiness/readiness-fingerprint-core";
import { logReadinessTrace } from "@/lib/agent/readiness/readiness-log-core";
import type { RunReadinessResult } from "@/lib/agent/readiness/types";
import {
  isValidAgentRunId,
  validateContentBelongsToRun,
} from "@/lib/agent/resume/resume-core";
import { getAgentRun, updateAgentRun } from "@/lib/supabase/admin-agent";
import { getLatestAgentReviewForRun } from "@/lib/supabase/admin-agent-review";
import type { AgentRun } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface RunReadinessInput {
  supabase: AdminSupabase;
  agentRunId: string;
}

export type RunReadinessOutcome =
  | { ok: true; result: RunReadinessResult }
  | { ok: false; error: string };

const activeReadinessEvaluations = new Map<
  string,
  Promise<RunReadinessOutcome>
>();

function parseLatestFeaturedImageMetadata(
  metadata: Record<string, unknown> | null,
): ReadinessImageMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const latest = metadata.latestFeaturedImage;
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
    attachedAt: String(record.attachedAt ?? ""),
    width: typeof record.width === "number" ? record.width : undefined,
    height: typeof record.height === "number" ? record.height : undefined,
    mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined,
    byteSize: typeof record.byteSize === "number" ? record.byteSize : undefined,
  };
}

async function loadReadinessContentRow(
  supabase: AdminSupabase,
  run: AgentRun,
  contentId: string,
): Promise<{
  content: ReadinessArticleContent | ReadinessTutorialContent | ReadinessLabContent;
  agentRunId: string | null;
} | null> {
  if (run.content_type === "article") {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, content, author, category_id, status, featured_image, featured_image_alt, seo_title, seo_description, og_title, og_description, fact_check_status, agent_run_id",
      )
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      content: {
        contentType: "article",
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        author: data.author,
        categoryId: data.category_id,
        status: data.status,
        featuredImage: data.featured_image,
        featuredImageAlt: data.featured_image_alt,
        seoTitle: data.seo_title,
        seoDescription: data.seo_description,
        ogTitle: data.og_title,
        ogDescription: data.og_description,
        factCheckStatus: data.fact_check_status,
      },
      agentRunId: data.agent_run_id,
    };
  }

  if (run.content_type === "tutorial") {
    const { data, error } = await supabase
      .from("tutorials")
      .select(
        "id, title, slug, description, category, difficulty, estimated_time, requirements, introduction, instructions, key_takeaways, security_notes, status, featured_image, featured_image_alt, seo_title, seo_description, og_title, og_description, fact_check_status, agent_run_id",
      )
      .eq("id", contentId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      content: {
        contentType: "tutorial",
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description ?? "",
        category: data.category,
        difficulty: data.difficulty,
        estimatedTime: data.estimated_time,
        requirements: data.requirements,
        introduction: data.introduction,
        instructions: data.instructions,
        keyTakeaways: data.key_takeaways,
        securityNotes: data.security_notes,
        status: data.status,
        featuredImage: data.featured_image,
        featuredImageAlt: data.featured_image_alt,
        seoTitle: data.seo_title,
        seoDescription: data.seo_description,
        ogTitle: data.og_title,
        ogDescription: data.og_description,
        factCheckStatus: data.fact_check_status,
      },
      agentRunId: data.agent_run_id,
    };
  }

  const { data, error } = await supabase
    .from("labs")
    .select(
      "id, title, slug, description, category, difficulty, estimated_time, learning_objectives, requirements_tools, introduction, instructions, expected_result, security_notes, status, featured_image, featured_image_alt, seo_title, seo_description, og_title, og_description, fact_check_status, agent_run_id",
    )
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    content: {
      contentType: "lab",
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description ?? "",
      category: data.category,
      difficulty: data.difficulty,
      estimatedTime: data.estimated_time,
      learningObjectives: data.learning_objectives,
      requirementsTools: data.requirements_tools,
      introduction: data.introduction,
      instructions: data.instructions,
      expectedResult: data.expected_result,
      securityNotes: data.security_notes,
      status: data.status,
      featuredImage: data.featured_image,
      featuredImageAlt: data.featured_image_alt,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      ogTitle: data.og_title,
      ogDescription: data.og_description,
      factCheckStatus: data.fact_check_status,
    },
    agentRunId: data.agent_run_id,
  };
}

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

export async function runAgentReadinessEvaluation(
  input: RunReadinessInput,
): Promise<RunReadinessOutcome> {
  const trimmedRunId = input.agentRunId.trim();
  const existing = activeReadinessEvaluations.get(trimmedRunId);
  if (existing) {
    return existing;
  }

  const promise = runAgentReadinessEvaluationInternal(input).finally(() => {
    activeReadinessEvaluations.delete(trimmedRunId);
  });
  activeReadinessEvaluations.set(trimmedRunId, promise);
  return promise;
}

async function runAgentReadinessEvaluationInternal(
  input: RunReadinessInput,
): Promise<RunReadinessOutcome> {
  const { supabase } = input;
  const trimmedRunId = input.agentRunId.trim();

  logReadinessTrace("readiness_start", { agentRunId: trimmedRunId });

  if (!isValidAgentRunId(trimmedRunId)) {
    return { ok: false, error: "Invalid agent run ID." };
  }

  const loadedRun = await getAgentRun(supabase, trimmedRunId);
  if (!loadedRun.data || loadedRun.error) {
    return {
      ok: false,
      error: loadedRun.error ?? "Unable to load research run.",
    };
  }

  const run = loadedRun.data;
  const contentId = contentIdForRun(run);
  if (!contentId) {
    return { ok: false, error: "No draft exists for this research run." };
  }

  const loadedContent = await loadReadinessContentRow(supabase, run, contentId);
  if (!loadedContent) {
    return { ok: false, error: "Unable to load linked draft content." };
  }

  const { content, agentRunId: linkedAgentRunId } = loadedContent;

  if (
    !validateContentBelongsToRun({
      run,
      content: {
        id: content.id,
        title: content.title,
        slug: content.slug,
        status: content.status,
        agent_run_id: linkedAgentRunId,
      },
    })
  ) {
    return {
      ok: false,
      error: "Linked draft does not belong to this agent run.",
    };
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

  logReadinessTrace("readiness_context_ready", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  const latestReviewResult = await getLatestAgentReviewForRun(
    supabase,
    trimmedRunId,
  );
  const reviewRecord = latestReviewResult.data
    ? mapAgentReviewRowToRecord(latestReviewResult.data, false)
    : null;

  logReadinessTrace("readiness_review_checked", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  const { getAgentSources } = await import("@/lib/supabase/admin-agent");
  const sourcesResult = await getAgentSources(supabase, trimmedRunId);
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

  logReadinessTrace("readiness_sources_checked", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  const currentDraftFingerprint = getCurrentDraftFingerprintFromSnapshot(
    snapshotResult.snapshot,
  );
  const reviewFingerprint = reviewRecord?.draftFingerprint ?? null;
  const fingerprint = buildReadinessFingerprint({
    snapshot: snapshotResult.snapshot,
    seoFields: {
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription,
      ogTitle: content.ogTitle,
      ogDescription: content.ogDescription,
    },
    featuredImage: content.featuredImage,
    featuredImageAlt: content.featuredImageAlt,
    reviewFingerprint,
  });

  const existingMetadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;
  const phase5HumanAcceptance = readPhase5HumanReviewAcceptanceFromMetadata(
    existingMetadata,
  );
  const gate = evaluateReadinessGate({
    content,
    review: reviewRecord,
    currentDraftFingerprint,
    groundingAudit,
    invalidSourceUrls: groundingAudit.invalidSourceUrls,
    invalidInternalLinks: groundingAudit.invalidInternalLinks,
    latestFeaturedImage: parseLatestFeaturedImageMetadata(existingMetadata),
    categoriesAvailable: await categoriesAvailable(supabase),
    phase5HumanAcceptance,
  });

  logReadinessTrace("readiness_cms_checked", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });
  logReadinessTrace("readiness_seo_checked", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });
  logReadinessTrace("readiness_image_checked", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
  });

  const persisted = buildPersistedReadinessResult({
    status: gate.status,
    readinessScore: gate.readinessScore,
    fingerprint,
    reviewFingerprint,
    stale: false,
    issues: gate.issues,
    checks: gate.checks,
  });

  await updateAgentRun(supabase, trimmedRunId, {
    stage: "fact_check",
    status: "ready",
    error_message: null,
    generation_metadata: buildAgentRunReadinessMetadataUpdate({
      existingMetadata,
      readiness: persisted,
    }),
  });

  const urls = buildAdminUrls(run.content_type, contentId);
  const blockingIssues = persisted.issues.filter(
    (entry) => entry.severity === "blocking",
  );
  const warningIssues = persisted.issues.filter(
    (entry) => entry.severity === "warning",
  );

  logReadinessTrace("readiness_complete", {
    agentRunId: trimmedRunId,
    contentType: run.content_type,
    status: persisted.status,
    readinessScore: persisted.readinessScore,
    issueCodes: persisted.issues.map((entry) => entry.code),
    blockingIssueCount: blockingIssues.length,
    warningIssueCount: warningIssues.length,
  });

  return {
    ok: true,
    result: {
      agentRunId: trimmedRunId,
      contentType: run.content_type,
      contentId,
      status: persisted.status,
      readinessScore: persisted.readinessScore,
      fingerprint: persisted.fingerprint,
      stale: false,
      phase5Status: reviewRecord?.status ?? null,
      phase5QualityScore: reviewRecord?.qualityScore ?? null,
      issues: persisted.issues,
      blockingIssues,
      warningIssues,
      passedChecks: gate.passedChecks,
      checks: persisted.checks,
      editUrl: urls.editUrl,
      previewUrl: urls.previewUrl,
    },
  };
}

export function resetActiveReadinessEvaluationsForTests(): void {
  activeReadinessEvaluations.clear();
}

export function loadPersistedReadinessForRun(
  run: AgentRun,
  currentFingerprint: string,
  options?: {
    review?: {
      status: string;
      qualityScore: number;
      id?: string;
      draftFingerprint?: string | null;
      agentRunId?: string;
    } | null;
    currentDraftFingerprint?: string | null;
    phase5HumanAcceptance?: import("@/lib/agent/review/human-acceptance-core").Phase5HumanReviewAcceptanceRecord | null;
    reviewRecord?: import("@/lib/agent/review/types").AgentReviewRecord | null;
  },
): RunReadinessResult | null {
  const metadata =
    run.generation_metadata && typeof run.generation_metadata === "object"
      ? (run.generation_metadata as Record<string, unknown>)
      : null;
  const persisted = parsePersistedReadinessResult(metadata?.finalReadiness);
  if (!persisted) {
    return null;
  }

  const contentId = contentIdForRun(run);
  if (!contentId) {
    return null;
  }

  const urls = buildAdminUrls(run.content_type, contentId);
  const stale = isPersistedReadinessStale({
    persistedFingerprint: persisted.fingerprint,
    currentFingerprint,
  });
  const review = options?.review ?? null;
  const acceptance =
    options?.phase5HumanAcceptance ??
    readPhase5HumanReviewAcceptanceFromMetadata(metadata);
  const currentDraftFingerprint =
    options?.currentDraftFingerprint?.trim() || null;
  const reviewRecord = options?.reviewRecord ?? null;

  let issues = persisted.issues;
  let status = persisted.status;
  let readinessScore = persisted.readinessScore;

  if (reviewRecord && currentDraftFingerprint) {
    const reconciled = reconcilePhase5NeedsReviewReadinessIssues({
      issues: persisted.issues,
      acceptance,
      agentRunId: run.id,
      review: reviewRecord,
      currentDraftFingerprint,
    });
    issues = reconciled;
    status = resolveReadinessStatus(reconciled);
    readinessScore = calculateReadinessScore(reconciled);
  }

  const blockingIssues = issues.filter(
    (entry) => entry.severity === "blocking",
  );
  const warningIssues = issues.filter(
    (entry) => entry.severity === "warning",
  );

  return {
    agentRunId: run.id,
    contentType: run.content_type,
    contentId,
    status,
    readinessScore,
    fingerprint: persisted.fingerprint,
    stale,
    phase5Status: review?.status ?? null,
    phase5QualityScore: review?.qualityScore ?? null,
    issues,
    blockingIssues,
    warningIssues,
    passedChecks: [],
    checks: persisted.checks,
    editUrl: urls.editUrl,
    previewUrl: urls.previewUrl,
  };
}
