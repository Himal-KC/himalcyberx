import "server-only";

import {
  isValidResearchUrl,
  matchAuthoritativeDomain,
  normalizeResearchUrl,
} from "@/lib/agent/research/authoritative-domains";
import {
  blocksToPageText,
  extractHtmlBlocks,
  type ExtractedHtmlBlock,
} from "@/lib/agent/research/html-extract";
import {
  selectUrlsForFetch,
  type FetchSelectionInput,
} from "@/lib/agent/research/fetch-selection";
import { isLikelyPdfUrl } from "@/lib/agent/research/source-quality";
import { normalizeSourceText } from "@/lib/agent/research/source-text";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

export type { FetchSelectionInput } from "@/lib/agent/research/fetch-selection";
export { selectUrlsForFetch } from "@/lib/agent/research/fetch-selection";

export type FetchedSourceStatus =
  | "ok"
  | "pdf_unsupported"
  | "fetch_failed"
  | "invalid_url"
  | "unsupported_content_type"
  | "too_large"
  | "not_authoritative";

export interface FetchedSourcePage {
  url: string;
  status: FetchedSourceStatus;
  contentType: string | null;
  text: string | null;
  blocks: ExtractedHtmlBlock[];
}

async function fetchWithRedirects(
  url: string,
): Promise<
  | { ok: true; body: string; contentType: string | null }
  | { ok: false; status: FetchedSourceStatus }
> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.8",
          "User-Agent": "HimalCyberX-Research-Agent/1.0",
        },
        signal: controller.signal,
        redirect: "manual",
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          return { ok: false, status: "fetch_failed" };
        }

        const nextUrl = new URL(location, currentUrl).toString();
        const normalizedNext = normalizeResearchUrl(nextUrl);
        if (!normalizedNext || !matchAuthoritativeDomain(normalizedNext)) {
          return { ok: false, status: "fetch_failed" };
        }

        currentUrl = normalizedNext;
        continue;
      }

      if (!response.ok) {
        return { ok: false, status: "fetch_failed" };
      }

      const contentType = response.headers.get("content-type");
      const contentTypeLower = contentType?.toLowerCase() ?? "";

      if (contentTypeLower.includes("application/pdf")) {
        return { ok: false, status: "pdf_unsupported" };
      }

      if (
        !contentTypeLower.includes("text/html") &&
        !contentTypeLower.includes("text/plain") &&
        !contentTypeLower.includes("application/xhtml")
      ) {
        return { ok: false, status: "unsupported_content_type" };
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_RESPONSE_BYTES) {
        return { ok: false, status: "too_large" };
      }

      const body = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      return { ok: true, body, contentType };
    } catch {
      return { ok: false, status: "fetch_failed" };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ok: false, status: "fetch_failed" };
}

export async function fetchAuthoritativeSourcePage(
  url: string,
): Promise<FetchedSourcePage> {
  const normalizedUrl = normalizeResearchUrl(url);
  if (!normalizedUrl || !isValidResearchUrl(normalizedUrl)) {
    return {
      url,
      status: "invalid_url",
      contentType: null,
      text: null,
      blocks: [],
    };
  }

  if (!matchAuthoritativeDomain(normalizedUrl)) {
    return {
      url: normalizedUrl,
      status: "not_authoritative",
      contentType: null,
      text: null,
      blocks: [],
    };
  }

  if (isLikelyPdfUrl(normalizedUrl)) {
    return {
      url: normalizedUrl,
      status: "pdf_unsupported",
      contentType: "application/pdf",
      text: null,
      blocks: [],
    };
  }

  const response = await fetchWithRedirects(normalizedUrl);
  if (!response.ok) {
    return {
      url: normalizedUrl,
      status: response.status,
      contentType: null,
      text: null,
      blocks: [],
    };
  }

  const blocks = extractHtmlBlocks(response.body);
  const text = normalizeSourceText(blocksToPageText(blocks));

  if (!text || text.length < 80) {
    return {
      url: normalizedUrl,
      status: "fetch_failed",
      contentType: response.contentType,
      text: null,
      blocks: [],
    };
  }

  return {
    url: normalizedUrl,
    status: "ok",
    contentType: response.contentType,
    text,
    blocks,
  };
}

export async function fetchAuthoritativeSourcePages(
  sources: FetchSelectionInput[],
): Promise<Map<string, FetchedSourcePage>> {
  const urls = selectUrlsForFetch(sources);
  const results = new Map<string, FetchedSourcePage>();

  const fetched = await Promise.all(
    urls.map(async (url) => fetchAuthoritativeSourcePage(url)),
  );

  for (const page of fetched) {
    results.set(page.url, page);
  }

  for (const source of sources) {
    if (results.has(source.url)) {
      continue;
    }

    if (isLikelyPdfUrl(source.url)) {
      results.set(source.url, {
        url: source.url,
        status: "pdf_unsupported",
        contentType: "application/pdf",
        text: null,
        blocks: [],
      });
    }
  }

  return results;
}
