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

export interface AdminAnalyticsDashboardData {
  kpis: AdminAnalyticsKpis;
  viewsOverTime: AdminAnalyticsDailyViews[];
  topContent: AdminAnalyticsTopContentRow[];
  averageEngagement: AdminAnalyticsAverageEngagement | null;
  trafficSources: AdminAnalyticsBreakdownRow[];
  devices: AdminAnalyticsBreakdownRow[];
  countries: AdminAnalyticsBreakdownRow[];
  shareEngagement: AdminAnalyticsShareEngagement;
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
