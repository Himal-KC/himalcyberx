import { appendArticleKeyTakeawaysToContent } from "@/lib/articles/db-schema";
import { prepareRichContentForSave } from "@/lib/content/sanitize-on-save";
import type { GeneratedDraft } from "@/lib/agent/generation/types";
import type { AgentContentType, Article, Lab, Tutorial } from "@/lib/supabase/types";

export function buildArticleRevisionUpdatePayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  existingRow: Pick<
    Article,
    "slug" | "status" | "featured_image" | "featured_image_alt" | "category_id"
  >;
  preparedContent: string;
  featuredImageAlt: string | null;
}): Record<string, unknown> {
  return {
    title: input.draft.title.trim(),
    slug: input.existingRow.status === "published" ? input.existingRow.slug : input.draft.slug,
    excerpt: input.draft.excerpt.trim(),
    content: input.preparedContent,
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
    featured_image: input.existingRow.featured_image,
    featured_image_alt: input.featuredImageAlt ?? input.existingRow.featured_image_alt,
    category_id: input.existingRow.category_id,
  };
}

export function buildTutorialRevisionUpdatePayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "tutorial" }>;
  existingRow: Pick<Tutorial, "slug" | "status">;
}): Record<string, unknown> {
  return {
    title: input.draft.title.trim(),
    slug: input.existingRow.status === "published" ? existingRowSlug(input.existingRow) : input.draft.slug,
    description: input.draft.description.trim(),
    category: input.draft.category,
    difficulty: input.draft.difficulty,
    estimated_time: input.draft.estimatedTime,
    requirements: prepareRichContentForSave(input.draft.requirements),
    introduction: prepareRichContentForSave(input.draft.introduction),
    instructions: prepareRichContentForSave(input.draft.instructions),
    key_takeaways: prepareRichContentForSave(input.draft.keyTakeaways),
    security_notes: prepareRichContentForSave(input.draft.securityNotes),
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
  };
}

function existingRowSlug(row: Pick<Tutorial | Lab, "slug">): string {
  return row.slug;
}

export function buildLabRevisionUpdatePayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "lab" }>;
  existingRow: Pick<Lab, "slug" | "status">;
}): Record<string, unknown> {
  return {
    title: input.draft.title.trim(),
    slug: input.existingRow.status === "published" ? existingRowSlug(input.existingRow) : input.draft.slug,
    description: input.draft.description.trim(),
    category: input.draft.category,
    difficulty: input.draft.difficulty,
    estimated_time: input.draft.estimatedTime,
    learning_objectives: prepareRichContentForSave(input.draft.learningObjectives),
    requirements_tools: prepareRichContentForSave(input.draft.requirementsTools),
    introduction: prepareRichContentForSave(input.draft.introduction),
    instructions: prepareRichContentForSave(input.draft.instructions),
    expected_result: prepareRichContentForSave(input.draft.expectedResult),
    security_notes: prepareRichContentForSave(input.draft.securityNotes),
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
  };
}

export function prepareArticleRevisionContent(
  draft: Extract<GeneratedDraft, { contentType: "article" }>,
): string {
  return prepareRichContentForSave(
    appendArticleKeyTakeawaysToContent(draft.content, draft.keyTakeaways),
  );
}

export function contentTableForRevision(contentType: AgentContentType): "articles" | "tutorials" | "labs" {
  switch (contentType) {
    case "article":
      return "articles";
    case "tutorial":
      return "tutorials";
    case "lab":
      return "labs";
  }
}
