import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildArticleShareEventParams,
  buildArticleSharePagePath,
  shouldSendShareAnalyticsEvent,
} = (await import(
  pathToFileURL(join(testDir, "ga4-share-events-core.ts")).href
)) as typeof import("./ga4-share-events-core");

const {
  buildShareEngagementSummary,
  formatShareMethodLabel,
  normalizeShareEventsByMethodReport,
  normalizeShareEventsTotalReport,
} = (await import(
  pathToFileURL(join(testDir, "ga4-share-normalize-core.ts")).href
)) as typeof import("./ga4-share-normalize-core");

const { buildAdminAnalyticsDashboardData } = (await import(
  pathToFileURL(join(testDir, "ga4-normalize-core.ts")).href
)) as typeof import("./ga4-normalize-core");

describe("article share GA4 events", () => {
  it("does not send when analytics consent is denied", () => {
    assert.equal(shouldSendShareAnalyticsEvent(false), false);
    assert.equal(shouldSendShareAnalyticsEvent(true), true);
  });

  it("builds non-PII share payload for public articles", () => {
    const params = buildArticleShareEventParams("linkedin", "example-article");
    assert.ok(params);
    assert.equal(params.method, "linkedin");
    assert.equal(params.content_type, "article");
    assert.equal(params.item_id, "example-article");
    assert.equal(params.page_path, "/articles/example-article");
    assert.doesNotMatch(JSON.stringify(params), /@/);
    assert.doesNotMatch(params.page_path, /admin/);
  });

  it("rejects admin-like paths and query-bearing slugs", () => {
    assert.equal(buildArticleSharePagePath("../admin"), null);
    assert.equal(buildArticleShareEventParams("x", "bad?query=1"), null);
    assert.equal(buildArticleShareEventParams("copy_link", "/admin/foo"), null);
  });

  it("supports copy_link events for post-success clipboard tracking", () => {
    const params = buildArticleShareEventParams("copy_link", "sample-post");
    assert.ok(params);
    assert.equal(params.method, "copy_link");
  });
});

describe("share GA4 normalization", () => {
  it("normalizes method labels", () => {
    assert.equal(formatShareMethodLabel("linkedin"), "LinkedIn");
    assert.equal(formatShareMethodLabel("copy_link"), "Copy Link");
  });

  it("normalizes total and method breakdown reports", () => {
    assert.equal(
      normalizeShareEventsTotalReport({
        rows: [{ metricValues: [{ value: "36" }] }],
      }),
      36,
    );

    const methods = normalizeShareEventsByMethodReport({
      rows: [
        {
          dimensionValues: [{ value: "copy_link" }],
          metricValues: [{ value: "18" }],
        },
        {
          dimensionValues: [{ value: "linkedin" }],
          metricValues: [{ value: "12" }],
        },
      ],
    });

    assert.equal(methods[0]?.method, "copy_link");
    assert.equal(methods[0]?.count, 18);
  });

  it("returns zero totals for empty share responses", () => {
    const summary = buildShareEngagementSummary({
      totalReport: { rows: [] },
      methodReport: { rows: [] },
      methodBreakdownStatus: "available",
    });

    assert.equal(summary.totalActions, 0);
    assert.equal(summary.methods.length, 0);
  });

  it("marks method breakdown unavailable when not configured", () => {
    const summary = buildShareEngagementSummary({
      totalReport: { rows: [{ metricValues: [{ value: "4" }] }] },
      methodReport: null,
      methodBreakdownStatus: "not_configured",
    });

    assert.equal(summary.totalActions, 4);
    assert.equal(summary.methodBreakdownStatus, "not_configured");
    assert.equal(summary.methods.length, 0);
    assert.match(summary.methodBreakdownNotice ?? "", /custom dimension/i);
  });
});

describe("Phase 2 dashboard normalization regression", () => {
  it("still builds core dashboard metrics with share engagement", () => {
    const data = buildAdminAnalyticsDashboardData(
      {
        dailyViews30d: {
          rows: [
            {
              dimensionValues: [{ value: "20260101" }],
              metricValues: [{ value: "3" }],
            },
          ],
        },
        activeUsers7d: { rows: [{ metricValues: [{ value: "2" }] }] },
        averageSessionDuration30d: { rows: [] },
        topContent30d: { rows: [] },
        trafficSources30d: { rows: [] },
        devices30d: { rows: [] },
        countries30d: { rows: [] },
        shareEventsTotal30d: { rows: [{ metricValues: [{ value: "0" }] }] },
        shareEventsByMethod30d: { rows: [] },
      },
      { shareMethodBreakdownStatus: "available" },
    );

    assert.equal(data.kpis.viewsLast30Days, 3);
    assert.equal(data.shareEngagement.totalActions, 0);
  });
});
