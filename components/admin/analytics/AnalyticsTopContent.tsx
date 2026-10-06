import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import {
  formatCompactInteger,
  formatDurationSeconds,
} from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsTopContentRow } from "@/lib/analytics/ga4-types";

interface AnalyticsTopContentProps {
  rows: AdminAnalyticsTopContentRow[];
}

export function AnalyticsTopContent({ rows }: AnalyticsTopContentProps) {
  return (
    <AnalyticsSectionPanel
      title="Top Content"
      description="Most viewed public pages (last 30 days). Admin paths are excluded."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-hcx-text-secondary">
          No content view data for this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hcx-border text-hcx-text-secondary">
                <th className="pb-2 pr-4 font-medium">Page</th>
                <th className="pb-2 pr-4 font-medium">Path</th>
                <th className="pb-2 pr-4 font-medium">Views</th>
                <th className="pb-2 font-medium">Avg. engagement / view</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hcx-border">
              {rows.map((row) => (
                <tr key={row.path}>
                  <td className="max-w-[12rem] truncate py-3 pr-4 text-hcx-text">
                    {row.title}
                  </td>
                  <td className="max-w-[10rem] truncate py-3 pr-4 font-mono text-xs text-hcx-text-secondary">
                    {row.path}
                  </td>
                  <td className="py-3 pr-4 font-mono text-hcx-text">
                    {formatCompactInteger(row.views)}
                  </td>
                  <td className="py-3 text-hcx-text-secondary">
                    {row.avgEngagementSecondsPerView === null
                      ? "—"
                      : formatDurationSeconds(row.avgEngagementSecondsPerView)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsSectionPanel>
  );
}
