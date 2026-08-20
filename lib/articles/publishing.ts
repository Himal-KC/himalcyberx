import type { Article, ArticleStatus } from "@/lib/supabase/types";

type PublishTimingFields = Pick<Article, "status" | "published_at">;

export function isArticlePubliclyAvailable(
  article: PublishTimingFields,
  now: Date = new Date(),
): boolean {
  if (article.status !== "published") {
    return false;
  }

  if (!article.published_at) {
    return true;
  }

  return new Date(article.published_at).getTime() <= now.getTime();
}

export function isPublishedAtPubliclyAvailable(
  publishedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!publishedAt) {
    return true;
  }

  return new Date(publishedAt).getTime() <= now.getTime();
}
export function isArticleScheduled(
  article: PublishTimingFields,
  now: Date = new Date(),
): boolean {
  if (article.status !== "published" || !article.published_at) {
    return false;
  }

  return new Date(article.published_at).getTime() > now.getTime();
}

export function getPublicAvailabilityIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function formatScheduledPublishLabel(
  publishedAt: string | null | undefined,
): string | null {
  if (!publishedAt) {
    return null;
  }

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function resolveAdminStatusLabel(
  status: ArticleStatus,
  publishedAt: string | null | undefined,
): string {
  if (isArticleScheduled({ status, published_at: publishedAt ?? null })) {
    return "Scheduled";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}
