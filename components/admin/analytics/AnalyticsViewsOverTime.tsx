import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import {
  formatChartDayLabel,
  formatCompactInteger,
} from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsDailyViews } from "@/lib/analytics/ga4-types";

interface AnalyticsViewsOverTimeProps {
  daily: AdminAnalyticsDailyViews[];
}

export function AnalyticsViewsOverTime({ daily }: AnalyticsViewsOverTimeProps) {
  const maxViews = daily.reduce((max, row) => Math.max(max, row.views), 0);

  return (
    <AnalyticsSectionPanel
      title="Views Over Time"
      description="Daily page views for consented public traffic (last 30 days)."
    >
      {daily.length === 0 ? (
        <p className="text-sm text-hcx-text-secondary">
          No page view data for this period.
        </p>
      ) : (
        <div>
          <div
            className="flex h-44 items-end gap-0.5 sm:gap-1"
            role="img"
            aria-label="Bar chart of daily page views for the last 30 days"
          >
            {daily.map((row) => {
              const heightPercent =
                maxViews > 0 ? Math.max(4, (row.views / maxViews) * 100) : 4;

              return (
                <div
                  key={row.date}
                  className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t bg-hcx-cyan/70 transition-colors group-hover:bg-hcx-cyan"
                    style={{ height: `${heightPercent}%` }}
                    title={`${row.date}: ${formatCompactInteger(row.views)} views`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-hcx-text-secondary sm:text-xs">
            <span>{formatChartDayLabel(daily[0]?.date ?? "")}</span>
            <span>
              {formatChartDayLabel(daily[Math.floor(daily.length / 2)]?.date ?? "")}
            </span>
            <span>{formatChartDayLabel(daily[daily.length - 1]?.date ?? "")}</span>
          </div>
          <p className="sr-only">
            Daily views from {daily[0]?.date} to {daily[daily.length - 1]?.date}.
          </p>
        </div>
      )}
    </AnalyticsSectionPanel>
  );
}
