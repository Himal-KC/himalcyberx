import {
  applyCanonicalHtmlRepairs,
  flattenNestedAnchorTags,
  looksLikeRichHtml,
  type CanonicalizeRichContentOptions,
} from "./canonical-html-repair-core";
import { sanitizeRichContentHtml } from "@/lib/content/sanitize-html";

export {
  applyCanonicalHtmlRepairs,
  containsBackslashEscapedHtmlTags,
  containsEntityEscapedHtmlTags,
  containsMarkdownHrefValues,
  containsNestedAnchorTags,
  flattenNestedAnchorTags,
  looksLikeRichHtml,
  normalizeAnchorHrefValue,
  recoverEscapedHtmlMarkup,
  unwrapBlockElementsFromParagraphs,
  type CanonicalizeRichContentOptions,
} from "./canonical-html-repair-core";

export function canonicalizeRichContentForStorage(
  content: string,
  options?: CanonicalizeRichContentOptions,
): string {
  const repaired = applyCanonicalHtmlRepairs(content, options);
  if (!looksLikeRichHtml(repaired)) {
    return repaired;
  }

  const sanitized = sanitizeRichContentHtml(repaired);
  const normalized = flattenNestedAnchorTags(
    applyCanonicalHtmlRepairs(sanitized, options),
  );

  return normalized.trim();
}

export function resolveArticleReviewBodyHtml(content: string): string {
  return canonicalizeRichContentForStorage(content);
}
