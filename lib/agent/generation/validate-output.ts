import {
  canonicalizeRichContentForStorage,
  containsBackslashEscapedHtmlTags,
  containsEntityEscapedHtmlTags,
  containsMarkdownHrefValues,
  containsNestedAnchorTags,
} from "@/lib/content/canonical-html-core";
import { isValidSlug as isValidArticleSlug } from "@/lib/articles/validation";
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
  allowedSourceUrls?: readonly string[],
): GeneratedDraft {
  const sanitizeField = (value: string): string =>
    canonicalizeRichContentForStorage(value, { allowedSourceUrls });

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

function collectCanonicalRichFields(
  draft: GeneratedDraft,
  allowedSourceUrls?: readonly string[],
): string[] {
  const sanitizeField = (value: string): string =>
    canonicalizeRichContentForStorage(value, { allowedSourceUrls });

  if (draft.contentType === "article") {
    return [sanitizeField(draft.content)];
  }

  if (draft.contentType === "tutorial") {
    return [
      sanitizeField(draft.requirements),
      sanitizeField(draft.introduction),
      sanitizeField(draft.instructions),
      sanitizeField(draft.keyTakeaways),
      sanitizeField(draft.securityNotes),
    ];
  }

  return [
    sanitizeField(draft.learningObjectives),
    sanitizeField(draft.requirementsTools),
    sanitizeField(draft.introduction),
    sanitizeField(draft.instructions),
    sanitizeField(draft.expectedResult),
    sanitizeField(draft.securityNotes),
  ];
}

export function validateGeneratedDraftStructure(
  draft: GeneratedDraft,
  expectedContentType: AgentContentType,
  allowedSourceUrls?: readonly string[],
): string | null {
  if (draft.contentType !== expectedContentType) {
    return "Generated output did not match the requested content type.";
  }

  if (!isSlugValidForContentType(draft.slug, expectedContentType)) {
    return "Generated slug failed validation.";
  }

  const richFields = collectCanonicalRichFields(draft, allowedSourceUrls);

  for (const field of richFields) {
    if (containsProhibitedHtml(field)) {
      return "Generated output contained prohibited HTML.";
    }

    if (
      containsMarkdownHrefValues(field) ||
      containsNestedAnchorTags(field) ||
      containsBackslashEscapedHtmlTags(field) ||
      containsEntityEscapedHtmlTags(field)
    ) {
      return "Generated output contained malformed HTML markup.";
    }
  }

  if (draft.title.trim().length < 8) {
    return "Generated title was too short.";
  }

  return null;
}

export { filterSourceMappings, validateDraftReferences, validateDraftReferencesDetailed } from "@/lib/agent/generation/validate-output-core";
export type { DraftReferenceValidationFailure } from "@/lib/agent/generation/validate-output-core";
