export const GA4_SHARE_EVENT_NAME = "share" as const;

export const ARTICLE_SHARE_METHODS = ["linkedin", "x", "copy_link"] as const;

export type ArticleShareMethod = (typeof ARTICLE_SHARE_METHODS)[number];

export interface ArticleShareEventParams {
  method: ArticleShareMethod;
  content_type: "article";
  item_id: string;
  page_path: string;
}

const PII_PATTERN =
  /@|mailto:|user_id|email|session|token|password|subscriber/i;

export function shouldSendShareAnalyticsEvent(analyticsGranted: boolean): boolean {
  return analyticsGranted;
}

export function isValidArticleShareSlug(slug: string): boolean {
  const trimmed = slug.trim();
  if (!trimmed || trimmed.includes("?") || trimmed.includes("#")) {
    return false;
  }

  if (trimmed.includes("..") || trimmed.startsWith("/")) {
    return false;
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed);
}

export function buildArticleSharePagePath(slug: string): string | null {
  if (!isValidArticleShareSlug(slug)) {
    return null;
  }

  const path = `/articles/${slug.trim()}`;
  if (path.startsWith("/admin")) {
    return null;
  }

  return path;
}

export function buildArticleShareEventParams(
  method: ArticleShareMethod,
  slug: string,
): ArticleShareEventParams | null {
  if (!ARTICLE_SHARE_METHODS.includes(method)) {
    return null;
  }

  const page_path = buildArticleSharePagePath(slug);
  if (!page_path) {
    return null;
  }

  const item_id = slug.trim();

  const payload: ArticleShareEventParams = {
    method,
    content_type: "article",
    item_id,
    page_path,
  };

  if (containsShareEventPii(payload)) {
    return null;
  }

  return payload;
}

export function containsShareEventPii(
  params: ArticleShareEventParams,
): boolean {
  const values = [
    params.method,
    params.content_type,
    params.item_id,
    params.page_path,
  ];

  return values.some((value) => PII_PATTERN.test(value));
}
