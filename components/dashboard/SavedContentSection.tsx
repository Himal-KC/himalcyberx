import Link from "next/link";
import { contentTypeLabel } from "@/lib/dashboard/dashboard-core";
import {
  LEARNER_DASHBOARD_SAVED_PATH,
} from "@/lib/auth/constants";
import type { DashboardSavedItem } from "@/lib/dashboard/types";
import { focusRing } from "@/lib/page-data";

type SavedContentSectionProps = {
  items: DashboardSavedItem[];
  showViewAll?: boolean;
};

export function SavedContentSection({
  items,
  showViewAll = true,
}: SavedContentSectionProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-bg/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-hcx-text">Saved Content</h2>
        {showViewAll && items.length > 0 ? (
          <Link
            href={LEARNER_DASHBOARD_SAVED_PATH}
            className={`text-sm font-semibold text-hcx-cyan hover:underline ${focusRing}`}
          >
            View all saved content
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          You haven&apos;t saved anything yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-hcx-border/80 bg-hcx-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-hcx-text-secondary">
                  <span className="font-semibold uppercase tracking-wide text-hcx-cyan">
                    {contentTypeLabel(item.contentType)}
                  </span>
                  {item.category ? <span>{item.category}</span> : null}
                  {item.difficulty ? <span>{item.difficulty}</span> : null}
                </div>
                <p className="mt-1 font-semibold text-hcx-text">{item.title}</p>
              </div>
              <Link
                href={item.href}
                className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:border-hcx-cyan/40 hover:text-hcx-cyan ${focusRing}`}
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
