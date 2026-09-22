import Link from "next/link";
import { formatArticleDate } from "@/lib/articles";
import { learningTypeLabel } from "@/lib/dashboard/dashboard-core";
import type { ContinueLearningItem } from "@/lib/learning/types";
import { focusRing } from "@/lib/page-data";

type ContinueLearningSectionProps = {
  items: ContinueLearningItem[];
};

export function ContinueLearningSection({ items }: ContinueLearningSectionProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-bg/40 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-hcx-text">Continue Learning</h2>

      {items.length === 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-hcx-text-secondary">
            No learning activity yet. Start a tutorial or lab.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tutorials"
              className={`rounded-md border border-hcx-border px-3 py-1.5 text-sm font-semibold text-hcx-cyan hover:border-hcx-cyan/40 ${focusRing}`}
            >
              Browse Tutorials
            </Link>
            <Link
              href="/cyber-lab"
              className={`rounded-md border border-hcx-border px-3 py-1.5 text-sm font-semibold text-hcx-cyan hover:border-hcx-cyan/40 ${focusRing}`}
            >
              Browse Cyber Lab
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.progressId}
              className="flex flex-col gap-3 rounded-lg border border-hcx-border/80 bg-hcx-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-hcx-text-secondary">
                  <span className="font-semibold uppercase tracking-wide text-hcx-cyan">
                    {learningTypeLabel(item.contentType)}
                  </span>
                  {item.category ? <span>{item.category}</span> : null}
                  {item.difficulty ? <span>{item.difficulty}</span> : null}
                </div>
                <p className="mt-1 font-semibold text-hcx-text">{item.title}</p>
                <p className="mt-1 text-xs text-hcx-text-secondary">
                  {item.progressPercent}% · Last activity{" "}
                  {formatArticleDate(item.lastActivityAt)}
                </p>
              </div>
              <Link
                href={item.href}
                className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
              >
                Continue
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
