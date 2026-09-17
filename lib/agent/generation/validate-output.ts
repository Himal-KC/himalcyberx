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

export type RichFieldHtmlIssue =
  | "prohibited_html"
  | "markdown_href"
  | "nested_anchor"
  | "backslash_escaped_tag"
  | "entity_escaped_tag";

export function diagnoseRichFieldHtmlIssue(field: string): RichFieldHtmlIssue | null {
  if (containsProhibitedHtml(field)) {
    return "prohibited_html";
  }

  if (containsMarkdownHrefValues(field)) {
    return "markdown_href";
  }

  if (containsNestedAnchorTags(field)) {
    return "nested_anchor";
  }

  if (containsBackslashEscapedHtmlTags(field)) {
    return "backslash_escaped_tag";
  }

  if (containsEntityEscapedHtmlTags(field)) {
    return "entity_escaped_tag";
  }

  return null;
}

const HTML_ISSUE_EXCERPT_MAX = 180;

function sliceMarkupExcerpt(content: string, start: number, end: number): string {
  const padding = 40;
  const from = Math.max(0, start - padding);
  const to = Math.min(content.length, end + padding);
  return content.slice(from, to).replace(/\s+/g, " ").trim();
}

export function buildRichFieldHtmlIssueExcerpt(
  field: string,
  issue: RichFieldHtmlIssue,
): string {
  if (!field.trim()) {
    return "";
  }

  if (issue === "markdown_href") {
    const match =
      field.match(/href=(["'])[^"']*\[[^\]]+\]\([^)]+\)[^"']*\1/i) ??
      field.match(/href=(["'])[^"']*\]\(https?:\/\//i);
    if (match?.index !== undefined) {
      return sliceMarkupExcerpt(
        field,
        match.index,
        match.index + match[0].length,
      ).slice(0, HTML_ISSUE_EXCERPT_MAX);
    }
  }

  if (issue === "nested_anchor") {
    let anchorDepth = 0;
    let index = 0;
    while (index < field.length) {
      const rest = field.slice(index);
      const openMatch = rest.match(/^<a\b[^>]*>/i);
      if (openMatch) {
        if (anchorDepth > 0) {
          return sliceMarkupExcerpt(
            field,
            index,
            index + openMatch[0].length,
          ).slice(0, HTML_ISSUE_EXCERPT_MAX);
        }
        anchorDepth += 1;
        index += openMatch[0].length;
        continue;
      }

      const closeMatch = rest.match(/^<\/a>/i);
      if (closeMatch) {
        anchorDepth = Math.max(0, anchorDepth - 1);
        index += closeMatch[0].length;
        continue;
      }

      index += 1;
    }
  }

  if (issue === "backslash_escaped_tag") {
    const match = field.match(/\\<\/?[a-z][^\\]*?\\>/i);
    if (match?.index !== undefined) {
      return sliceMarkupExcerpt(
        field,
        match.index,
        match.index + match[0].length,
      ).slice(0, HTML_ISSUE_EXCERPT_MAX);
    }
  }

  if (issue === "entity_escaped_tag") {
    const match = field.match(/&lt;\/?[a-z][^&]*?&gt;/i);
    if (match?.index !== undefined) {
      return sliceMarkupExcerpt(
        field,
        match.index,
        match.index + match[0].length,
      ).slice(0, HTML_ISSUE_EXCERPT_MAX);
    }
  }

  if (issue === "prohibited_html") {
    const match = field.match(
      /<script\b|<iframe\b|<object\b|<embed\b|\bon\w+\s*=|javascript:/i,
    );
    if (match?.index !== undefined) {
      return sliceMarkupExcerpt(
        field,
        match.index,
        match.index + match[0].length,
      ).slice(0, HTML_ISSUE_EXCERPT_MAX);
    }
  }

  return field.replace(/\s+/g, " ").trim().slice(0, HTML_ISSUE_EXCERPT_MAX);
}

export type StructureHtmlValidationPhase =
  | "post_sanitize_only"
  | "post_canonical_replay"
  | "validator_false_reject";

export function analyzeStructureHtmlValidationFailure(
  draft: GeneratedDraft,
  allowedSourceUrls?: readonly string[],
): {
  field: string;
  issue: RichFieldHtmlIssue;
  message: string;
  htmlValidationPhase: StructureHtmlValidationPhase;
  postSanitizeIssue: RichFieldHtmlIssue | null;
  postCanonicalIssue: RichFieldHtmlIssue | null;
  excerpt: string;
} | null {
  const failure = validateGeneratedDraftStructureDetailed(
    draft,
    draft.contentType,
    allowedSourceUrls,
  );

  if (
    !failure ||
    failure.issue === "content_type_mismatch" ||
    failure.issue === "invalid_slug" ||
    failure.issue === "title_too_short"
  ) {
    return null;
  }

  const fieldNames = richFieldNamesForDraft(draft);
  const richFieldValues =
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

  const fieldIndex = fieldNames.findIndex(
    (name) => failure.field === `${draft.contentType}.${name}`,
  );
  const sanitizedOnce =
    fieldIndex >= 0 ? (richFieldValues[fieldIndex] ?? "") : "";
  const postSanitizeIssue = diagnoseRichFieldHtmlIssue(sanitizedOnce);
  const postCanonicalIssue = failure.issue as RichFieldHtmlIssue;

  let htmlValidationPhase: StructureHtmlValidationPhase = "post_canonical_replay";
  if (postSanitizeIssue === null && postCanonicalIssue !== null) {
    htmlValidationPhase = "validator_false_reject";
  } else if (postSanitizeIssue !== null && postSanitizeIssue === postCanonicalIssue) {
    htmlValidationPhase = "post_sanitize_only";
  }

  return {
    field: failure.field,
    issue: postCanonicalIssue,
    message: failure.message,
    htmlValidationPhase,
    postSanitizeIssue,
    postCanonicalIssue,
    excerpt: buildRichFieldHtmlIssueExcerpt(sanitizedOnce, postCanonicalIssue),
  };
}

function richFieldNamesForDraft(draft: GeneratedDraft): string[] {
  if (draft.contentType === "article") {
    return ["content"];
  }

  if (draft.contentType === "tutorial") {
    return [
      "requirements",
      "introduction",
      "instructions",
      "keyTakeaways",
      "securityNotes",
    ];
  }

  return [
    "learningObjectives",
    "requirementsTools",
    "introduction",
    "instructions",
    "expectedResult",
    "securityNotes",
  ];
}

export function validateGeneratedDraftStructureDetailed(
  draft: GeneratedDraft,
  expectedContentType: AgentContentType,
  allowedSourceUrls?: readonly string[],
): {
  message: string;
  field: string;
  issue: RichFieldHtmlIssue | "content_type_mismatch" | "invalid_slug" | "title_too_short";
} | null {
  if (draft.contentType !== expectedContentType) {
    return {
      message: "Generated output did not match the requested content type.",
      field: "contentType",
      issue: "content_type_mismatch",
    };
  }

  if (!isSlugValidForContentType(draft.slug, expectedContentType)) {
    return {
      message: "Generated slug failed validation.",
      field: "slug",
      issue: "invalid_slug",
    };
  }

  const fieldNames = richFieldNamesForDraft(draft);
  const richFields = collectCanonicalRichFields(draft, allowedSourceUrls);

  for (let index = 0; index < richFields.length; index += 1) {
    const field = richFields[index];
    const fieldName = fieldNames[index] ?? `richField${index + 1}`;
    const htmlIssue = diagnoseRichFieldHtmlIssue(field);
    if (htmlIssue) {
      if (htmlIssue === "prohibited_html") {
        return {
          message: `Generated output contained prohibited HTML in ${draft.contentType}.${fieldName}.`,
          field: `${draft.contentType}.${fieldName}`,
          issue: htmlIssue,
        };
      }

      return {
        message: `Generated output contained malformed HTML markup in ${draft.contentType}.${fieldName} (${htmlIssue}).`,
        field: `${draft.contentType}.${fieldName}`,
        issue: htmlIssue,
      };
    }
  }

  if (draft.title.trim().length < 8) {
    return {
      message: "Generated title was too short.",
      field: "title",
      issue: "title_too_short",
    };
  }

  return null;
}

export function validateGeneratedDraftStructure(
  draft: GeneratedDraft,
  expectedContentType: AgentContentType,
  allowedSourceUrls?: readonly string[],
): string | null {
  const failure = validateGeneratedDraftStructureDetailed(
    draft,
    expectedContentType,
    allowedSourceUrls,
  );
  if (!failure) {
    return null;
  }

  if (failure.issue === "content_type_mismatch") {
    return failure.message;
  }

  if (failure.issue === "invalid_slug") {
    return failure.message;
  }

  if (failure.issue === "title_too_short") {
    return failure.message;
  }

  if (failure.issue === "prohibited_html") {
    return "Generated output contained prohibited HTML.";
  }

  return "Generated output contained malformed HTML markup.";
}

export { filterSourceMappings, validateDraftReferences, validateDraftReferencesDetailed } from "@/lib/agent/generation/validate-output-core";
export type { DraftReferenceValidationFailure } from "@/lib/agent/generation/validate-output-core";
