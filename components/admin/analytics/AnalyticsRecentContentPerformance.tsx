import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import { formatCompactInteger } from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsRecentContentPerformance } from "@/lib/analytics/ga4-types";

interface AnalyticsRecentContentPerformanceProps {
  recentContent: AdminAnalyticsRecentContentPerformance;
}

export function AnalyticsRecentContentPerformance({
  recentContent,
}: AnalyticsRecentContentPerformanceProps) {
  const {
    periodDescription,
    status,
    rows,
    sharePerContentNotice,
    sharePerContentStatus,
  } = recentContent;

  return (
    <AnalyticsSectionPanel
      title="Recent Content Performance"
      description={periodDescription}
    >
      {status === "cms_unavailable" ? (
        <p className="text-sm text-hcx-text-secondary">
          Recently published content could not be loaded from the CMS. Other
          analytics sections are still available.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-hcx-text-secondary">
          No recently published articles, tutorials or labs were found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hcx-border text-hcx-text-secondary">
                <th className="pb-2 pr-4 font-medium">Content</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Published</th>
                <th className="pb-2 pr-4 font-medium">Views</th>
                <th className="pb-2 pr-4 font-medium">Avg. engagement / view</th>
                <th className="pb-2 font-medium">
                  Share actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hcx-border">
              {rows.map((row) => (
                <tr key={`${row.contentType}-${row.id}`}>
                  <td className="max-w-[14rem] truncate py-3 pr-4 text-hcx-text">
                    <span title={row.title}>{row.title}</span>
                  </td>
                  <td className="py-3 pr-4 text-hcx-text-secondary">
                    {row.contentTypeLabel}
                  </td>
                  <td
                    className="py-3 pr-4 text-hcx-text-secondary"
                    title={row.publishedAtFormatted}
                  >
                    {row.publishedRelative}
                  </td>
                  <td className="py-3 pr-4 font-mono text-hcx-text">
                    {formatCompactInteger(row.views)}
                  </td>
                  <td className="py-3 pr-4 text-hcx-text-secondary">
                    {row.avgEngagementFormatted}
                  </td>
                  <td className="py-3 font-mono text-hcx-text-secondary">
                    {sharePerContentStatus === "available" &&
                    row.shareActions !== null
                      ? formatCompactInteger(row.shareActions)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-hcx-text-secondary">
        Share actions count HCX share-button clicks on public content (last 30
        days), not confirmed posts on external platforms.
      </p>

      {sharePerContentNotice ? (
        <p className="mt-2 text-xs leading-relaxed text-hcx-text-secondary">
          {sharePerContentNotice}
        </p>
      ) : null}
    </AnalyticsSectionPanel>
  );
}
