import type { DashboardStats } from "@/lib/dashboard/types";

type DashboardStatCardsProps = {
  stats: DashboardStats;
};

const cards: {
  key: keyof DashboardStats;
  label: string;
  hint: string;
}[] = [
  { key: "savedCount", label: "Saved Content", hint: "Bookmarks" },
  { key: "inProgressCount", label: "In Progress", hint: "Tutorials & labs" },
  { key: "completedCount", label: "Completed", hint: "Finished learning" },
];

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-hcx-border bg-hcx-bg/60 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hcx-text-secondary">
            {card.label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-hcx-text">
            {stats[card.key]}
          </p>
          <p className="mt-1 text-xs text-hcx-text-secondary">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
