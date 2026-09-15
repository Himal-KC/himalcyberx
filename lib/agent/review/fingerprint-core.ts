import { createHash } from "node:crypto";
import type { InternalLinkSuggestion, SourceMapping } from "../generation/types";
import type { Article, Lab, Tutorial } from "../../supabase/types";
import type { ReviewDraftSnapshot } from "./types";

type ReviewMetadataForFingerprint = {
  sourceMappings?: SourceMapping[];
  internalLinks?: InternalLinkSuggestion[];
  generationWarnings?: string[];
} | null;

function stripRichHtmlForFingerprint(content: string): string {
  return content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function normalizeReviewTextForFingerprint(
  value: string | null | undefined,
): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "";
  }

  const text = stripRichHtmlForFingerprint(raw);
  return text.replace(/\s+/g, " ").trim();
}

export function buildArticleReviewFingerprintFields(input: {
  row: Pick<
    Article,
    | "title"
    | "slug"
    | "excerpt"
    | "content"
    | "category_id"
    | "seo_title"
    | "seo_description"
    | "og_title"
    | "og_description"
    | "seo_keywords"
  >;
  metadata: ReviewMetadataForFingerprint;
}): Record<string, unknown> {
  return {
    title: normalizeReviewTextForFingerprint(input.row.title),
    slug: input.row.slug.trim(),
    excerpt: normalizeReviewTextForFingerprint(input.row.excerpt),
    content: normalizeReviewTextForFingerprint(input.row.content ?? ""),
    categoryId: input.row.category_id ?? null,
    seoTitle: normalizeReviewTextForFingerprint(
      input.row.seo_title ?? input.row.title,
    ),
    seoDescription: normalizeReviewTextForFingerprint(
      input.row.seo_description ?? input.row.excerpt,
    ),
    ogTitle: normalizeReviewTextForFingerprint(
      input.row.og_title ?? input.row.seo_title ?? input.row.title,
    ),
    ogDescription: normalizeReviewTextForFingerprint(
      input.row.og_description ??
        input.row.seo_description ??
        input.row.excerpt,
    ),
    seoKeywords: [...(input.row.seo_keywords ?? [])].sort(),
    sourceMappings: input.metadata?.sourceMappings ?? [],
    internalLinks: input.metadata?.internalLinks ?? [],
    generationWarnings: input.metadata?.generationWarnings ?? [],
  };
}

export function buildTutorialReviewFingerprintFields(input: {
  row: Pick<
    Tutorial,
    | "title"
    | "slug"
    | "description"
    | "category"
    | "difficulty"
    | "estimated_time"
    | "requirements"
    | "introduction"
    | "instructions"
    | "key_takeaways"
    | "security_notes"
    | "seo_title"
    | "seo_description"
    | "og_title"
    | "og_description"
    | "seo_keywords"
  >;
  metadata: ReviewMetadataForFingerprint;
}): Record<string, unknown> {
  return {
    title: normalizeReviewTextForFingerprint(input.row.title),
    slug: input.row.slug.trim(),
    description: normalizeReviewTextForFingerprint(input.row.description),
    category: normalizeReviewTextForFingerprint(input.row.category),
    difficulty: input.row.difficulty,
    estimatedTime: normalizeReviewTextForFingerprint(input.row.estimated_time),
    requirements: normalizeReviewTextForFingerprint(input.row.requirements ?? ""),
    introduction: normalizeReviewTextForFingerprint(input.row.introduction ?? ""),
    instructions: normalizeReviewTextForFingerprint(input.row.instructions ?? ""),
    keyTakeaways: normalizeReviewTextForFingerprint(input.row.key_takeaways ?? ""),
    securityNotes: normalizeReviewTextForFingerprint(input.row.security_notes ?? ""),
    seoTitle: normalizeReviewTextForFingerprint(
      input.row.seo_title ?? input.row.title,
    ),
    seoDescription: normalizeReviewTextForFingerprint(
      input.row.seo_description ?? input.row.description,
    ),
    ogTitle: normalizeReviewTextForFingerprint(
      input.row.og_title ?? input.row.seo_title ?? input.row.title,
    ),
    ogDescription: normalizeReviewTextForFingerprint(
      input.row.og_description ??
        input.row.seo_description ??
        input.row.description,
    ),
    seoKeywords: [...(input.row.seo_keywords ?? [])].sort(),
    sourceMappings: input.metadata?.sourceMappings ?? [],
    internalLinks: input.metadata?.internalLinks ?? [],
    generationWarnings: input.metadata?.generationWarnings ?? [],
  };
}

