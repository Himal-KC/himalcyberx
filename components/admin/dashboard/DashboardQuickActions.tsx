import Link from "next/link";
import { focusRing } from "@/lib/page-data";

const actions = [
  { label: "+ New Article", href: "/admin/articles/new" },
  { label: "+ New Cyber Lab", href: "/admin/labs/new" },
  { label: "+ New Tutorial", href: "/admin/tutorials/new" },
] as const;

export function DashboardQuickActions() {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        Quick Actions
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex items-center justify-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
