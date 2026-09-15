import "server-only";

import { resolveArticleCategoryIdForAgentSave } from "@/lib/agent/category/apply-article-category";
import { prepareRichContentForSave } from "@/lib/content/sanitize-on-save";
import {
  appendArticleKeyTakeawaysToContent,
  buildArticleDraftInsertPayload,
} from "@/lib/articles/db-schema";
import {
  buildAdminUrls,
  buildGenerateDraftResult,
  buildLabDraftInsertPayload,
  buildTutorialDraftInsertPayload,
  isDraftContentRow,
  resolveFactCheckStatus,
  targetTableForContentType,
  type DraftContentRow,
} from "@/lib/agent/generation/save-draft-core";
import type {
  GeneratedDraft,
  GenerateDraftResult,
} from "@/lib/agent/generation/types";
import {
  extractSupabaseErrorDetails,
  isTransientSupabaseError,
  logGenerationSave,
} from "@/lib/agent/generation/save-log";
import { resolveUniqueSlug } from "@/lib/agent/generation/slug";
import type {
  AgentContentType,
  AgentRun,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface SaveGeneratedDraftResult {
  result: GenerateDraftResult | null;
  error: string | null;
  stage?: "insert" | "update" | "recovery" | null;
  transient?: boolean;
}

async function findDraftByAgentRunId(
  supabase: AdminSupabase,
  contentType: AgentContentType,
  agentRunId: string,
): Promise<DraftContentRow | null> {
  const table = targetTableForContentType(contentType);
  const { data, error } = await supabase
    .from(table)
    .select("id, title, slug, status")
    .eq("agent_run_id", agentRunId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DraftContentRow;
}

async function insertDraftRow(
  supabase: AdminSupabase,
  table: ReturnType<typeof targetTableForContentType>,
  payload: Record<string, unknown>,
): Promise<{ row: Pick<DraftContentRow, "id" | "title" | "slug"> | null; error: unknown }> {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select("id, title, slug")
    .single();

  return {
    row: data as Pick<DraftContentRow, "id" | "title" | "slug"> | null,
    error,
  };
}

function buildSaveFailure(
  stage: SaveGeneratedDraftResult["stage"],
  transient = false,
): SaveGeneratedDraftResult {
  return {
    result: null,
    error: "Unable to save draft.",
    stage,
    transient,
  };
}

export async function saveGeneratedDraft({
  supabase,
  run,
  draft,
  researchQuality,
  qualityScore,
}: {
  supabase: AdminSupabase;
  run: AgentRun;
  draft: GeneratedDraft;
  researchQuality: string;
  qualityScore: number;
}): Promise<SaveGeneratedDraftResult> {
  const factCheckStatus = resolveFactCheckStatus(researchQuality);
  const targetTable = targetTableForContentType(run.content_type);
  const logContext = {
    agentRunId: run.id,
    contentType: run.content_type,
    targetTable,
  };

  const existingByRun = await findDraftByAgentRunId(
    supabase,
    run.content_type,
    run.id,
  );
  if (existingByRun && isDraftContentRow(existingByRun)) {
    logGenerationSave({
      checkpoint: "draft_insert_success",
      ...logContext,
      draftId: existingByRun.id,
      stage: "recovery_existing_draft",
    });

    return {
      result: buildGenerateDraftResult({
        contentType: run.content_type,
        row: existingByRun,
        factCheckStatus,
        qualityScore,
        warnings: draft.warnings,
        existingDraft: true,
      }),
      error: null,
      stage: "recovery",
    };
  }

  logGenerationSave({
    checkpoint: "draft_insert_start",
    ...logContext,
  });

  const slug = await resolveUniqueSlug(run.content_type, draft.slug);

  if (run.content_type === "article" && draft.contentType === "article") {
    const validatedCategoryId = await resolveArticleCategoryIdForAgentSave({
      supabase,
      run,
    });
    const articleContent = appendArticleKeyTakeawaysToContent(
      draft.content,
      draft.keyTakeaways,
    );
    const payload = buildArticleDraftInsertPayload({
      draft,
      slug,
      agentRunId: run.id,
      factCheckStatus,
      qualityScore,
      categoryId: validatedCategoryId,
      preparedContent: prepareRichContentForSave(articleContent),
    });

    const inserted = await insertDraftRow(supabase, "articles", payload);

    if (inserted.row) {
      logGenerationSave({
        checkpoint: "draft_insert_success",
        ...logContext,
        draftId: inserted.row.id,
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "article",
          row: inserted.row,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
        }),
        error: null,
        stage: "insert",
      };
    }

    const errorDetails = extractSupabaseErrorDetails(
      inserted.error as { code?: string; message?: string; details?: string; hint?: string },
    );
    logGenerationSave({
      checkpoint: "draft_insert_failed",
      ...logContext,
      stage: "insert",
      ...errorDetails,
    });

    const recovered = await findDraftByAgentRunId(supabase, run.content_type, run.id);
    if (recovered && isDraftContentRow(recovered)) {
      logGenerationSave({
        checkpoint: "rollback_success",
        ...logContext,
        draftId: recovered.id,
        stage: "recovery_after_insert_error",
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "article",
          row: recovered,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
          existingDraft: true,
        }),
        error: null,
        stage: "recovery",
      };
    }

    return buildSaveFailure(
      "insert",
      isTransientSupabaseError(inserted.error as { code?: string; message?: string }),
    );
  }

  if (run.content_type === "tutorial" && draft.contentType === "tutorial") {
    const payload = buildTutorialDraftInsertPayload({
      draft,
      slug,
      agentRunId: run.id,
      factCheckStatus,
      qualityScore,
      preparedFields: {
        requirements: prepareRichContentForSave(draft.requirements),
        introduction: prepareRichContentForSave(draft.introduction),
        instructions: prepareRichContentForSave(draft.instructions),
        keyTakeaways: prepareRichContentForSave(draft.keyTakeaways),
        securityNotes: prepareRichContentForSave(draft.securityNotes),
      },
    });

    const inserted = await insertDraftRow(supabase, "tutorials", payload);

    if (inserted.row) {
      logGenerationSave({
        checkpoint: "draft_insert_success",
        ...logContext,
        draftId: inserted.row.id,
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "tutorial",
          row: inserted.row,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
        }),
        error: null,
        stage: "insert",
      };
    }

    const errorDetails = extractSupabaseErrorDetails(
      inserted.error as { code?: string; message?: string; details?: string; hint?: string },
    );
    logGenerationSave({
      checkpoint: "draft_insert_failed",
      ...logContext,
      stage: "insert",
      ...errorDetails,
    });

    const recovered = await findDraftByAgentRunId(supabase, run.content_type, run.id);
    if (recovered && isDraftContentRow(recovered)) {
      logGenerationSave({
        checkpoint: "rollback_success",
        ...logContext,
        draftId: recovered.id,
        stage: "recovery_after_insert_error",
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "tutorial",
          row: recovered,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
          existingDraft: true,
        }),
        error: null,
        stage: "recovery",
      };
    }

    return buildSaveFailure(
      "insert",
      isTransientSupabaseError(inserted.error as { code?: string; message?: string }),
    );
  }

  if (run.content_type === "lab" && draft.contentType === "lab") {
    const payload = buildLabDraftInsertPayload({
      draft,
      slug,
      agentRunId: run.id,
      factCheckStatus,
      qualityScore,
      preparedFields: {
        learningObjectives: prepareRichContentForSave(draft.learningObjectives),
        requirementsTools: prepareRichContentForSave(draft.requirementsTools),
        introduction: prepareRichContentForSave(draft.introduction),
        instructions: prepareRichContentForSave(draft.instructions),
        expectedResult: prepareRichContentForSave(draft.expectedResult),
        securityNotes: prepareRichContentForSave(draft.securityNotes),
      },
    });

    const inserted = await insertDraftRow(supabase, "labs", payload);

    if (inserted.row) {
      logGenerationSave({
        checkpoint: "draft_insert_success",
        ...logContext,
        draftId: inserted.row.id,
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "lab",
          row: inserted.row,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
        }),
        error: null,
        stage: "insert",
      };
    }

    const errorDetails = extractSupabaseErrorDetails(
      inserted.error as { code?: string; message?: string; details?: string; hint?: string },
    );
    logGenerationSave({
      checkpoint: "draft_insert_failed",
      ...logContext,
      stage: "insert",
      ...errorDetails,
    });

    const recovered = await findDraftByAgentRunId(supabase, run.content_type, run.id);
    if (recovered && isDraftContentRow(recovered)) {
      logGenerationSave({
        checkpoint: "rollback_success",
        ...logContext,
        draftId: recovered.id,
        stage: "recovery_after_insert_error",
      });

      return {
        result: buildGenerateDraftResult({
          contentType: "lab",
          row: recovered,
          factCheckStatus,
          qualityScore,
          warnings: draft.warnings,
          existingDraft: true,
        }),
        error: null,
        stage: "recovery",
      };
    }

    return buildSaveFailure(
      "insert",
      isTransientSupabaseError(inserted.error as { code?: string; message?: string }),
    );
  }

  logGenerationSave({
    checkpoint: "draft_insert_failed",
    ...logContext,
    stage: "content_type_mismatch",
    errorMessage: "Generated output did not match the requested content type.",
  });

  return {
    result: null,
    error: "Generated output did not match the requested content type.",
    stage: "insert",
  };
}

