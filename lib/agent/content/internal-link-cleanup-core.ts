import { buildAgentContentPublicUrl } from "../publish/public-url-core.ts";
import type { InternalLinkSuggestion } from "../generation/types";
import type { AgentContentType } from "../../supabase/types";

export interface ApprovedInternalCatalogItem {
  id: string;
  contentType: AgentContentType;
  title: string;
  slug: string;
}

export interface ResolvedApprovedInternalLink {
  contentId: string;
  contentType: AgentContentType;
  slug: string;
  href: string;
  anchorText: string;
  title: string;
}

const CVE_PATTERN = /\bCVE-\d{4}-\d+\b/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

export function resolveApprovedInternalLinks(input: {
  internalLinks: InternalLinkSuggestion[];
  catalog: ApprovedInternalCatalogItem[];
}): ResolvedApprovedInternalLink[] {
  const byId = new Map(input.catalog.map((item) => [item.id, item]));
  const resolved: ResolvedApprovedInternalLink[] = [];

  for (const link of input.internalLinks) {
    const record = byId.get(link.contentId.trim());
    if (!record || !normalizeSlug(record.slug)) {
      continue;
    }

    const href = buildAgentContentPublicUrl(record.contentType, record.slug.trim());
    const anchorText = link.anchorText.trim() || record.title.trim();
    if (!anchorText) {
      continue;
    }

    resolved.push({
      contentId: record.id,
      contentType: record.contentType,
      slug: record.slug.trim(),
      href,
      anchorText,
      title: record.title.trim(),
    });
  }

  return resolved;
}

export function htmlAlreadyContainsInternalHref(
  content: string,
  href: string,
): boolean {
  const normalizedHref = href.trim().toLowerCase();
  if (!normalizedHref) {
    return false;
  }

  return new RegExp(
    `<a\\b[^>]*href=["']${escapeRegExp(normalizedHref)}["']`,
    "i",
  ).test(content);
}

function findPlainTextOccurrenceOutsideAnchors(
  html: string,
  phrase: string,
): number {
  const trimmed = phrase.trim();
  if (trimmed.length < 3) {
    return -1;
  }

  let depth = 0;
  let index = 0;

  while (index < html.length) {
    const lower = html.slice(index).toLowerCase();
    const tagOpen = lower.indexOf("<");
    const phraseIndex = lower.indexOf(trimmed.toLowerCase());

    if (phraseIndex === -1 || (tagOpen !== -1 && tagOpen < phraseIndex)) {
      if (tagOpen === -1) {
        break;
      }

      const tagClose = lower.indexOf(">", tagOpen);
      if (tagClose === -1) {
        break;
      }

      const tag = lower.slice(tagOpen, tagClose + 1);
      if (/^<\/?a\b/.test(tag)) {
        depth += /^<a\b/.test(tag) ? 1 : -1;
      }

      index += tagClose + 1;
      continue;
    }

    if (depth === 0) {
      return index + phraseIndex;
    }

    index += phraseIndex + trimmed.length;
  }

  return -1;
}

export function applyApprovedInternalLinksToHtml(input: {
  content: string;
  links: ResolvedApprovedInternalLink[];
}): { content: string; linkedContentIds: string[] } {
  let content = input.content;
  const linkedContentIds: string[] = [];

  for (const link of input.links) {
    if (htmlAlreadyContainsInternalHref(content, link.href)) {
      continue;
    }

    const phrases = [link.anchorText, link.title].filter(
      (value, index, array) =>
        value.trim().length >= 3 && array.indexOf(value) === index,
    );

    let applied = false;
    for (const phrase of phrases) {
      const start = findPlainTextOccurrenceOutsideAnchors(content, phrase);
      if (start < 0) {
        continue;
      }

      const end = start + phrase.length;
      const anchor = `<a href="${link.href}">${phrase}</a>`;
      content = `${content.slice(0, start)}${anchor}${content.slice(end)}`;
      linkedContentIds.push(link.contentId);
      applied = true;
      break;
    }

    if (!applied) {
      continue;
    }
  }

  return { content, linkedContentIds };
}

export function articleNeedsApprovedInternalLinkInsertion(input: {
  content: string;
  internalLinks: InternalLinkSuggestion[];
  catalog: ApprovedInternalCatalogItem[];
}): boolean {
  const resolved = resolveApprovedInternalLinks({
    internalLinks: input.internalLinks,
    catalog: input.catalog,
  });

  return resolved.some(
    (link) => !htmlAlreadyContainsInternalHref(input.content, link.href),
  );
}

export function extractCveTokens(value: string): string[] {
  return [...value.matchAll(CVE_PATTERN)].map((match) => match[0].toUpperCase());
}
