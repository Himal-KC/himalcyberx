import type {
  GeneratedDraft,
  GenerateDraftResult,
  GenerationMetadata,
} from "./types";
import type {
  AgentContentType,
  AgentFactCheckStatus,
  AgentRunUpdate,
  ArticleInsert,
  LabInsert,
  TutorialInsert,
} from "../../supabase/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_AUTHOR = "HimalCyberX Research";

function escapePlainTextForHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Columns allowed on agent article draft INSERT — matches CMS CRUD + agent migrations. */
export const ARTICLE_DRAFT_INSERT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "author",
  "status",
  "featured",
  "content_type",
  "read_time",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "og_title",
  "og_description",
  "ai_generated",
  "agent_run_id",
  "fact_check_status",
  "quality_score",
  "category_id",
] as const;

/** Tutorial/Lab-only or legacy fields that must never appear on article INSERT. */
export const ARTICLE_FORBIDDEN_INSERT_FIELDS = [
  "key_takeaways",
  "body",
  "hcx_analysis",
  "technical_details",
  "requirements",
  "introduction",
  "instructions",
  "expected_result",
  "security_notes",
  "learning_objectives",
  "requirements_tools",
  "estimated_time",
  "description",
  "category",
  "difficulty",
  "notify_subscribers",
  "published_at",
] as const;

export const TUTORIAL_DRAFT_INSERT_FIELDS = [
  "title",
  "slug",
  "description",
  "category",
  "difficulty",
  "estimated_time",
  "requirements",
  "introduction",
  "instructions",
  "key_takeaways",
  "security_notes",
  "featured",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "og_title",
  "og_description",
  "status",
  "ai_generated",
  "agent_run_id",
  "fact_check_status",
  "quality_score",
] as const;

export const LAB_DRAFT_INSERT_FIELDS = [
  "title",
  "slug",
  "description",
  "category",
  "difficulty",
  "estimated_time",
  "learning_objectives",
  "requirements_tools",
  "introduction",
  "instructions",
  "expected_result",
  "security_notes",
  "featured",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "og_title",
  "og_description",
  "status",
  "ai_generated",
  "agent_run_id",
  "fact_check_status",
  "quality_score",
] as const;

export type DraftContentTable = "articles" | "tutorials" | "labs";

export interface DraftContentRow {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export function targetTableForContentType(
  contentType: AgentContentType,
): DraftContentTable {
  switch (contentType) {
    case "article":
      return "articles";
    case "tutorial":
      return "tutorials";
    case "lab":
      return "labs";
  }
}

export function isValidCategoryUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function resolveSafeCategoryId(
  categoryId?: string | null,
): string | null {
  if (!categoryId?.trim()) {
    return null;
  }

  const normalized = categoryId.trim();
  return isValidCategoryUuid(normalized) ? normalized : null;
}

export function normalizeQualityScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function resolveFactCheckStatus(
  researchQuality: string,
): AgentFactCheckStatus {
  return researchQuality === "needs_review" ? "needs_review" : "pending";
}

export function stripUndefinedValues<T extends Record<string, unknown>>(
  value: T,
): T {
  const result = { ...value };

  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }

  return result;
}

export function buildAdminUrls(
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

export function buildGenerateDraftResult(input: {
  contentType: AgentContentType;
  row: Pick<DraftContentRow, "id" | "title" | "slug">;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  warnings: string[];
  existingDraft?: boolean;
}): GenerateDraftResult {
  const urls = buildAdminUrls(input.contentType, input.row.id);

  return {
    contentId: input.row.id,
    contentType: input.contentType,
    editUrl: urls.editUrl,
    previewUrl: urls.previewUrl,
    title: input.row.title,
    slug: input.row.slug,
    factCheckStatus: input.factCheckStatus,
    qualityScore: normalizeQualityScore(input.qualityScore),
    warnings: input.warnings,
    existingDraft: input.existingDraft ?? false,
  };
}

export function appendArticleKeyTakeawaysToContent(
  content: string,
  keyTakeaways: string[],
): string {
  const items = keyTakeaways.map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) {
    return content;
  }

  const listItems = items
    .map((item) => `<li>${escapePlainTextForHtml(item)}</li>`)
    .join("");
  const section = `<h2>Key Takeaways</h2><ul>${listItems}</ul>`;
  const trimmedContent = content.trim();

  return trimmedContent ? `${trimmedContent}\n${section}` : section;
}

