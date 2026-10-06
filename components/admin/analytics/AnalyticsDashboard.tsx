import { AnalyticsAverageEngagement } from "@/components/admin/analytics/AnalyticsAverageEngagement";
import { AnalyticsBreakdown } from "@/components/admin/analytics/AnalyticsBreakdown";
import { AnalyticsKpiGrid } from "@/components/admin/analytics/AnalyticsKpiGrid";
import { AnalyticsPendingSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import { AnalyticsTopContent } from "@/components/admin/analytics/AnalyticsTopContent";
import { AnalyticsUnavailableBanner } from "@/components/admin/analytics/AnalyticsUnavailableBanner";
import { AnalyticsViewsOverTime } from "@/components/admin/analytics/AnalyticsViewsOverTime";
import {
  ANALYTICS_CONSENT_NOTICE,
  ANALYTICS_RECENT_CONTENT_PENDING,
  ANALYTICS_SHARE_EVENTS_PENDING,
} from "@/lib/analytics/admin-dashboard-constants";
import type { AdminAnalyticsLoadResult } from "@/lib/analytics/ga4-types";

interface AnalyticsDashboardProps {
  result: AdminAnalyticsLoadResult;
}

function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AnalyticsDashboard({ result }: AnalyticsDashboardProps) {
  const unavailable = result.status === "unavailable";

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Analytics
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          HCX ANALYTICS DASHBOARD
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          Public site usage from Google Analytics 4. Admin and agent workflows are
          not included in these metrics.
        </p>
      </header>

      <p
        className="rounded-lg border border-hcx-cyan/20 bg-hcx-cyan/5 px-4 py-3 text-sm text-hcx-text-secondary"
        role="note"
      >
        {ANALYTICS_CONSENT_NOTICE}
      </p>

      {unavailable ? (
        <AnalyticsUnavailableBanner message={result.message} />
      ) : (
        <p className="text-xs text-hcx-text-secondary">
          Last refreshed {formatFetchedAt(result.fetchedAt)} (cached up to{" "}
          {Math.round(result.cacheMaxAgeSeconds / 60)} minutes).
        </p>
      )}

      {unavailable ? null : (
        <>
          <AnalyticsKpiGrid kpis={result.data.kpis} />
          <AnalyticsViewsOverTime daily={result.data.viewsOverTime} />

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTopContent rows={result.data.topContent} />
            <AnalyticsAverageEngagement
              engagement={result.data.averageEngagement}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsBreakdown
              title="Traffic Sources"
              description="Default channel grouping (last 30 days)."
              rows={result.data.trafficSources}
              valueLabel="sessions"
              emptyMessage="No traffic source data for this period."
            />
            <AnalyticsBreakdown
              title="Device Breakdown"
              description="Sessions by device category (last 30 days)."
              rows={result.data.devices}
              valueLabel="sessions"
              emptyMessage="No device data for this period."
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsBreakdown
              title="Country Breakdown"
              description="Active users by country (last 30 days, aggregated)."
              rows={result.data.countries}
              valueLabel="users"
              emptyMessage="No country data for this period."
            />
            <AnalyticsPendingSectionPanel
              title="Share Engagement"
              description="LinkedIn, X and copy-link actions on articles."
              pendingMessage={ANALYTICS_SHARE_EVENTS_PENDING}
            />
          </div>

          <AnalyticsPendingSectionPanel
            title="Recent Content Performance"
            description="Recently published content compared to baseline traffic."
            pendingMessage={ANALYTICS_RECENT_CONTENT_PENDING}
          />
        </>
      )}
    </div>
  );
}
