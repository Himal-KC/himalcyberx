import Link from "next/link";
import type { DashboardScheduledArticleItem } from "@/lib/supabase/admin-queries";
import { focusRing } from "@/lib/page-data";

interface DashboardScheduledContentProps {
  items: DashboardScheduledArticleItem[];
}

export function DashboardScheduledContent({
  items,
}: DashboardScheduledContentProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        Upcoming Scheduled Content
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          No scheduled articles.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hcx-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-hcx-text">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-hcx-text-secondary">
                  {item.publishedAtFormatted}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={item.previewHref}
                  className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
                >
                  Preview
                </Link>
                <Link
                  href={item.editHref}
                  className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
