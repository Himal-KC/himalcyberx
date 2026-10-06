import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const { parseGa4ServiceAccountJson, resolveGa4AdminConfig, resolveGa4PropertyId } =
  (await import(
    pathToFileURL(join(testDir, "ga4-service-account-core.ts")).href
  )) as typeof import("./ga4-service-account-core");

const {
  buildAdminAnalyticsDashboardData,
  deriveKpisFromDailyViews,
  normalizeDailyViewsReport,
  normalizeTopContentReport,
} = (await import(
  pathToFileURL(join(testDir, "ga4-normalize-core.ts")).href
)) as typeof import("./ga4-normalize-core");

const { isExcludedAnalyticsPagePath, filterPublicContentPaths } = (await import(
  pathToFileURL(join(testDir, "ga4-path-core.ts")).href
)) as typeof import("./ga4-path-core");

const {
  formatCompactInteger,
  formatDurationSeconds,
  formatGa4DateDimension,
} = (await import(
  pathToFileURL(join(testDir, "ga4-format-core.ts")).href
)) as typeof import("./ga4-format-core");

const {
  GA4_ADMIN_BATCH_HTTP_REQUEST_COUNT,
  GA4_ADMIN_BATCH_REPORT_COUNT,
  GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT,
  GA4_ADMIN_MAX_REPORT_COUNT,
} = (await import(
  pathToFileURL(join(testDir, "ga4-reports-core.ts")).href
)) as typeof import("./ga4-reports-core");

const validServiceAccount = JSON.stringify({
  type: "service_account",
  project_id: "hcx-test",
  private_key_id: "key-id-123",
  private_key: "-----BEGIN PRIVATE KEY-----\\nSECRET\\n-----END PRIVATE KEY-----\\n",
  client_email: "analytics@hcx-test.iam.gserviceaccount.com",
  client_id: "123",
});

describe("GA4 admin configuration", () => {
  it("reports missing GA configuration", () => {
    const result = resolveGa4AdminConfig({
      propertyIdRaw: undefined,
      serviceAccountJsonRaw: undefined,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /property ID/i);
    }
  });

  it("rejects malformed service-account JSON", () => {
    const result = parseGa4ServiceAccountJson("{not-json");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /valid JSON/i);
    }
  });

  it("parses credentials without leaking secrets in errors", () => {
    const secretKey = "-----BEGIN PRIVATE KEY-----\\nULTRA-SECRET\\n-----END PRIVATE KEY-----\\n";
    const raw = JSON.stringify({
      type: "service_account",
      project_id: "hcx",
      private_key: secretKey,
      client_email: "svc@example.com",
    });

    const missingEmail = parseGa4ServiceAccountJson(
      JSON.stringify({
        type: "service_account",
        project_id: "hcx",
        private_key: secretKey,
      }),
    );
    assert.equal(missingEmail.ok, false);
    if (!missingEmail.ok) {
      assert.doesNotMatch(missingEmail.error, /ULTRA-SECRET/);
      assert.doesNotMatch(missingEmail.error, /BEGIN PRIVATE KEY/);
    }

    const ok = parseGa4ServiceAccountJson(raw);
    assert.equal(ok.ok, true);
  });

  it("normalizes property IDs with or without properties/ prefix", () => {
    assert.deepEqual(resolveGa4PropertyId("123456789"), {
      ok: true,
      propertyId: "123456789",
    });
    assert.deepEqual(resolveGa4PropertyId("properties/987654321"), {
      ok: true,
      propertyId: "987654321",
    });
  });

  it("accepts valid server configuration", () => {
    const result = resolveGa4AdminConfig({
      propertyIdRaw: "123456789",
      serviceAccountJsonRaw: validServiceAccount,
    });
    assert.equal(result.ok, true);
  });
});

describe("GA4 response normalization", () => {
  it("normalizes daily views and derives KPI windows", () => {
    const daily = normalizeDailyViewsReport({
      rows: [
        {
          dimensionValues: [{ value: "20260101" }],
          metricValues: [{ value: "10" }],
        },
        {
          dimensionValues: [{ value: "20260102" }],
          metricValues: [{ value: "5" }],
        },
      ],
    });

    assert.equal(daily[0]?.date, "2026-01-01");
    assert.deepEqual(deriveKpisFromDailyViews(daily), {
      viewsToday: 5,
      viewsLast7Days: 15,
      viewsLast30Days: 15,
    });
  });

  it("handles empty GA responses with zeros", () => {
    const data = buildAdminAnalyticsDashboardData(
      {
        dailyViews30d: { rows: [] },
        activeUsers7d: { rows: [] },
        averageSessionDuration30d: { rows: [] },
        topContent30d: { rows: [] },
        trafficSources30d: { rows: [] },
        devices30d: { rows: [] },
        countries30d: { rows: [] },
        shareEventsTotal30d: { rows: [] },
        shareEventsByMethod30d: { rows: [] },
      },
      { shareMethodBreakdownStatus: "available" },
    );

    assert.deepEqual(data.kpis, {
      viewsToday: 0,
      viewsLast7Days: 0,
      viewsLast30Days: 0,
      activeUsersLast7Days: 0,
    });
    assert.equal(data.viewsOverTime.length, 0);
    assert.equal(data.topContent.length, 0);
    assert.equal(data.shareEngagement.totalActions, 0);
  });

  it("excludes /admin paths from top content output", () => {
    const rows = normalizeTopContentReport({
      rows: [
        {
          dimensionValues: [{ value: "/articles/test" }, { value: "Article" }],
          metricValues: [{ value: "100" }, { value: "500" }],
        },
        {
          dimensionValues: [{ value: "/admin" }, { value: "Admin" }],
          metricValues: [{ value: "999" }, { value: "100" }],
        },
        {
          dimensionValues: [{ value: "/admin/settings" }, { value: "Settings" }],
          metricValues: [{ value: "50" }, { value: "10" }],
        },
      ],
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.path, "/articles/test");
    assert.equal(isExcludedAnalyticsPagePath("/admin/agent"), true);
    assert.equal(filterPublicContentPaths([{ path: "/news" }]).length, 1);
  });
});

describe("GA4 formatting", () => {
  it("formats numbers and durations for display", () => {
    assert.equal(formatGa4DateDimension("20260315"), "2026-03-15");
    assert.equal(formatCompactInteger(12045), "12,045");
    assert.equal(formatDurationSeconds(45), "45s");
    assert.equal(formatDurationSeconds(125), "2m 5s");
  });
});

describe("GA4 dashboard request budget", () => {
  it("keeps primary batches bounded and documents optional share method batch", () => {
    assert.equal(GA4_ADMIN_BATCH_REPORT_COUNT, 8);
    assert.equal(GA4_ADMIN_BATCH_HTTP_REQUEST_COUNT, 2);
    assert.equal(GA4_ADMIN_MAX_REPORT_COUNT, 9);
    assert.equal(GA4_ADMIN_MAX_BATCH_HTTP_REQUEST_COUNT, 3);
  });
});
