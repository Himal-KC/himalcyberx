import type { AdminDashboardStats } from "@/lib/supabase/admin-queries";

const statCards: Array<{
  key: keyof AdminDashboardStats;
  label: string;
}> = [
  { key: "totalArticles", label: "Total Articles" },
  { key: "publishedArticles", label: "Published Articles" },
  { key: "labs", label: "Cyber Labs" },
  { key: "tutorials", label: "Tutorials" },
  { key: "subscribers", label: "Subscribers" },
  { key: "newMessages", label: "New Messages" },
];

interface DashboardStatsGridProps {
  stats: AdminDashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {statCards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-hcx-border bg-hcx-card p-5"
        >
          <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            {card.label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-hcx-text">
            {stats[card.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
