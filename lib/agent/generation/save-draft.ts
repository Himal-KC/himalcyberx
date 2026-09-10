import "server-only";

import { calculateReadTime } from "@/lib/articles/read-time";
import { prepareRichContentForSave } from "@/lib/content/sanitize-on-save";
import type {
  GeneratedDraft,
  GenerateDraftResult,
} from "@/lib/agent/generation/types";
import type {
  AgentContentType,
  AgentFactCheckStatus,
  AgentRun,
  ArticleInsert,
  LabInsert,
  TutorialInsert,
} from "@/lib/supabase/types";
import { resolveUniqueSlug } from "@/lib/agent/generation/slug";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_AUTHOR = "HimalCyberX Research";

function buildAdminUrls(
  contentType: AgentContentType,
  contentId: string,
): { editUrl: string; previewUrl: string | null } {
  switch (contentType) {
    case "article":
      return {
        editUrl: `/admin/articles/${contentId}/edit`,
        previewUrl: `/admin/articles/${contentId}/preview`,
      };
    case "tutorial":
      return {
        editUrl: `/admin/tutorials/${contentId}/edit`,
        previewUrl: null,
      };
    case "lab":
      return {
        editUrl: `/admin/labs/${contentId}/edit`,
        previewUrl: null,
      };
  }
}

function resolveFactCheckStatus(
  researchQuality: string,
): AgentFactCheckStatus {
  return researchQuality === "needs_review" ? "needs_review" : "pending";
}

export async function saveGeneratedDraft({
  supabase,
  run,
  draft,
  researchQuality,
  qualityScore,
  categoryId,
}: {
  supabase: AdminSupabase;
  run: AgentRun;
  draft: GeneratedDraft;
  researchQuality: string;
  qualityScore: number;
  categoryId?: string | null;
}): Promise<{ result: GenerateDraftResult | null; error: string | null }> {
  const factCheckStatus = resolveFactCheckStatus(researchQuality);
  const slug = await resolveUniqueSlug(run.content_type, draft.slug);

  if (run.content_type === "article" && draft.contentType === "article") {
    const payload: ArticleInsert = {
      title: draft.title.trim(),
      slug,
      excerpt: draft.excerpt.trim(),
      content: prepareRichContentForSave(draft.content),
      author: DEFAULT_AUTHOR,
      status: "draft",
      featured: false,
      content_type: "real",
      read_time: calculateReadTime(draft.content),
      seo_title: draft.seo.seoTitle,
      seo_description: draft.seo.seoDescription,
      seo_keywords: draft.seo.seoKeywords,
      og_title: draft.seo.ogTitle,
      og_description: draft.seo.ogDescription,
      key_takeaways: draft.keyTakeaways,
      ai_generated: true,
      agent_run_id: run.id,
      fact_check_status: factCheckStatus,
      quality_score: qualityScore,
    };

    if (categoryId) {
      payload.category_id = categoryId;
    }

    const { data, error } = await supabase
      .from("articles")
      .insert(payload)
      .select("id, title, slug")
      .single();

    if (error || !data) {
      return { result: null, error: "Unable to save draft." };
    }

    const urls = buildAdminUrls("article", data.id);
    return {
      result: {
        contentId: data.id,
        contentType: "article",
        editUrl: urls.editUrl,
        previewUrl: urls.previewUrl,
        title: data.title,
        slug: data.slug,
        factCheckStatus,
        qualityScore,
        warnings: draft.warnings,
        existingDraft: false,
      },
      error: null,
    };
  }

  if (run.content_type === "tutorial" && draft.contentType === "tutorial") {
    const payload: TutorialInsert = {
      title: draft.title.trim(),
      slug,
      description: draft.description.trim(),
      category: draft.category.trim(),
      difficulty: draft.difficulty,
      estimated_time: draft.estimatedTime.trim(),
      requirements: prepareRichContentForSave(draft.requirements),
      introduction: prepareRichContentForSave(draft.introduction),
      instructions: prepareRichContentForSave(draft.instructions),
      key_takeaways: prepareRichContentForSave(draft.keyTakeaways),
      security_notes: prepareRichContentForSave(draft.securityNotes),
      featured: false,
      seo_title: draft.seo.seoTitle,
      seo_description: draft.seo.seoDescription,
      seo_keywords: draft.seo.seoKeywords,
      og_title: draft.seo.ogTitle,
      og_description: draft.seo.ogDescription,
      status: "draft",
      ai_generated: true,
      agent_run_id: run.id,
      fact_check_status: factCheckStatus,
      quality_score: qualityScore,
    };

    const { data, error } = await supabase
      .from("tutorials")
      .insert(payload)
      .select("id, title, slug")
      .single();

    if (error || !data) {
      return { result: null, error: "Unable to save draft." };
    }

    const urls = buildAdminUrls("tutorial", data.id);
    return {
      result: {
        contentId: data.id,
        contentType: "tutorial",
        editUrl: urls.editUrl,
        previewUrl: urls.previewUrl,
        title: data.title,
        slug: data.slug,
        factCheckStatus,
        qualityScore,
        warnings: draft.warnings,
        existingDraft: false,
      },
      error: null,
    };
  }

  if (run.content_type === "lab" && draft.contentType === "lab") {
    const payload: LabInsert = {
      title: draft.title.trim(),
      slug,
      description: draft.description.trim(),
      category: draft.category.trim(),
      difficulty: draft.difficulty,
      estimated_time: draft.estimatedTime.trim(),
      learning_objectives: prepareRichContentForSave(draft.learningObjectives),
      requirements_tools: prepareRichContentForSave(draft.requirementsTools),
      introduction: prepareRichContentForSave(draft.introduction),
      instructions: prepareRichContentForSave(draft.instructions),
      expected_result: prepareRichContentForSave(draft.expectedResult),
      security_notes: prepareRichContentForSave(draft.securityNotes),
      featured: false,
      status: "draft",
      seo_title: draft.seo.seoTitle,
      seo_description: draft.seo.seoDescription,
      seo_keywords: draft.seo.seoKeywords,
      og_title: draft.seo.ogTitle,
      og_description: draft.seo.ogDescription,
      ai_generated: true,
      agent_run_id: run.id,
      fact_check_status: factCheckStatus,
      quality_score: qualityScore,
    };

    const { data, error } = await supabase
      .from("labs")
      .insert(payload)
      .select("id, title, slug")
      .single();

    if (error || !data) {
      return { result: null, error: "Unable to save draft." };
    }

    const urls = buildAdminUrls("lab", data.id);
    return {
      result: {
        contentId: data.id,
        contentType: "lab",
        editUrl: urls.editUrl,
        previewUrl: urls.previewUrl,
        title: data.title,
        slug: data.slug,
        factCheckStatus,
        qualityScore,
        warnings: draft.warnings,
        existingDraft: false,
      },
      error: null,
    };
  }

  return {
    result: null,
    error: "Generated output did not match the requested content type.",
  };
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
