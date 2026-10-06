import { formatArticleDate } from "../articles.ts";
import {
  formatDurationSeconds,
  parseGa4MetricInt,
} from "./ga4-format-core.ts";
import { GA4_SHARE_PER_CONTENT_UNAVAILABLE_NOTICE } from "./ga4-share-dimension-core.ts";
import {
  RECENT_CONTENT_TYPE_LABELS,
  formatRecentContentPublishedRelative,
  normalizeAnalyticsPagePath,
} from "./recent-content-path-core.ts";
import type {
  AdminAnalyticsRecentContentPerformance,
  AdminAnalyticsRecentContentRow,
  AdminAnalyticsSharePerContentStatus,
  Ga4PagePathMetricsMap,
  Ga4ShareActionsByPathMap,
  RecentPublishedContentItem,
} from "./ga4-types.ts";

export const RECENT_CONTENT_PERFORMANCE_PERIOD_DAYS = 30;

export const RECENT_CONTENT_PERFORMANCE_DESCRIPTION =
  "Performance during the last 30 days for recently published content." as const;

export function normalizePagePathPerformanceReport(
  rows: Array<{
    dimensionValues?: Array<{ value?: string | null }>;
    metricValues?: Array<{ value?: string | null }>;
  }> | null | undefined,
): Ga4PagePathMetricsMap {
  const map: Ga4PagePathMetricsMap = {};

  for (const row of rows ?? []) {
    const rawPath = row.dimensionValues?.[0]?.value ?? "";
    const path = normalizeAnalyticsPagePath(rawPath);
    if (!path || path.startsWith("/admin")) {
      continue;
    }

    const views = Number.parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    const engagementDuration = Number.parseFloat(
      row.metricValues?.[1]?.value ?? "0",
    );

    const safeViews = Number.isFinite(views) ? views : 0;
    const safeEngagement = Number.isFinite(engagementDuration)
      ? engagementDuration
      : 0;

    const existing = map[path];
    map[path] = {
      views: (existing?.views ?? 0) + safeViews,
      userEngagementDuration:
        (existing?.userEngagementDuration ?? 0) + safeEngagement,
    };
  }

  return map;
}

export function normalizeShareEventsByPagePathReport(
  rows: Array<{
    dimensionValues?: Array<{ value?: string | null }>;
    metricValues?: Array<{ value?: string | null }>;
  }> | null | undefined,
): Ga4ShareActionsByPathMap {
  const map: Ga4ShareActionsByPathMap = {};

  for (const row of rows ?? []) {
    const rawPath = row.dimensionValues?.[0]?.value ?? "";
    const path = normalizeAnalyticsPagePath(rawPath);
    if (!path || path.startsWith("/admin")) {
      continue;
    }

    const count = parseGa4MetricInt(row.metricValues?.[0]?.value);
    map[path] = (map[path] ?? 0) + count;
  }

  return map;
}

function computeAvgEngagementPerView(
  views: number,
  userEngagementDuration: number,
): number | null {
  if (views <= 0 || userEngagementDuration <= 0) {
    return null;
  }

  return userEngagementDuration / views;
}

function resolveShareActionsForPath(
  publicPath: string,
  sharePerContentStatus: AdminAnalyticsSharePerContentStatus,
  shareActionsByPath: Ga4ShareActionsByPathMap,
): number | null {
  if (sharePerContentStatus !== "available") {
    return null;
  }

  return shareActionsByPath[publicPath] ?? 0;
}

export function joinRecentContentPerformance(input: {
  cmsItems: RecentPublishedContentItem[];
  pagePathMetrics: Ga4PagePathMetricsMap;
  shareActionsByPath: Ga4ShareActionsByPathMap;
  sharePerContentStatus: AdminAnalyticsSharePerContentStatus;
  cmsAvailable: boolean;
}): AdminAnalyticsRecentContentPerformance {
  const shareNotice =
    input.sharePerContentStatus === "available"
      ? undefined
      : GA4_SHARE_PER_CONTENT_UNAVAILABLE_NOTICE;

  if (!input.cmsAvailable) {
    return {
      periodDays: RECENT_CONTENT_PERFORMANCE_PERIOD_DAYS,
      periodDescription: RECENT_CONTENT_PERFORMANCE_DESCRIPTION,
      status: "cms_unavailable",
      rows: [],
      sharePerContentStatus: input.sharePerContentStatus,
      sharePerContentNotice: shareNotice,
    };
  }

  const rows: AdminAnalyticsRecentContentRow[] = input.cmsItems.map((item) => {
    const metrics = input.pagePathMetrics[item.publicPath];
    const views = metrics?.views ?? 0;
    const avgEngagementSecondsPerView = metrics
      ? computeAvgEngagementPerView(
          metrics.views,
          metrics.userEngagementDuration,
        )
      : null;
    const shareActions = resolveShareActionsForPath(
      item.publicPath,
      input.sharePerContentStatus,
      input.shareActionsByPath,
    );

    return {
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      contentTypeLabel: RECENT_CONTENT_TYPE_LABELS[item.contentType],
      slug: item.slug,
      publicPath: item.publicPath,
      publishedAt: item.publishedAt,
      publishedAtFormatted: formatArticleDate(item.publishedAt),
      publishedRelative: formatRecentContentPublishedRelative(item.publishedAt),
      views,
      avgEngagementSecondsPerView,
      avgEngagementFormatted:
        avgEngagementSecondsPerView === null
          ? "—"
          : formatDurationSeconds(avgEngagementSecondsPerView),
      shareActions,
    };
  });

  return {
    periodDays: RECENT_CONTENT_PERFORMANCE_PERIOD_DAYS,
    periodDescription: RECENT_CONTENT_PERFORMANCE_DESCRIPTION,
    status: "ok",
    rows,
    sharePerContentStatus: input.sharePerContentStatus,
    sharePerContentNotice: shareNotice,
  };
}
