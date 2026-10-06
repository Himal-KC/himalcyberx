import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import { formatDurationSeconds } from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsAverageEngagement } from "@/lib/analytics/ga4-types";

interface AnalyticsAverageEngagementProps {
  engagement: AdminAnalyticsAverageEngagement | null;
}

export function AnalyticsAverageEngagement({
  engagement,
}: AnalyticsAverageEngagementProps) {
  return (
    <AnalyticsSectionPanel
      title="Average Engagement Time"
      description="Site-wide session engagement from GA4 (consented traffic)."
    >
      {engagement === null ? (
        <p className="text-sm text-hcx-text-secondary">
          No engagement data for this period.
        </p>
      ) : (
        <div>
          <p className="font-mono text-4xl font-semibold text-hcx-text">
            {formatDurationSeconds(engagement.seconds)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary">
            {engagement.label}
          </p>
        </div>
      )}
    </AnalyticsSectionPanel>
  );
}
