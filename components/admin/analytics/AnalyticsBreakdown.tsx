import { AnalyticsSectionPanel } from "@/components/admin/analytics/AnalyticsSectionPanel";
import { formatCompactInteger } from "@/lib/analytics/ga4-format-core";
import type { AdminAnalyticsBreakdownRow } from "@/lib/analytics/ga4-types";

interface AnalyticsBreakdownProps {
  title: string;
  description: string;
  rows: AdminAnalyticsBreakdownRow[];
  valueLabel: string;
  emptyMessage: string;
}

export function AnalyticsBreakdown({
  title,
  description,
  rows,
  valueLabel,
  emptyMessage,
}: AnalyticsBreakdownProps) {
  const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0);

  return (
    <AnalyticsSectionPanel title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-hcx-text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const widthPercent =
              maxValue > 0 ? Math.max(4, (row.value / maxValue) * 100) : 4;

            return (
              <li key={`${title}-${row.name}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-hcx-text">{row.name}</span>
                  <span className="shrink-0 font-mono text-hcx-text-secondary">
                    {formatCompactInteger(row.value)}{" "}
                    <span className="text-xs">{valueLabel}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-hcx-bg-secondary">
                  <div
                    className="h-2 rounded-full bg-hcx-cyan/80"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsSectionPanel>
  );
}
