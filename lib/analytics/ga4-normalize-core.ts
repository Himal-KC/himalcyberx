import {
  formatGa4DateDimension,
  parseGa4MetricFloat,
  parseGa4MetricInt,
} from "./ga4-format-core.ts";
import { filterPublicContentPaths } from "./ga4-path-core.ts";
import { buildShareEngagementSummary } from "./ga4-share-normalize-core.ts";
import type {
  AdminAnalyticsAverageEngagement,
  AdminAnalyticsBreakdownRow,
  AdminAnalyticsDailyViews,
  AdminAnalyticsDashboardData,
  AdminAnalyticsKpis,
  AdminAnalyticsShareMethodBreakdownStatus,
  AdminAnalyticsTopContentRow,
  Ga4ReportPayload,
} from "./ga4-types.ts";

const TOP_CONTENT_LIMIT = 10;
const COUNTRY_LIMIT = 15;

export function normalizeSingleMetricReport(
  report: Ga4ReportPayload | null | undefined,
): number {
  const row = report?.rows?.[0];
  return parseGa4MetricInt(row?.metricValues?.[0]?.value);
}

export function normalizeDailyViewsReport(
  report: Ga4ReportPayload | null | undefined,
): AdminAnalyticsDailyViews[] {
  const rows = report?.rows ?? [];
  const daily: AdminAnalyticsDailyViews[] = [];

  for (const row of rows) {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    const views = parseGa4MetricInt(row.metricValues?.[0]?.value);
    daily.push({
      date: formatGa4DateDimension(rawDate),
      views,
    });
  }

  daily.sort((a, b) => a.date.localeCompare(b.date));
  return daily;
}

export function deriveKpisFromDailyViews(
  daily: AdminAnalyticsDailyViews[],
): Pick<
  AdminAnalyticsKpis,
  "viewsToday" | "viewsLast7Days" | "viewsLast30Days"
> {
  if (daily.length === 0) {
    return { viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0 };
  }

  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const viewsLast30Days = sorted.reduce((sum, row) => sum + row.views, 0);
  const last7 = sorted.slice(-7);
  const viewsLast7Days = last7.reduce((sum, row) => sum + row.views, 0);
  const viewsToday = sorted[sorted.length - 1]?.views ?? 0;

  return { viewsToday, viewsLast7Days, viewsLast30Days };
}

export function normalizeTopContentReport(
  report: Ga4ReportPayload | null | undefined,
): AdminAnalyticsTopContentRow[] {
  const rows = report?.rows ?? [];
  const mapped: AdminAnalyticsTopContentRow[] = [];

  for (const row of rows) {
    const path = row.dimensionValues?.[0]?.value ?? "";
    const title = row.dimensionValues?.[1]?.value ?? path;
    const views = parseGa4MetricInt(row.metricValues?.[0]?.value);
    const engagementDuration = parseGa4MetricFloat(
      row.metricValues?.[1]?.value,
    );

    let avgEngagementSecondsPerView: number | null = null;
    if (views > 0 && engagementDuration > 0) {
      avgEngagementSecondsPerView = engagementDuration / views;
    }

    mapped.push({
      path,
      title: title.trim() || path,
      views,
      avgEngagementSecondsPerView,
    });
  }

  return filterPublicContentPaths(mapped)
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP_CONTENT_LIMIT);
}

export function normalizeAverageEngagementReport(
  report: Ga4ReportPayload | null | undefined,
): AdminAnalyticsAverageEngagement | null {
  const seconds = parseGa4MetricFloat(
    report?.rows?.[0]?.metricValues?.[0]?.value,
  );

  if (seconds <= 0) {
    return null;
  }

  return {
    label:
      "Average session duration (GA4 averageSessionDuration, last 30 days)",
    seconds,
  };
}

export function normalizeDimensionBreakdownReport(
  report: Ga4ReportPayload | null | undefined,
  options?: { limit?: number; emptyLabel?: string },
): AdminAnalyticsBreakdownRow[] {
  const limit = options?.limit ?? 20;
  const emptyLabel = options?.emptyLabel ?? "(not set)";
  const rows = report?.rows ?? [];
  const breakdown: AdminAnalyticsBreakdownRow[] = [];

  for (const row of rows) {
    const rawName = row.dimensionValues?.[0]?.value ?? "";
    const name = rawName.trim() === "" ? emptyLabel : rawName;
    const value = parseGa4MetricInt(row.metricValues?.[0]?.value);
    breakdown.push({ name, value });
  }

  return breakdown
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export interface Ga4BatchReportSet {
  dailyViews30d: Ga4ReportPayload | null | undefined;
  activeUsers7d: Ga4ReportPayload | null | undefined;
  averageSessionDuration30d: Ga4ReportPayload | null | undefined;
  topContent30d: Ga4ReportPayload | null | undefined;
  trafficSources30d: Ga4ReportPayload | null | undefined;
  devices30d: Ga4ReportPayload | null | undefined;
  countries30d: Ga4ReportPayload | null | undefined;
  shareEventsTotal30d: Ga4ReportPayload | null | undefined;
  shareEventsByMethod30d: Ga4ReportPayload | null | undefined;
}

export interface BuildAdminAnalyticsDashboardOptions {
  shareMethodBreakdownStatus: AdminAnalyticsShareMethodBreakdownStatus;
}

export function buildAdminAnalyticsDashboardData(
  reports: Ga4BatchReportSet,
  options: BuildAdminAnalyticsDashboardOptions,
): AdminAnalyticsDashboardData {
  const viewsOverTime = normalizeDailyViewsReport(reports.dailyViews30d);
  const kpiViews = deriveKpisFromDailyViews(viewsOverTime);
  const activeUsersLast7Days = normalizeSingleMetricReport(
    reports.activeUsers7d,
  );

  return {
    kpis: {
      ...kpiViews,
      activeUsersLast7Days,
    },
    viewsOverTime,
    topContent: normalizeTopContentReport(reports.topContent30d),
    averageEngagement: normalizeAverageEngagementReport(
      reports.averageSessionDuration30d,
    ),
    trafficSources: normalizeDimensionBreakdownReport(
      reports.trafficSources30d,
    ),
    devices: normalizeDimensionBreakdownReport(reports.devices30d),
    countries: normalizeDimensionBreakdownReport(reports.countries30d, {
      limit: COUNTRY_LIMIT,
      emptyLabel: "Unknown",
    }),
    shareEngagement: buildShareEngagementSummary({
      totalReport: reports.shareEventsTotal30d,
      methodReport: reports.shareEventsByMethod30d,
      methodBreakdownStatus: options.shareMethodBreakdownStatus,
    }),
  };
}
