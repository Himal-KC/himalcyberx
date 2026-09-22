import Link from "next/link";
import { formatArticleDate } from "@/lib/articles";
import { learningTypeLabel } from "@/lib/dashboard/dashboard-core";
import type { CompletedLearningItem } from "@/lib/learning/types";
import { focusRing } from "@/lib/page-data";

type CompletedLearningSectionProps = {
  items: CompletedLearningItem[];
};

export function CompletedLearningSection({ items }: CompletedLearningSectionProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-bg/40 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-hcx-text">Completed Learning</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          No completed tutorials or labs yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.progressId}
              className="flex flex-col gap-3 rounded-lg border border-hcx-border/80 bg-hcx-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-hcx-text-secondary">
                  <span className="font-semibold uppercase tracking-wide text-hcx-green">
                    {learningTypeLabel(item.contentType)}
                  </span>
                  {item.category ? <span>{item.category}</span> : null}
                </div>
                <p className="mt-1 font-semibold text-hcx-text">{item.title}</p>
                <p className="mt-1 text-xs text-hcx-green">
                  100% · Completed {formatArticleDate(item.completedAt)}
                </p>
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