export function buildLabReviewFingerprintFields(input: {
  row: Pick<
    Lab,
    | "title"
    | "slug"
    | "description"
    | "category"
    | "difficulty"
    | "estimated_time"
    | "learning_objectives"
    | "requirements_tools"
    | "introduction"
    | "instructions"
    | "expected_result"
    | "security_notes"
    | "seo_title"
    | "seo_description"
    | "og_title"
    | "og_description"
    | "seo_keywords"
  >;
  metadata: ReviewMetadataForFingerprint;
}): Record<string, unknown> {
  return {
    title: normalizeReviewTextForFingerprint(input.row.title),
    slug: input.row.slug.trim(),
    description: normalizeReviewTextForFingerprint(input.row.description),
    category: normalizeReviewTextForFingerprint(input.row.category),
    difficulty: input.row.difficulty,
    estimatedTime: normalizeReviewTextForFingerprint(input.row.estimated_time),
    learningObjectives: normalizeReviewTextForFingerprint(
      input.row.learning_objectives ?? "",
    ),
    requirementsTools: normalizeReviewTextForFingerprint(
      input.row.requirements_tools ?? "",
    ),
    introduction: normalizeReviewTextForFingerprint(input.row.introduction ?? ""),
    instructions: normalizeReviewTextForFingerprint(input.row.instructions ?? ""),
    expectedResult: normalizeReviewTextForFingerprint(
      input.row.expected_result ?? "",
    ),
    securityNotes: normalizeReviewTextForFingerprint(input.row.security_notes ?? ""),
    seoTitle: normalizeReviewTextForFingerprint(
      input.row.seo_title ?? input.row.title,
    ),
    seoDescription: normalizeReviewTextForFingerprint(
      input.row.seo_description ?? input.row.description,
    ),
    ogTitle: normalizeReviewTextForFingerprint(
      input.row.og_title ?? input.row.seo_title ?? input.row.title,
    ),
    ogDescription: normalizeReviewTextForFingerprint(
      input.row.og_description ??
        input.row.seo_description ??
        input.row.description,
    ),
    seoKeywords: [...(input.row.seo_keywords ?? [])].sort(),
    sourceMappings: input.metadata?.sourceMappings ?? [],
    internalLinks: input.metadata?.internalLinks ?? [],
    generationWarnings: input.metadata?.generationWarnings ?? [],
  };
}

export function buildCanonicalReviewFingerprintPayload(
  snapshot: ReviewDraftSnapshot,
): Record<string, unknown> {
  if (snapshot.reviewFingerprintFields) {
    return {
      contentId: snapshot.contentId,
      contentType: snapshot.contentType,
      agentRunId: snapshot.agentRunId,
      fields: snapshot.reviewFingerprintFields,
    };
  }

  return buildLegacyReviewFingerprintPayload(snapshot);
}

function buildLegacyReviewFingerprintPayload(
  snapshot: ReviewDraftSnapshot,
): Record<string, unknown> {
  return {
    contentId: snapshot.contentId,
    contentType: snapshot.contentType,
    title: snapshot.title,
    slug: snapshot.slug,
    draft: snapshot.draft,
    sourceMappings: snapshot.sourceMappings,
    internalLinks: snapshot.internalLinks,
    generationWarnings: snapshot.generationWarnings,
  };
}

export function buildDraftFingerprint(snapshot: ReviewDraftSnapshot): string {
  const payload = buildCanonicalReviewFingerprintPayload(snapshot);
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function getCurrentDraftFingerprintFromSnapshot(
  snapshot: ReviewDraftSnapshot,
): string {
  return buildDraftFingerprint(snapshot);
}
