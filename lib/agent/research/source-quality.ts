const GENERIC_INDEX_PATTERNS = [
  /\/search(?:\/|$|\?)/i,
  /\/cybersecurity-advisories(?:\/|$|\?)/i,
  /\/news-events\/cybersecurity-advisories(?:\/|$|\?)/i,
  /\/category\//i,
  /\/archive(?:\/|$|\?)/i,
  /\/topics\//i,
  /\/tag\//i,
  /\/filter/i,
  /\/index(?:\.html)?(?:\/|$|\?)/i,
  /\/all-(?:alerts|advisories|news)/i,
  /\/resources(?:\/|$|\?)$/i,
];

const FOCUSED_PAGE_PATTERNS = [
  /\/news-events\/(?:cybersecurity-advisories|alerts)\/[a-z0-9-]+/i,
  /\/resources-tools\//i,
  /\/stopransomware/i,
  /\/known-exploited-vulnerabilities/i,
  /\/vuln\/detail\/cve-/i,
  /\/security-guidance\//i,
  /\/guidance\//i,
  /\/alerts\/[a-z0-9-]+/i,
  /\/advisories\/[a-z0-9-]+/i,
  /\/articles\/[a-z0-9-]+/i,
  /\/blog\/[a-z0-9-]+/i,
];

export function isLikelyPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

export function isGenericIndexPage(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname === "/" || pathname.split("/").filter(Boolean).length <= 1) {
      return true;
    }

    return GENERIC_INDEX_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

export function isFocusedGuidancePage(url: string): boolean {
  if (isLikelyPdfUrl(url)) {
    return false;
  }

  try {
    const pathname = new URL(url).pathname;
    return FOCUSED_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

export function scoreSourcePathQuality(url: string): number {
  if (isLikelyPdfUrl(url)) {
    return 20;
  }

  if (isGenericIndexPage(url)) {
    return 15;
  }

  if (isFocusedGuidancePage(url)) {
    return 95;
  }

  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      return 75;
    }

    if (segments.length === 2) {
      return 55;
    }
  } catch {
    return 40;
  }

  return 45;
}

export function isHtmlPreferredForFetch(url: string): boolean {
  return !isLikelyPdfUrl(url);
}

const MAX_PAGES_PER_RUN = 8;

export interface FetchSelectionInput {
  url: string;
  sortOrder?: number;
}

export function selectUrlsForFetch(
  sources: FetchSelectionInput[],
  maxPages = MAX_PAGES_PER_RUN,
): string[] {
  const ranked = [...sources]
    .map((source, index) => ({
      url: source.url,
      index: source.sortOrder ?? index,
      pathQuality: scoreSourcePathQuality(source.url),
      htmlPreferred: isHtmlPreferredForFetch(source.url),
    }))
    .sort((left, right) => {
      if (left.htmlPreferred !== right.htmlPreferred) {
        return left.htmlPreferred ? -1 : 1;
      }

      if (right.pathQuality !== left.pathQuality) {
        return right.pathQuality - left.pathQuality;
      }

      return left.index - right.index;
    });

  const selected: string[] = [];
  const seen = new Set<string>();

  for (const entry of ranked) {
    const key = entry.url.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    if (!isHtmlPreferredForFetch(entry.url)) {
      continue;
    }

    seen.add(key);
    selected.push(entry.url);

    if (selected.length >= maxPages) {
      break;
    }
  }

  return selected;
}
