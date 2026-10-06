import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildRecentContentPublicPath,
  normalizeAnalyticsPagePath,
} = (await import(
  pathToFileURL(join(testDir, "recent-content-path-core.ts")).href
)) as typeof import("./recent-content-path-core");

const {
  joinRecentContentPerformance,
  normalizePagePathPerformanceReport,
  normalizeShareEventsByPagePathReport,
} = (await import(
  pathToFileURL(join(testDir, "recent-content-join-core.ts")).href
)) as typeof import("./recent-content-join-core");

const { buildAdminAnalyticsDashboardData } = (await import(
  pathToFileURL(join(testDir, "ga4-normalize-core.ts")).href
)) as typeof import("./ga4-normalize-core");

const {
  GA4_ADMIN_BATCH_REPORT_COUNT,
  GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT,
  GA4_ADMIN_MAX_REPORT_COUNT,
  GA4_ADMIN_RECENT_CONTENT_SUPABASE_QUERY_COUNT,
} = (await import(
  pathToFileURL(join(testDir, "ga4-reports-core.ts")).href
)) as typeof import("./ga4-reports-core");

describe("recent content canonical paths", () => {
  it("builds article, tutorial and lab public paths", () => {
    assert.equal(
      buildRecentContentPublicPath("article", "cisa-ransomware-guidance"),
      "/articles/cisa-ransomware-guidance",
    );
    assert.equal(
      buildRecentContentPublicPath("tutorial", "wireshark-network-traffic"),
      "/tutorials/wireshark-network-traffic",
    );
    assert.equal(
      buildRecentContentPublicPath("lab", "memory-forensics-lab"),
      "/cyber-lab/memory-forensics-lab",
    );
  });

  it("normalizes query strings and trailing slashes for GA matching", () => {
    assert.equal(
      normalizeAnalyticsPagePath("/articles/test/?utm=1"),
      "/articles/test",
    );
    assert.equal(normalizeAnalyticsPagePath("/articles/test#section"), "/articles/test");
    assert.equal(normalizeAnalyticsPagePath("/articles/test/"), "/articles/test");
  });
});

describe("recent content GA join", () => {
  it("matches CMS paths to GA metrics deterministically", () => {
    const metrics = normalizePagePathPerformanceReport([
      {
        dimensionValues: [{ value: "/articles/a/" }],
        metricValues: [{ value: "10" }, { value: "100" }],
      },
    ]);

    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      cmsItems: [
        {
          id: "1",
          title: "Article A",
          slug: "a",
          contentType: "article",
          publishedAt: "2026-03-01T00:00:00.000Z",
          publicPath: "/articles/a",
        },
      ],
      pagePathMetrics: metrics,
      shareActionsByPath: {},
      sharePerContentStatus: "available",
    });

    assert.equal(joined.rows[0]?.views, 10);
    assert.equal(joined.rows[0]?.avgEngagementSecondsPerView, 10);
  });

  it("shows zero views when CMS item has no GA row", () => {
    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      cmsItems: [
        {
          id: "2",
          title: "Tutorial B",
          slug: "b",
          contentType: "tutorial",
          publishedAt: "2026-03-02T00:00:00.000Z",
          publicPath: "/tutorials/b",
        },
      ],
      pagePathMetrics: {},
      shareActionsByPath: {},
      sharePerContentStatus: "available",
    });

    assert.equal(joined.rows[0]?.views, 0);
    assert.equal(joined.rows[0]?.avgEngagementFormatted, "—");
    assert.equal(joined.rows[0]?.shareActions, 0);
  });

  it("ignores GA rows without CMS items and excludes admin paths", () => {
    const metrics = normalizePagePathPerformanceReport([
      {
        dimensionValues: [{ value: "/admin/settings" }],
        metricValues: [{ value: "99" }, { value: "10" }],
      },
      {
        dimensionValues: [{ value: "/articles/orphan" }],
        metricValues: [{ value: "5" }, { value: "20" }],
      },
    ]);

    assert.equal(metrics["/admin/settings"], undefined);
    assert.equal(metrics["/articles/orphan"]?.views, 5);
  });

  it("handles empty CMS results", () => {
    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      cmsItems: [],
      pagePathMetrics: {},
      shareActionsByPath: {},
      sharePerContentStatus: "available",
    });
    assert.equal(joined.status, "ok");
    assert.equal(joined.rows.length, 0);
  });

  it("handles CMS unavailable without breaking structure", () => {
    const joined = joinRecentContentPerformance({
      cmsAvailable: false,
      cmsItems: [],
      pagePathMetrics: {},
      shareActionsByPath: {},
      sharePerContentStatus: "unavailable",
    });
    assert.equal(joined.status, "cms_unavailable");
    assert.equal(joined.sharePerContentStatus, "unavailable");
  });
});

