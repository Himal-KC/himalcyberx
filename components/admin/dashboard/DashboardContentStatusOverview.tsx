import type { ArticleStatusOverview } from "@/lib/supabase/admin-queries";

interface DashboardContentStatusOverviewProps {
  overview: ArticleStatusOverview;
}

const items: Array<{
  key: keyof ArticleStatusOverview;
  label: string;
  className: string;
}> = [
  {
    key: "published",
    label: "Published",
    className: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  },
  {
    key: "draft",
    label: "Draft",
    className: "border-hcx-orange/30 bg-hcx-orange/10 text-hcx-orange",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    className: "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
  },
];

export function DashboardContentStatusOverview({
  overview,
}: DashboardContentStatusOverviewProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        Article Status Overview
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-lg border px-4 py-3 ${item.className}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">
              {item.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold">
              {overview[item.key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
