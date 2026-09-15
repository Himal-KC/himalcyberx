import type {
  GeneratedDraft,
  GenerationMetadata,
  InternalLinkSuggestion,
  SourceMapping,
} from "../generation/types";
import type { AgentContentType, Article, Lab, Tutorial } from "../../supabase/types";
import type { ReviewDraftSnapshot } from "./types";

export interface ParsedGenerationMetadata extends GenerationMetadata {
  sourceMappings?: SourceMapping[];
  internalLinks?: InternalLinkSuggestion[];
  generationWarnings?: string[];
}

export function parseGenerationMetadata(
  value: unknown,
): ParsedGenerationMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as ParsedGenerationMetadata;
}

function defaultSeo(title: string, description: string) {
  return {
    seoTitle: title,
    seoDescription: description,
    seoKeywords: [],
    ogTitle: title,
    ogDescription: description,
  };
}

function defaultGenerationPlan(topic: string) {
  return {
    contentAngle: topic,
    audience: "Security practitioners",
    intent: "Inform and guide defenders",
    sectionPlan: ["Overview", "Analysis", "Recommendations"],
  };
}

export function buildArticleDraftFromRow(
  row: Article,
  metadata: ParsedGenerationMetadata | null,
  topic: string,
): GeneratedDraft {
  return {
    contentType: "article",
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content ?? "",
    categoryRecommendation: "General",
    primaryKeyword: topic,
    secondaryKeywords: [],
    keyTakeaways: row.key_takeaways ?? [],
    seo: defaultSeo(
      row.seo_title ?? row.title,
      row.seo_description ?? row.excerpt,
    ),
    generationPlan: defaultGenerationPlan(topic),
    sourceMappings: metadata?.sourceMappings ?? [],
    internalLinks: metadata?.internalLinks ?? [],
    warnings: metadata?.generationWarnings ?? [],
  };
}

export function buildTutorialDraftFromRow(
  row: Tutorial,
  metadata: ParsedGenerationMetadata | null,
  topic: string,
): GeneratedDraft {
  return {
    contentType: "tutorial",
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    estimatedTime: row.estimated_time ?? "",
    requirements: row.requirements ?? "",
    introduction: row.introduction ?? "",
    instructions: row.instructions ?? "",
    keyTakeaways: row.key_takeaways ?? "",
    securityNotes: row.security_notes ?? "",
    primaryKeyword: topic,
    secondaryKeywords: [],
    seo: defaultSeo(
      row.seo_title ?? row.title,
      row.seo_description ?? row.description,
    ),
    generationPlan: defaultGenerationPlan(topic),
    sourceMappings: metadata?.sourceMappings ?? [],
    internalLinks: metadata?.internalLinks ?? [],
    warnings: metadata?.generationWarnings ?? [],
  };
}

export function buildLabDraftFromRow(
  row: Lab,
  metadata: ParsedGenerationMetadata | null,
  topic: string,
): GeneratedDraft {
  return {
    contentType: "lab",
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    estimatedTime: row.estimated_time ?? "",
    learningObjectives: row.learning_objectives ?? "",
    requirementsTools: row.requirements_tools ?? "",
    introduction: row.introduction ?? "",
    instructions: row.instructions ?? "",
    expectedResult: row.expected_result ?? "",
    securityNotes: row.security_notes ?? "",
    primaryKeyword: topic,
    secondaryKeywords: [],
    seo: defaultSeo(
      row.seo_title ?? row.title,
      row.seo_description ?? row.description,
    ),
    generationPlan: defaultGenerationPlan(topic),
    sourceMappings: metadata?.sourceMappings ?? [],
    internalLinks: metadata?.internalLinks ?? [],
    warnings: metadata?.generationWarnings ?? [],
  };
}

export function buildReviewDraftSnapshot(input: {
  contentType: AgentContentType;
  contentId: string;
  status: string;
  publishedAt: string | null;
  draft: GeneratedDraft;
  metadata: ParsedGenerationMetadata | null;
}): ReviewDraftSnapshot {
  return {
    contentId: input.contentId,
    contentType: input.contentType,
    title: input.draft.title,
    slug: input.draft.slug,
    status: input.status,
    publishedAt: input.publishedAt,
    draft: input.draft,
    sourceMappings: input.metadata?.sourceMappings ?? input.draft.sourceMappings,
    internalLinks: input.metadata?.internalLinks ?? input.draft.internalLinks,
    generationWarnings:
      input.metadata?.generationWarnings ?? input.draft.warnings,
  };
}
