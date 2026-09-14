import { isValidSlug as isValidArticleSlug } from "@/lib/articles/validation";
import { isRichHtmlContent } from "@/lib/content/html";
import { sanitizeRichContentHtml } from "@/lib/content/sanitize-html";
import { isValidLabSlug } from "@/lib/labs/validation";
import { isValidTutorialSlug } from "@/lib/tutorials/validation";
import type { AgentContentType } from "@/lib/supabase/types";
import {
  generatedDraftSchema,
} from "@/lib/agent/generation/schemas";
import type { GeneratedDraft } from "@/lib/agent/generation/types";

const PROHIBITED_HTML_PATTERNS = [
  /<script\b/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /\bon\w+\s*=/i,
  /javascript:/i,
];

export function parseGeneratedDraftOutput(
  value: unknown,
): GeneratedDraft | null {
  const parsed = generatedDraftSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }

  return parsed.data as GeneratedDraft;
}

export function isSlugValidForContentType(
  slug: string,
  contentType: AgentContentType,
): boolean {
  switch (contentType) {
    case "article":
      return isValidArticleSlug(slug);
    case "tutorial":
      return isValidTutorialSlug(slug);
    case "lab":
      return isValidLabSlug(slug);
  }
}

export function containsProhibitedHtml(content: string): boolean {
  return PROHIBITED_HTML_PATTERNS.some((pattern) => pattern.test(content));
}

export function sanitizeGeneratedRichFields(
  draft: GeneratedDraft,
): GeneratedDraft {
  const sanitizeField = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (isRichHtmlContent(trimmed)) {
      return sanitizeRichContentHtml(trimmed);
    }

    return trimmed;
  };

  if (draft.contentType === "article") {
    return {
      ...draft,
      content: sanitizeField(draft.content),
      excerpt: draft.excerpt.trim(),
    };
  }

  if (draft.contentType === "tutorial") {
    return {
      ...draft,
      requirements: sanitizeField(draft.requirements),
      introduction: sanitizeField(draft.introduction),
      instructions: sanitizeField(draft.instructions),
      keyTakeaways: sanitizeField(draft.keyTakeaways),
      securityNotes: sanitizeField(draft.securityNotes),
    };
  }

  return {
    ...draft,
    learningObjectives: sanitizeField(draft.learningObjectives),
    requirementsTools: sanitizeField(draft.requirementsTools),
    introduction: sanitizeField(draft.introduction),
    instructions: sanitizeField(draft.instructions),
    expectedResult: sanitizeField(draft.expectedResult),
    securityNotes: sanitizeField(draft.securityNotes),
  };
}

export function validateGeneratedDraftStructure(
  draft: GeneratedDraft,
  expectedContentType: AgentContentType,
): string | null {
  if (draft.contentType !== expectedContentType) {
    return "Generated output did not match the requested content type.";
  }

  if (!isSlugValidForContentType(draft.slug, expectedContentType)) {
    return "Generated slug failed validation.";
  }

  const richFields =
    draft.contentType === "article"
      ? [draft.content]
      : draft.contentType === "tutorial"
        ? [
            draft.requirements,
            draft.introduction,
            draft.instructions,
            draft.keyTakeaways,
            draft.securityNotes,
          ]
        : [
            draft.learningObjectives,
            draft.requirementsTools,
            draft.introduction,
            draft.instructions,
            draft.expectedResult,
            draft.securityNotes,
          ];

  for (const field of richFields) {
    if (containsProhibitedHtml(field)) {
      return "Generated output contained prohibited HTML.";
    }
  }

  if (draft.title.trim().length < 8) {
    return "Generated title was too short.";
  }

  return null;
}

export { filterSourceMappings, validateDraftReferences } from "@/lib/agent/generation/validate-output-core";
