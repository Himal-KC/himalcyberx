import "server-only";

import {
  isArticlePubliclyAvailable,
  isPublishedAtPubliclyAvailable,
} from "@/lib/articles/publishing";
import {
  buildRecentContentPublicPath,
  type RecentContentType,
} from "@/lib/analytics/recent-content-path-core";
import { logQueryError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { RecentPublishedContentItem } from "@/lib/analytics/ga4-types";
import type { ArticleStatus, LabStatus, TutorialStatus } from "@/lib/supabase/types";

export const RECENT_PUBLISHED_CONTENT_FETCH_LIMIT = 15;
export const RECENT_PUBLISHED_CONTENT_DISPLAY_LIMIT = 15;

export type FetchRecentPublishedContentResult =
  | { ok: true; items: RecentPublishedContentItem[] }
  | { ok: false; error: string };

type PublishedRow = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus | LabStatus | TutorialStatus;
  published_at: string | null;
};

function mapPublishedRow(
  row: PublishedRow,
  contentType: RecentContentType,
): RecentPublishedContentItem | null {
  if (row.status !== "published" || !row.published_at) {
    return null;
  }

  if (contentType === "article") {
    if (
      !isArticlePubliclyAvailable({
        status: row.status as ArticleStatus,
        published_at: row.published_at,
      })
    ) {
      return null;
    }
  } else if (!isPublishedAtPubliclyAvailable(row.published_at)) {
    return null;
  }

  const publicPath = buildRecentContentPublicPath(contentType, row.slug);
  if (!publicPath) {
    return null;
  }

  return {
    id: row.id,
    title: row.title.trim() || row.slug,
    slug: row.slug.trim(),
    contentType,
    publishedAt: row.published_at,
    publicPath,
  };
}

async function fetchPublishedRows(
  table: "articles" | "tutorials" | "labs",
  contentType: RecentContentType,
): Promise<RecentPublishedContentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, title, slug, status, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(RECENT_PUBLISHED_CONTENT_FETCH_LIMIT);

  if (error) {
    logQueryError(`analytics-recent-content:${table}`, error);
    return [];
  }

  return ((data ?? []) as PublishedRow[])
    .map((row) => mapPublishedRow(row, contentType))
    .filter((row): row is RecentPublishedContentItem => row !== null);
}

export async function fetchRecentPublishedContentForAnalytics(): Promise<FetchRecentPublishedContentResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "CMS connection is not configured." };
  }

  try {
    const [articles, tutorials, labs] = await Promise.all([
      fetchPublishedRows("articles", "article"),
      fetchPublishedRows("tutorials", "tutorial"),
      fetchPublishedRows("labs", "lab"),
    ]);

    const items = [...articles, ...tutorials, ...labs]
      .sort(
        (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      )
      .slice(0, RECENT_PUBLISHED_CONTENT_DISPLAY_LIMIT);

    return { ok: true, items };
  } catch {
    return {
      ok: false,
      error: "Unable to load recently published content.",
    };
  }
}
