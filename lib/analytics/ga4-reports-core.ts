/** GA4 Data API report definitions (portable, no SDK import). */

import { GA4_SHARE_METHOD_DIMENSION } from "./ga4-share-dimension-core.ts";

export const GA4_SHARE_EVENT_NAME_FILTER = {
  filter: {
    fieldName: "eventName",
    stringFilter: {
      matchType: "EXACT" as const,
      value: "share",
    },
  },
};

export const GA4_ADMIN_PUBLIC_PATH_FILTER = {
  notExpression: {
    filter: {
      fieldName: "pagePath",
      stringFilter: {
        matchType: "BEGINS_WITH" as const,
        value: "/admin",
      },
    },
  },
};

export const GA4_ADMIN_REPORT_DEFINITIONS = {
  dailyViews30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  },
  activeUsers7d: {
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "activeUsers" }],
  },
  averageSessionDuration30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [{ name: "averageSessionDuration" }],
  },
  topContent30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }],
    dimensionFilter: GA4_ADMIN_PUBLIC_PATH_FILTER,
    orderBys: [
      {
        metric: { metricName: "screenPageViews" },
        desc: true,
      },
    ],
    limit: 25,
  },
  trafficSources30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [
      {
        metric: { metricName: "sessions" },
        desc: true,
      },
    ],
    limit: 12,
  },
  devices30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
    orderBys: [
      {
        metric: { metricName: "sessions" },
        desc: true,
      },
    ],
    limit: 6,
  },
  countries30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [
      {
        metric: { metricName: "activeUsers" },
        desc: true,
      },
    ],
    limit: 20,
  },
  shareEventsTotal30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: GA4_SHARE_EVENT_NAME_FILTER,
  },
  shareEventsByMethod30d: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: GA4_SHARE_METHOD_DIMENSION }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: GA4_SHARE_EVENT_NAME_FILTER,
    orderBys: [
      {
        metric: { metricName: "eventCount" },
        desc: true,
      },
    ],
    limit: 10,
  },
};

/** Required reports in the two primary batchRunReports calls. */
export const GA4_ADMIN_BATCH_REPORT_COUNT = 8;

/** Primary batchRunReports HTTP calls (always executed on cache miss). */
export const GA4_ADMIN_BATCH_HTTP_REQUEST_COUNT = 2;

/** Optional third batchRunReports call for share method breakdown. */
export const GA4_ADMIN_OPTIONAL_SHARE_METHOD_BATCH_HTTP_REQUEST_COUNT = 1;

export const GA4_ADMIN_OPTIONAL_SHARE_METHOD_REPORT_COUNT = 1;

export const GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT =
  GA4_ADMIN_BATCH_HTTP_REQUEST_COUNT +
  GA4_ADMIN_OPTIONAL_SHARE_METHOD_BATCH_HTTP_REQUEST_COUNT;

export const GA4_ADMIN_MAX_REPORT_COUNT =
  GA4_ADMIN_BATCH_REPORT_COUNT +
  GA4_ADMIN_OPTIONAL_SHARE_METHOD_REPORT_COUNT;
