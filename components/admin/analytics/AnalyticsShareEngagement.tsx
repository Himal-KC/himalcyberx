import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import { formatCompactInteger } from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsShareEngagement } from "@/lib/analytics/ga4-types";

interface AnalyticsShareEngagementProps {
  shareEngagement: AdminAnalyticsShareEngagement;
}

export function AnalyticsShareEngagement({
  shareEngagement,
}: AnalyticsShareEngagementProps) {
  const { totalActions, methods, methodBreakdownStatus, methodBreakdownNotice } =
    shareEngagement;

  return (
    <AnalyticsSectionPanel
      title="Share Engagement"
      description="Share-button actions on public HCX content (last 30 days). These are on-site button clicks, not confirmed posts on external platforms."
    >
      <div className="space-y-4">
        <div>
          <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Total share actions
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-hcx-text">
            {formatCompactInteger(totalActions)}
          </p>
        </div>

        {totalActions === 0 ? (
          <p className="text-sm text-hcx-text-secondary">
            No share actions recorded in the selected period. This is expected
            immediately after deployment until visitors use share buttons with
            analytics consent granted.
          </p>
        ) : null}

        {methodBreakdownStatus === "available" && methods.length > 0 ? (
          <ul className="space-y-3 border-t border-hcx-border pt-4">
            {methods.map((row) => (
              <li
                key={row.method}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-hcx-text">{row.label}</span>
                <span className="font-mono text-hcx-text-secondary">
                  {formatCompactInteger(row.count)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {methodBreakdownNotice ? (
          <p className="text-xs leading-relaxed text-hcx-text-secondary">
            {methodBreakdownNotice}
          </p>
        ) : null}
      </div>
    </AnalyticsSectionPanel>
  );
}
