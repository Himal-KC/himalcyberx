import type { AdminAnalyticsKpis } from "@/lib/analytics/ga4-types";
import { formatCompactInteger } from "@/lib/analytics/ga4-format-core";

const kpiCards: Array<{ key: keyof AdminAnalyticsKpis; label: string }> = [
  { key: "viewsToday", label: "Views Today" },
  { key: "viewsLast7Days", label: "Views — Last 7 Days" },
  { key: "viewsLast30Days", label: "Views — Last 30 Days" },
  { key: "activeUsersLast7Days", label: "Active Users — Last 7 Days" },
];

interface AnalyticsKpiGridProps {
  kpis: AdminAnalyticsKpis;
}

export function AnalyticsKpiGrid({ kpis }: AnalyticsKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-hcx-border bg-hcx-card p-5"
        >
          <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            {card.label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-hcx-text">
            {formatCompactInteger(kpis[card.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
