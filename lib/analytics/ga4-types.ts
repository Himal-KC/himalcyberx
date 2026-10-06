export interface AdminAnalyticsKpis {
  viewsToday: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  activeUsersLast7Days: number;
}

export interface AdminAnalyticsDailyViews {
  date: string;
  views: number;
}

export interface AdminAnalyticsTopContentRow {
  path: string;
  title: string;
  views: number;
  avgEngagementSecondsPerView: number | null;
}

export interface AdminAnalyticsAverageEngagement {
  /** Human-readable description of the GA4 metric shown. */
  label: string;
  seconds: number;
}

export interface AdminAnalyticsBreakdownRow {
  name: string;
  value: number;
}

export type AdminAnalyticsShareMethodBreakdownStatus =
  | "available"
  | "unavailable"
  | "not_configured";

export interface AdminAnalyticsShareMethodRow {
  method: string;
  label: string;
  count: number;
}

export interface AdminAnalyticsShareEngagement {
  periodDays: 30;
  totalActions: number;
  methods: AdminAnalyticsShareMethodRow[];
  methodBreakdownStatus: AdminAnalyticsShareMethodBreakdownStatus;
  methodBreakdownNotice?: string;
}

export interface Ga4PagePathMetrics {
  views: number;
  userEngagementDuration: number;
}

export type Ga4PagePathMetricsMap = Record<string, Ga4PagePathMetrics>;

export type Ga4ShareActionsByPathMap = Record<string, number>;

export type AdminAnalyticsRecentContentStatus =
  | "ok"
  | "cms_unavailable";

export type AdminAnalyticsSharePerContentStatus =
  | "available"
  | "not_configured"
  | "unavailable";

export interface AdminAnalyticsRecentContentRow {
  id: string;
  title: string;
  contentType: "article" | "tutorial" | "lab";
  contentTypeLabel: string;
  slug: string;
  publicPath: string;
  publishedAt: string;
  publishedAtFormatted: string;
  publishedRelative: string;
  views: number;
  avgEngagementSecondsPerView: number | null;
  avgEngagementFormatted: string;
  shareActions: number | null;
}

export interface AdminAnalyticsRecentContentPerformance {
  periodDays: 30;
  periodDescription: string;
  status: AdminAnalyticsRecentContentStatus;
  rows: AdminAnalyticsRecentContentRow[];
  sharePerContentStatus: AdminAnalyticsSharePerContentStatus;
  sharePerContentNotice?: string;
}

export interface RecentPublishedContentItem {
  id: string;
  title: string;
  slug: string;
  contentType: "article" | "tutorial" | "lab";
  publishedAt: string;
  publicPath: string;
}

export interface AdminAnalyticsDashboardData {
  kpis: AdminAnalyticsKpis;
  viewsOverTime: AdminAnalyticsDailyViews[];
  topContent: AdminAnalyticsTopContentRow[];
  averageEngagement: AdminAnalyticsAverageEngagement | null;
  trafficSources: AdminAnalyticsBreakdownRow[];
  devices: AdminAnalyticsBreakdownRow[];
  countries: AdminAnalyticsBreakdownRow[];
  shareEngagement: AdminAnalyticsShareEngagement;
  recentContentPerformance: AdminAnalyticsRecentContentPerformance;
}

export type AdminAnalyticsLoadResult =
  | {
      status: "ok";
      data: AdminAnalyticsDashboardData;
      fetchedAt: string;
      cacheMaxAgeSeconds: number;
    }
  | {
      status: "unavailable";
      message: string;
    };

/** Minimal GA report row shape for normalization (not tied to SDK types). */
export interface Ga4ReportRow {
  dimensionValues?: Array<{ value?: string | null }>;
  metricValues?: Array<{ value?: string | null }>;
}

export interface Ga4ReportPayload {
  rows?: Ga4ReportRow[] | null;
  rowCount?: number | null;
}
