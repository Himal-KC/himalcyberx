import Link from "next/link";
import type { AdminDashboardStats } from "@/lib/supabase/admin-queries";
import { focusRing } from "@/lib/page-data";

const statCards: Array<{
  key: keyof AdminDashboardStats;
  label: string;
  href: string;
}> = [
  { key: "totalArticles", label: "Total Articles", href: "/admin/articles" },
  {
    key: "publishedArticles",
    label: "Published Articles",
    href: "/admin/articles?status=published",
  },
  {
    key: "draftArticles",
    label: "Draft Articles",
    href: "/admin/articles?status=draft",
  },
  {
    key: "scheduledArticles",
    label: "Scheduled Articles",
    href: "/admin/articles?status=scheduled",
  },
  { key: "labs", label: "Cyber Labs", href: "/admin/labs" },
  { key: "tutorials", label: "Tutorials", href: "/admin/tutorials" },
  { key: "subscribers", label: "Subscribers", href: "/admin/subscribers" },
  { key: "newMessages", label: "New Messages", href: "/admin/messages" },
];

const statCardClassName = `block cursor-pointer rounded-xl border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/50 hover:bg-hcx-bg-secondary/40 ${focusRing}`;

interface DashboardStatsGridProps {
  stats: AdminDashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => (
        <Link key={card.key} href={card.href} className={statCardClassName}>
          <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            {card.label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-hcx-text">
            {stats[card.key]}
          </p>
        </Link>
      ))}
    </div>
  );
}
