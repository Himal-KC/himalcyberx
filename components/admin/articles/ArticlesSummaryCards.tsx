import type { ArticleSummaryCounts } from "@/lib/supabase/admin-articles";

const cards = [
  { key: "published", label: "Published", accent: "text-hcx-green" },
  { key: "draft", label: "Draft", accent: "text-hcx-orange" },
  { key: "archived", label: "Archived", accent: "text-hcx-text-secondary" },
  { key: "total", label: "Total", accent: "text-hcx-cyan" },
] as const;

export function ArticlesSummaryCards({
  counts,
}: {
  counts: ArticleSummaryCounts;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-hcx-border bg-hcx-card p-5"
        >
          <p className="text-sm text-hcx-text-secondary">{card.label}</p>
          <p className={`mt-2 font-mono text-3xl font-semibold ${card.accent}`}>
            {counts[card.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
