const HTML_START_PATTERN =
  /^(?:<|\\<|&lt;)(p|h[1-6]|ul|ol|blockquote|pre|div|table|hr|span|strong|em|code|a|li|article|section|figure)\b/i;

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;

const MARKDOWN_HREF_VALUE = /^\[([\s\S]*?)\]\(([\s\S]*?)\)$/;

const BROKEN_MARKDOWN_HREF =
  /^(https?:\/\/[^\s\]]+)\]\((https?:\/\/[^)]+)\)$/i;

export function looksLikeRichHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  return HTML_START_PATTERN.test(trimmed);
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

export function recoverEscapedHtmlMarkup(content: string): string {
  let next = content.trim();
  if (!next) {
    return "";
  }

  if (/\\<\/?[a-z]/i.test(next)) {
    next = next.replace(/\\</g, "<").replace(/\\>/g, ">");
  }

  if (/&lt;\/?[a-z]/i.test(next)) {
    let decoded = decodeBasicHtmlEntities(next);
    let guard = 0;
    while (decoded !== next && /&lt;\/?[a-z]/i.test(decoded) && guard < 4) {
      next = decoded;
      decoded = decodeBasicHtmlEntities(next);
      guard += 1;
    }
    next = decoded;
  }

  return next;
}

function normalizeAllowedUrlSet(
  allowedSourceUrls: readonly string[] | undefined,
): Set<string> | null {
  if (!allowedSourceUrls || allowedSourceUrls.length === 0) {
    return null;
  }

  return new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()).filter(Boolean),
  );
}

function isAllowedSourceUrl(
  url: string,
  allowed: Set<string> | null,
): boolean {
  if (!allowed) {
    return true;
  }

  return allowed.has(url.trim().toLowerCase());
}

export function normalizeAnchorHrefValue(
  href: string,
  allowedSourceUrls?: readonly string[],
): string | null {
  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  const allowed = normalizeAllowedUrlSet(allowedSourceUrls);
  const markdownMatch = trimmed.match(MARKDOWN_HREF_VALUE);
  if (markdownMatch) {
    const url = markdownMatch[2].trim();
    if (!/^https?:\/\//i.test(url)) {
      return null;
    }
    return isAllowedSourceUrl(url, allowed) ? url : null;
  }

  const brokenMatch = trimmed.match(BROKEN_MARKDOWN_HREF);
  if (brokenMatch) {
    const url = brokenMatch[2].trim();
    return isAllowedSourceUrl(url, allowed) ? url : null;
  }

  if (!/^https?:\/\//i.test(trimmed) && !/^mailto:/i.test(trimmed)) {
    return null;
  }

  if (/[\[\]]/.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return parsed.protocol === "mailto:" ? trimmed : null;
    }
    const normalized = parsed.toString();
    return isAllowedSourceUrl(normalized, allowed) ? normalized : null;
  } catch {
    return null;
  }
}

function repairMarkdownLinksInHtml(
  html: string,
  allowedSourceUrls?: readonly string[],
): string {
  const allowed = normalizeAllowedUrlSet(allowedSourceUrls);

  const withAnchors = html.replace(
    MARKDOWN_LINK_PATTERN,
    (_match, label: string, url: string) => {
      const normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        return label;
      }
      if (allowed && !allowed.has(normalizedUrl.toLowerCase())) {
        return label;
      }
      return `<a href="${normalizedUrl}">${label}</a>`;
    },
  );

  return withAnchors.replace(
    /<a\b([^>]*?)href=(["'])([\s\S]*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (_full, _before, _quote, hrefValue, _after, inner) => {
      const normalized = normalizeAnchorHrefValue(hrefValue, allowedSourceUrls);
      if (!normalized) {
        return inner;
      }
      return `<a href="${normalized}">${inner}</a>`;
    },
  );
}

export function unwrapBlockElementsFromParagraphs(html: string): string {
  let next = html;
  let guard = 0;
  const blockWrapper =
    /<p\b[^>]*>\s*(<(h[1-6]|ul|ol|blockquote|pre|table|hr|div|article|section|figure)\b[\s\S]*?<\/\2>)\s*<\/p>/gi;

  while (blockWrapper.test(next) && guard < 12) {
    next = next.replace(blockWrapper, "$1");
    guard += 1;
  }

  return next;
}

export function flattenNestedAnchorTags(html: string): string {
  let next = html;
  let guard = 0;
  const nestedAnchor =
    /<a\b([^>]*)>([\s\S]*?)<a\b[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/a>/gi;

  while (nestedAnchor.test(next) && guard < 12) {
    next = next.replace(nestedAnchor, "<a$1>$2$3$4</a>");
    guard += 1;
  }

  return next;
}

export function containsNestedAnchorTags(html: string): boolean {
  return /<a\b[^>]*>[\s\S]*<a\b/i.test(html);
}

export function containsMarkdownHrefValues(html: string): boolean {
  return (
    /href=(["'])[^"']*\[[^\]]+\]\([^)]+\)[^"']*\1/i.test(html) ||
    /href=(["'])[^"']*\]\(https?:\/\//i.test(html)
  );
}

export function containsBackslashEscapedHtmlTags(html: string): boolean {
  return /\\<\/?[a-z]/i.test(html);
}

export function containsEntityEscapedHtmlTags(html: string): boolean {
  return /&lt;\/?[a-z]/i.test(html);
}

export interface CanonicalizeRichContentOptions {
  allowedSourceUrls?: readonly string[];
}

export function applyCanonicalHtmlRepairs(
  content: string,
  options?: CanonicalizeRichContentOptions,
): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  let working = recoverEscapedHtmlMarkup(trimmed);
  working = repairMarkdownLinksInHtml(working, options?.allowedSourceUrls);
  working = unwrapBlockElementsFromParagraphs(working);
  working = flattenNestedAnchorTags(working);

  if (!looksLikeRichHtml(working) && MARKDOWN_LINK_PATTERN.test(working)) {
    working = repairMarkdownLinksInHtml(working, options?.allowedSourceUrls);
  }

  return working.trim();
}