export function listUnexpectedInsertFields(
  payload: Record<string, unknown>,
  allowedFields: readonly string[],
): string[] {
  const allowed = new Set<string>(allowedFields);
  return Object.keys(payload).filter((key) => !allowed.has(key));
}

export function buildArticleDraftInsertPayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  agentRunId: string;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  categoryId?: string | null;
  preparedContent: string;
  readTime: string;
}): ArticleInsert {
  const payload: ArticleInsert = {
    title: input.draft.title.trim(),
    slug: input.slug,
    excerpt: input.draft.excerpt.trim(),
    content: input.preparedContent,
    author: DEFAULT_AUTHOR,
    status: "draft",
    featured: false,
    content_type: "real",
    read_time: input.readTime,
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
    ai_generated: true,
    agent_run_id: input.agentRunId,
    fact_check_status: input.factCheckStatus,
    quality_score: normalizeQualityScore(input.qualityScore),
  };

  const safeCategoryId = resolveSafeCategoryId(input.categoryId);
  if (safeCategoryId) {
    payload.category_id = safeCategoryId;
  }

  return payload;
}

export function buildTutorialDraftInsertPayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "tutorial" }>;
  slug: string;
  agentRunId: string;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  preparedFields: {
    requirements: string;
    introduction: string;
    instructions: string;
    keyTakeaways: string;
    securityNotes: string;
  };
}): TutorialInsert {
  return {
    title: input.draft.title.trim(),
    slug: input.slug,
    description: input.draft.description.trim(),
    category: input.draft.category.trim(),
    difficulty: input.draft.difficulty,
    estimated_time: input.draft.estimatedTime.trim(),
    requirements: input.preparedFields.requirements,
    introduction: input.preparedFields.introduction,
    instructions: input.preparedFields.instructions,
    key_takeaways: input.preparedFields.keyTakeaways,
    security_notes: input.preparedFields.securityNotes,
    featured: false,
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
    status: "draft",
    ai_generated: true,
    agent_run_id: input.agentRunId,
    fact_check_status: input.factCheckStatus,
    quality_score: normalizeQualityScore(input.qualityScore),
  };
}

export function buildLabDraftInsertPayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "lab" }>;
  slug: string;
  agentRunId: string;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  preparedFields: {
    learningObjectives: string;
    requirementsTools: string;
    introduction: string;
    instructions: string;
    expectedResult: string;
    securityNotes: string;
  };
}): LabInsert {
  return {
    title: input.draft.title.trim(),
    slug: input.slug,
    description: input.draft.description.trim(),
    category: input.draft.category.trim(),
    difficulty: input.draft.difficulty,
    estimated_time: input.draft.estimatedTime.trim(),
    learning_objectives: input.preparedFields.learningObjectives,
    requirements_tools: input.preparedFields.requirementsTools,
    introduction: input.preparedFields.introduction,
    instructions: input.preparedFields.instructions,
    expected_result: input.preparedFields.expectedResult,
    security_notes: input.preparedFields.securityNotes,
    featured: false,
    status: "draft",
    seo_title: input.draft.seo.seoTitle,
    seo_description: input.draft.seo.seoDescription,
    seo_keywords: input.draft.seo.seoKeywords,
    og_title: input.draft.seo.ogTitle,
    og_description: input.draft.seo.ogDescription,
    ai_generated: true,
    agent_run_id: input.agentRunId,
    fact_check_status: input.factCheckStatus,
    quality_score: normalizeQualityScore(input.qualityScore),
  };
}

export function buildAgentRunSaveUpdate(input: {
  contentType: AgentContentType;
  contentId: string;
  qualityScore: number;
  factCheckStatus: AgentFactCheckStatus;
  metadata: GenerationMetadata;
}): AgentRunUpdate {
  const update: AgentRunUpdate = {
    status: "ready",
    stage: "ready",
    quality_score: normalizeQualityScore(input.qualityScore),
    fact_check_status: input.factCheckStatus,
    error_message: null,
    generation_metadata: serializeGenerationMetadata(input.metadata),
  };

  if (input.contentType === "article") {
    update.article_id = input.contentId;
  } else if (input.contentType === "tutorial") {
    update.tutorial_id = input.contentId;
  } else {
    update.lab_id = input.contentId;
  }

  return stripUndefinedValues(update as Record<string, unknown>) as AgentRunUpdate;
}

export function serializeGenerationMetadata(
  metadata: GenerationMetadata,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
}

export function isDraftContentRow(row: DraftContentRow | null | undefined): boolean {
  return row?.status === "draft";
}