describe("recent content share actions join", () => {
  it("maps share eventCount by normalized page_path for each content type", () => {
    const shareActionsByPath = normalizeShareEventsByPagePathReport([
      {
        dimensionValues: [{ value: "/articles/post/?utm=1" }],
        metricValues: [{ value: "3" }],
      },
      {
        dimensionValues: [{ value: "/tutorials/guide/" }],
        metricValues: [{ value: "2" }],
      },
      {
        dimensionValues: [{ value: "/cyber-lab/lab-a" }],
        metricValues: [{ value: "1" }],
      },
    ]);

    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      pagePathMetrics: {},
      shareActionsByPath,
      sharePerContentStatus: "available",
      cmsItems: [
        {
          id: "a",
          title: "Post",
          slug: "post",
          contentType: "article",
          publishedAt: "2026-03-01T00:00:00.000Z",
          publicPath: "/articles/post",
        },
        {
          id: "t",
          title: "Guide",
          slug: "guide",
          contentType: "tutorial",
          publishedAt: "2026-03-02T00:00:00.000Z",
          publicPath: "/tutorials/guide",
        },
        {
          id: "l",
          title: "Lab",
          slug: "lab-a",
          contentType: "lab",
          publishedAt: "2026-03-03T00:00:00.000Z",
          publicPath: "/cyber-lab/lab-a",
        },
      ],
    });

    assert.equal(joined.rows[0]?.shareActions, 3);
    assert.equal(joined.rows[1]?.shareActions, 2);
    assert.equal(joined.rows[2]?.shareActions, 1);
  });

  it("uses zero share actions when report is available but path has no events", () => {
    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      pagePathMetrics: {},
      shareActionsByPath: { "/articles/other": 5 },
      sharePerContentStatus: "available",
      cmsItems: [
        {
          id: "1",
          title: "No shares",
          slug: "none",
          contentType: "article",
          publishedAt: "2026-03-01T00:00:00.000Z",
          publicPath: "/articles/none",
        },
      ],
    });

    assert.equal(joined.rows[0]?.shareActions, 0);
  });

  it("shows unavailable share actions instead of zero when report failed", () => {
    const joined = joinRecentContentPerformance({
      cmsAvailable: true,
      pagePathMetrics: { "/articles/a": { views: 4, userEngagementDuration: 40 } },
      shareActionsByPath: {},
      sharePerContentStatus: "unavailable",
      cmsItems: [
        {
          id: "1",
          title: "Article",
          slug: "a",
          contentType: "article",
          publishedAt: "2026-03-01T00:00:00.000Z",
          publicPath: "/articles/a",
        },
      ],
    });

    assert.equal(joined.rows[0]?.views, 4);
    assert.equal(joined.rows[0]?.shareActions, null);
    assert.match(joined.sharePerContentNotice ?? "", /unavailable/i);
  });

  it("ignores GA share rows with no CMS match", () => {
    const shareActionsByPath = normalizeShareEventsByPagePathReport([
      {
        dimensionValues: [{ value: "/articles/orphan" }],
        metricValues: [{ value: "9" }],
      },
    ]);

    assert.equal(shareActionsByPath["/articles/orphan"], 9);
    assert.equal(Object.keys(shareActionsByPath).length, 1);
  });
});

describe("Phase 2/3 regression and request budget", () => {
  it("still builds Phase 2 dashboard sections with recent content placeholder", () => {
    const data = buildAdminAnalyticsDashboardData(
      {
        dailyViews30d: { rows: [{ dimensionValues: [{ value: "20260101" }], metricValues: [{ value: "1" }] }] },
        activeUsers7d: { rows: [{ metricValues: [{ value: "1" }] }] },
        averageSessionDuration30d: { rows: [] },
        topContent30d: { rows: [] },
        trafficSources30d: { rows: [] },
        devices30d: { rows: [] },
        countries30d: { rows: [] },
        shareEventsTotal30d: { rows: [{ metricValues: [{ value: "2" }] }] },
        shareEventsByMethod30d: { rows: [] },
        pagePathPerformance30d: { rows: [] },
      },
      { shareMethodBreakdownStatus: "available" },
    );

    assert.equal(data.kpis.viewsLast30Days, 1);
    assert.equal(data.shareEngagement.totalActions, 2);
    assert.equal(data.recentContentPerformance.rows.length, 0);
  });

  it("documents bounded GA and Supabase query counts", () => {
    assert.equal(GA4_ADMIN_BATCH_REPORT_COUNT, 9);
    assert.equal(GA4_ADMIN_MAX_REPORT_COUNT, 11);
    assert.equal(GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT, 3);
    assert.equal(GA4_ADMIN_RECENT_CONTENT_SUPABASE_QUERY_COUNT, 3);
  });
});