export async function recoverDraftByAgentRunId(
  supabase: AdminSupabase,
  run: AgentRun,
): Promise<GenerateDraftResult | null> {
  const row = await findDraftByAgentRunId(supabase, run.content_type, run.id);
  if (!row || !isDraftContentRow(row)) {
    return null;
  }

  return buildGenerateDraftResult({
    contentType: run.content_type,
    row,
    factCheckStatus: run.fact_check_status ?? "pending",
    qualityScore: run.quality_score ?? 0,
    warnings: [],
    existingDraft: true,
  });
}

export function getExistingDraftFromRun(
  run: AgentRun,
): GenerateDraftResult | null {
  if (run.content_type === "article" && run.article_id) {
    const urls = buildAdminUrls("article", run.article_id);
    return {
      contentId: run.article_id,
      contentType: "article",
      editUrl: urls.editUrl,
      previewUrl: urls.previewUrl,
      title: run.topic,
      slug: "",
      factCheckStatus: run.fact_check_status ?? "pending",
      qualityScore: run.quality_score ?? 0,
      warnings: [],
      existingDraft: true,
    };
  }

  if (run.content_type === "tutorial" && run.tutorial_id) {
    const urls = buildAdminUrls("tutorial", run.tutorial_id);
    return {
      contentId: run.tutorial_id,
      contentType: "tutorial",
      editUrl: urls.editUrl,
      previewUrl: urls.previewUrl,
      title: run.topic,
      slug: "",
      factCheckStatus: run.fact_check_status ?? "pending",
      qualityScore: run.quality_score ?? 0,
      warnings: [],
      existingDraft: true,
    };
  }

  if (run.content_type === "lab" && run.lab_id) {
    const urls = buildAdminUrls("lab", run.lab_id);
    return {
      contentId: run.lab_id,
      contentType: "lab",
      editUrl: urls.editUrl,
      previewUrl: urls.previewUrl,
      title: run.topic,
      slug: "",
      factCheckStatus: run.fact_check_status ?? "pending",
      qualityScore: run.quality_score ?? 0,
      warnings: [],
      existingDraft: true,
    };
  }

  return null;
}
