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

  if (/&(?:quot|gt|lt|amp|nbsp|#39);/i.test(next)) {
    next = decodeBasicHtmlEntities(next);
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

function getListItemSemanticText(innerHtml: string): string {
  return innerHtml
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRedundantBulletPrefixFromListItemInner(inner: string): string {
  let next = inner.trim();
  next = next.replace(/^(<p\b[^>]*>)\s*[-•*]\s+/i, "$1");
  next = next.replace(/^\s*[-•*]\s+/i, "");
  return next;
}

function processListItemMarkup(liMarkup: string): string {
  const match = liMarkup.match(/^<li\b([^>]*)>([\s\S]*?)<\/li>$/i);
  if (!match) {
    return liMarkup;
  }

  const attrs = match[1] ?? "";
  let inner = match[2] ?? "";
  if (/^\s*(?:<p\b[^>]*>)?\s*[-•*]\s+/i.test(inner.trim())) {
    inner = stripRedundantBulletPrefixFromListItemInner(inner);
  }

  if (getListItemSemanticText(inner) === "") {
    return "";
  }

  return `<li${attrs}>${inner}</li>`;
}

export function removeEmptyListItems(html: string): string {
  let next = html;
  let guard = 0;

  while (guard < 20) {
    const updated = next.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, processListItemMarkup);
    if (updated === next) {
      break;
    }
    next = updated;
    guard += 1;
  }

  return next;
}

function splitAttributionSuffix(value: string): { label: string; suffix: string } {
  const match = value.match(/^([\s\S]+?)(\s+[—–-]\s+[A-Za-z][\w\s.]*)$/);
  if (!match) {
    return { label: value.trim(), suffix: "" };
  }

  return { label: match[1].trim(), suffix: match[2] };
}

function buildRecoveredAnchorMarkup(
  url: string,
  label: string,
  suffix: string,
  allowedSourceUrls?: readonly string[],
): string {
  const normalized = normalizeAnchorHrefValue(url, allowedSourceUrls);
  let linkLabel = label.trim();
  let linkSuffix = suffix;
  if (!linkSuffix) {
    const split = splitAttributionSuffix(linkLabel);
    linkLabel = split.label;
    linkSuffix = split.suffix;
  }

  if (!normalized) {
    return `${linkLabel}${linkSuffix}`;
  }
  return `<a href="${normalized}">${linkLabel}</a>${linkSuffix}`;
}

function repairMalformedOpeningAnchorTags(
  html: string,
  allowedSourceUrls?: readonly string[],
): string {
  return html.replace(
    /<a\b[^>]*?href=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
    (full, _quote, hrefValue: string, inner: string) => {
      const normalizedHref = normalizeAnchorHrefValue(
        hrefValue,
        allowedSourceUrls,
      );
      if (normalizedHref) {
        return `<a href="${normalizedHref}">${inner}</a>`;
      }

      const splitInner = inner.trim().match(
        /^(https?:\/\/[^\s">]+)"?>([\s\S]*?)$/i,
      );
      if (splitInner) {
        return buildRecoveredAnchorMarkup(
          splitInner[1],
          splitInner[2],
          "",
          allowedSourceUrls,
        );
      }

      return inner.trim();
    },
  );
}

export function repairLegacyBrokenAnchorFragments(
  html: string,
  allowedSourceUrls?: readonly string[],
): string {
  const withJunkPrefix = html.replace(
    /([A-Za-z0-9][A-Za-z0-9\s]{0,80})">(https?:\/\/[^\s">]+)"?>([^<]+?)(\s*[—–-][^<]*)?(?=\s*<|\s*$)/g,
    (_match, _junk, url: string, label: string, suffix = "") =>
      buildRecoveredAnchorMarkup(url, label, suffix, allowedSourceUrls),
  );

  const withQuotedUrl = withJunkPrefix.replace(
    /(?<!=)">(https?:\/\/[^\s">]+)"?>([^<]+?)(\s*[—–-][^<]*)?(?=\s*<|\s*$)/g,
    (_match, url: string, label: string, suffix = "") =>
      buildRecoveredAnchorMarkup(url, label, suffix, allowedSourceUrls),
  );

  return withQuotedUrl.replace(
    /(^|[^\w/"'=])((https?:\/\/[^\s"<]+)"?>([^<]+?)(\s*[—–-][^<]*)?)(?=\s*<|\s*$)/g,
    (prefix, _fragment, url: string, label: string, suffix = "") =>
      `${prefix}${buildRecoveredAnchorMarkup(url, label, suffix, allowedSourceUrls)}`,
  );
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
        const splitInner = inner.trim().match(
          /^(https?:\/\/[^\s">]+)"?>([\s\S]*?)$/i,
        );
        if (splitInner) {
          return buildRecoveredAnchorMarkup(
            splitInner[1],
            splitInner[2],
            "",
            allowedSourceUrls,
          );
        }
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

  while (containsNestedAnchorTags(next) && guard < 30) {
    const updated = next.replace(
      /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
      (full, openAttrs: string, inner: string) => {
        if (!/<a\b/i.test(inner)) {
          return full;
        }

        const flattenedInner = inner
          .replace(/<a\b[^>]*>/gi, "")
          .replace(/<\/a>/gi, "");
        return `<a${openAttrs}>${flattenedInner}</a>`;
      },
    );

    if (updated === next) {
      break;
    }

    next = updated;
    guard += 1;
  }

  return next;
}

export function containsNestedAnchorTags(html: string): boolean {
  let anchorDepth = 0;
  let index = 0;

  while (index < html.length) {
    const rest = html.slice(index);
    const openMatch = rest.match(/^<a\b[^>]*>/i);
    if (openMatch) {
      if (anchorDepth > 0) {
        return true;
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

  return false;
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

function stripUnsupportedWrapperTags(html: string): string {
  return html
    .replace(/<\/?article\b[^>]*>/gi, "")
    .replace(/<\/?section\b[^>]*>/gi, "");
}

export function finalizeAnchorMarkup(
  html: string,
  allowedSourceUrls?: readonly string[],
): string {
  return html.replace(
    /<a\b([^>]*?)href=(["'])([\s\S]*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, _before, _quote, hrefValue: string, _after, inner: string) => {
      const normalized = normalizeAnchorHrefValue(hrefValue, allowedSourceUrls);

      if (normalized) {
        return `<a href="${normalized}">${inner}</a>`;
      }

      const splitInner = inner.trim().match(
        /^(https?:\/\/[^\s">]+)"?>([\s\S]*?)$/i,
      );
      if (splitInner) {
        return buildRecoveredAnchorMarkup(
          splitInner[1],
          splitInner[2],
          "",
          allowedSourceUrls,
        );
      }

      return inner;
    },
  );
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
  working = stripUnsupportedWrapperTags(working);
  working = repairMalformedOpeningAnchorTags(
    working,
    options?.allowedSourceUrls,
  );
  working = repairLegacyBrokenAnchorFragments(
    working,
    options?.allowedSourceUrls,
  );
  working = repairMarkdownLinksInHtml(working, options?.allowedSourceUrls);
  working = unwrapBlockElementsFromParagraphs(working);
  working = flattenNestedAnchorTags(working);
  working = repairLegacyBrokenAnchorFragments(
    working,
    options?.allowedSourceUrls,
  );
  working = removeEmptyListItems(working);
  working = finalizeAnchorMarkup(working, options?.allowedSourceUrls);
  working = flattenNestedAnchorTags(working);
  working = recoverEscapedHtmlMarkup(working);

  if (!looksLikeRichHtml(working) && MARKDOWN_LINK_PATTERN.test(working)) {
    working = repairMarkdownLinksInHtml(working, options?.allowedSourceUrls);
  }

  return working.trim();
}
