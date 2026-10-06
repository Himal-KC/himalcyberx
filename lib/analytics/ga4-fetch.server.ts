import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { protos } from "@google-analytics/data";
import {
  buildAdminAnalyticsDashboardData,
  type Ga4BatchReportSet,
} from "@/lib/analytics/ga4-normalize-core";
import {
  GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT,
  GA4_ADMIN_MAX_REPORT_COUNT,
  GA4_ADMIN_REPORT_DEFINITIONS,
} from "@/lib/analytics/ga4-reports-core";
import { resolveGa4AdminConfig } from "@/lib/analytics/ga4-service-account-core";
import type {
  AdminAnalyticsDashboardData,
  AdminAnalyticsShareMethodBreakdownStatus,
  Ga4ReportPayload,
} from "@/lib/analytics/ga4-types";

type RunReportRequest =
  protos.google.analytics.data.v1beta.IRunReportRequest;

export interface Ga4DashboardFetchMeta {
  batchHttpRequestCount: number;
  reportCount: number;
}

export type Ga4DashboardFetchResult =
  | {
      ok: true;
      data: AdminAnalyticsDashboardData;
      meta: Ga4DashboardFetchMeta;
    }
  | { ok: false; error: string };

function readServerGa4Config() {
  return resolveGa4AdminConfig({
    propertyIdRaw: process.env.GA4_PROPERTY_ID,
    serviceAccountJsonRaw: process.env.GA4_SERVICE_ACCOUNT_JSON,
  });
}

function toReportPayload(value: unknown): Ga4ReportPayload {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record = value as Ga4ReportPayload;
  return {
    rows: record.rows ?? [],
    rowCount: record.rowCount ?? 0,
  };
}

function mapBatchReports(
  reports: Array<Ga4ReportPayload | null | undefined>,
  shareEventsByMethod30d: Ga4ReportPayload | null | undefined,
): Ga4BatchReportSet {
  const [
    dailyViews30d,
    activeUsers7d,
    averageSessionDuration30d,
    topContent30d,
    trafficSources30d,
    devices30d,
    countries30d,
    shareEventsTotal30d,
  ] = reports;

  return {
    dailyViews30d,
    activeUsers7d,
    averageSessionDuration30d,
    topContent30d,
    trafficSources30d,
    devices30d,
    countries30d,
    shareEventsTotal30d,
    shareEventsByMethod30d,
  };
}

function cloneReportRequest(
  request: (typeof GA4_ADMIN_REPORT_DEFINITIONS)[keyof typeof GA4_ADMIN_REPORT_DEFINITIONS],
): RunReportRequest {
  return structuredClone(request) as RunReportRequest;
}

async function fetchShareMethodBreakdownReport(
  client: BetaAnalyticsDataClient,
  property: string,
): Promise<{
  payload: Ga4ReportPayload | null;
  status: AdminAnalyticsShareMethodBreakdownStatus;
}> {
  try {
    const methodResult = await client.batchRunReports({
      property,
      requests: [cloneReportRequest(GA4_ADMIN_REPORT_DEFINITIONS.shareEventsByMethod30d)],
    });

    const report = methodResult[0]?.reports?.[0];
    if (!report) {
      return { payload: null, status: "unavailable" };
    }

    return {
      payload: toReportPayload(report),
      status: "available",
    };
  } catch {
    return { payload: null, status: "not_configured" };
  }
}

export async function fetchGa4AdminDashboardUncached(): Promise<Ga4DashboardFetchResult> {
  const config = readServerGa4Config();
  if (!config.ok) {
    return { ok: false, error: config.error };
  }

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: config.credentials.client_email,
      private_key: config.credentials.private_key,
    },
  });

  const property = `properties/${config.propertyId}`;
  const {
    dailyViews30d,
    activeUsers7d,
    averageSessionDuration30d,
    topContent30d,
    trafficSources30d,
    devices30d,
    countries30d,
    shareEventsTotal30d,
  } = GA4_ADMIN_REPORT_DEFINITIONS;

  const batchOneRequests: RunReportRequest[] = [
    cloneReportRequest(dailyViews30d),
    cloneReportRequest(activeUsers7d),
    cloneReportRequest(averageSessionDuration30d),
    cloneReportRequest(topContent30d),
    cloneReportRequest(trafficSources30d),
  ];

  const batchTwoRequests: RunReportRequest[] = [
    cloneReportRequest(devices30d),
    cloneReportRequest(countries30d),
    cloneReportRequest(shareEventsTotal30d),
  ];

  try {
    const batchOneResult = await client.batchRunReports({
      property,
      requests: batchOneRequests,
    });
    const batchTwoResult = await client.batchRunReports({
      property,
      requests: batchTwoRequests,
    });

    const batchOneReports = batchOneResult[0]?.reports ?? [];
    const batchTwoReports = batchTwoResult[0]?.reports ?? [];

    if (batchOneReports.length !== 5 || batchTwoReports.length !== 3) {
      return {
        ok: false,
        error: "Analytics response was incomplete. Try again later.",
      };
    }

    const shareMethodResult = await fetchShareMethodBreakdownReport(
      client,
      property,
    );

    const payloads: Ga4ReportPayload[] = [
      ...batchOneReports.map((report) => toReportPayload(report)),
      ...batchTwoReports.map((report) => toReportPayload(report)),
    ];

    const data = buildAdminAnalyticsDashboardData(
      mapBatchReports(payloads, shareMethodResult.payload),
      { shareMethodBreakdownStatus: shareMethodResult.status },
    );

    return {
      ok: true,
      data,
      meta: {
        batchHttpRequestCount: GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT,
        reportCount: GA4_ADMIN_MAX_REPORT_COUNT,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Unable to load analytics from Google Analytics right now.",
    };
  }
}
