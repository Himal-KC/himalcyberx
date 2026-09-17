/**
 * Authoritative public.articles column contract for persistence.
 *
 * Derived from:
 * - lib/articles/insert-payload.ts (production CMS create path)
 * - supabase/articles-publishing-migration.sql
 * - supabase/agent-foundation-migration.sql
 *
 * Production PGRST204 failures confirm these are NOT articles columns:
 * - key_takeaways (tutorials only)
 * - read_time (derived at display time from content)
 * - body, hcx_analysis, technical_details (stale TypeScript only)
 */

import type { AgentFactCheckStatus } from "../supabase/types";
import type { GeneratedDraft } from "../agent/generation/types";

/** Columns used by the working CMS article create/update path. */
export const ARTICLE_CMS_INSERT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "author",
  "status",
  "featured",
  "content_type",
  "category_id",
  "published_at",
  "featured_image",
  "featured_image_alt",
  "seo_title",
  "seo_description",
  "og_title",
  "og_description",
] as const;

/** Agent metadata columns added by agent-foundation-migration.sql. */
export const ARTICLE_AGENT_METADATA_FIELDS = [
  "seo_keywords",
  "agent_run_id",
  "ai_generated",
  "quality_score",
  "fact_check_status",
  "last_verified_at",
] as const;

/**
 * Confirmed articles table columns (CMS baseline + applied agent migrations).
 * Excludes auto-managed id/created_at/updated_at and optional CMS-only fields
 * not set by the agent draft path (featured_image, published_at, etc.).
 */
export const ARTICLE_DB_COLUMNS = [
  ...ARTICLE_CMS_INSERT_FIELDS,
  ...ARTICLE_AGENT_METADATA_FIELDS,
] as const;

export type ArticleDbColumn = (typeof ARTICLE_DB_COLUMNS)[number];

/**
 * Strict whitelist for HCX agent article draft INSERT payloads.
 * CMS baseline subset + agent metadata, excluding draft-only omissions
 * (published_at, last_verified_at, featured_image*).
 */
export const ARTICLE_AGENT_DRAFT_INSERT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "author",
  "status",
  "featured",
  "content_type",
  "category_id",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "og_title",
  "og_description",
  "ai_generated",
  "agent_run_id",
  "fact_check_status",
  "quality_score",
] as const;

export type ArticleAgentDraftInsertField =
  (typeof ARTICLE_AGENT_DRAFT_INSERT_FIELDS)[number];

/** Fields that must never appear on agent article INSERT payloads. */
export const ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS = [
  "key_takeaways",
  "read_time",
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
  "published_at",
  "last_verified_at",
  "notify_subscribers",
] as const;

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

function normalizeQualityScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function resolveSafeCategoryId(categoryId?: string | null): string | null {
  if (!categoryId?.trim()) {
    return null;
  }

  const normalized = categoryId.trim();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

export function appendArticleKeyTakeawaysToContent(
  content: string,
  keyTakeaways: string[],
): string {
  const items = keyTakeaways.map((item) => item.trim()).filter(Boolean);
  const trimmedContent = content.trim();

  if (items.length === 0) {
    return trimmedContent;
  }

  if (/<h2[^>]*>\s*Key Takeaways\s*<\/h2>/i.test(trimmedContent)) {
    return trimmedContent;
  }

  const listItems = items
    .map((item) => `<li>${escapePlainTextForHtml(item)}</li>`)
    .join("");
  const section = `<h2>Key Takeaways</h2><ul>${listItems}</ul>`;

  return trimmedContent ? `${trimmedContent}\n${section}` : section;
}

export type AgentArticleDraftInsert = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: "draft";
  featured: boolean;
  content_type: "real";
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  og_title: string;
  og_description: string;
  ai_generated: true;
  agent_run_id: string;
  fact_check_status: AgentFactCheckStatus;
  quality_score: number;
  category_id?: string;
};

export function listUnexpectedArticleInsertFields(
  payload: Record<string, unknown>,
): string[] {
  const allowed = new Set<string>(ARTICLE_AGENT_DRAFT_INSERT_FIELDS);
  return Object.keys(payload).filter((key) => !allowed.has(key));
}

export function assertAgentArticleDraftInsertFields(
  payload: Record<string, unknown>,
): void {
  const unexpected = listUnexpectedArticleInsertFields(payload);
  if (unexpected.length > 0) {
    throw new Error(
      `Agent article INSERT contains unapproved fields: ${unexpected.join(", ")}`,
    );
  }

  for (const field of ARTICLE_FORBIDDEN_AGENT_INSERT_FIELDS) {
    if (field in payload) {
      throw new Error(
        `Agent article INSERT contains forbidden field: ${field}`,
      );
    }
  }
}

export function buildArticleDraftInsertPayload(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  agentRunId: string;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  categoryId?: string | null;
  preparedContent: string;
}): AgentArticleDraftInsert {
  const payload: AgentArticleDraftInsert = {
    title: input.draft.title.trim(),
    slug: input.slug,
    excerpt: input.draft.excerpt.trim(),
    content: input.preparedContent,
    author: DEFAULT_AUTHOR,
    status: "draft",
    featured: false,
    content_type: "real",
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

  assertAgentArticleDraftInsertFields(payload as Record<string, unknown>);

  return payload;
}
