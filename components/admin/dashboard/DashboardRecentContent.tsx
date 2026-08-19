import Link from "next/link";
import { ArticleStatusBadge } from "@/components/admin/articles/ArticleStatusBadge";
import { LabStatusBadge } from "@/components/admin/labs/LabStatusBadge";
import { TutorialStatusBadge } from "@/components/admin/tutorials/TutorialStatusBadge";
import type { DashboardRecentContentItem } from "@/lib/supabase/admin-queries";
import { focusRing } from "@/lib/page-data";

const typeLabels = {
  article: "ARTICLE",
  lab: "CYBER LAB",
  tutorial: "TUTORIAL",
} as const;

const typeBadgeStyles = {
  article: "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
  lab: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  tutorial: "border-hcx-yellow/30 bg-hcx-yellow/10 text-hcx-yellow",
} as const;

function ContentStatusBadge({
  item,
}: {
  item: DashboardRecentContentItem;
}) {
  if (item.type === "article") {
    return (
      <ArticleStatusBadge
        status={item.status}
        publishedAt={item.publishedAt}
      />
    );
  }

  if (item.type === "lab") {
    return <LabStatusBadge status={item.status} />;
  }

  return <TutorialStatusBadge status={item.status} />;
}

function ContentRowActions({ item }: { item: DashboardRecentContentItem }) {
  const previewHref = item.type === "article" ? item.previewHref : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {item.viewHref ? (
        <Link
          href={item.viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          View
        </Link>
      ) : null}
      {previewHref ? (
        <Link
          href={previewHref}
          className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          Preview
        </Link>
      ) : null}
      <Link
        href={item.editHref}
        className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
      >
        Edit
      </Link>
    </div>
  );
}

interface DashboardRecentContentProps {
  items: DashboardRecentContentItem[];
}

export function DashboardRecentContent({ items }: DashboardRecentContentProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        Recent Content
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">No recent content.</p>
      ) : (
        <ul className="mt-4 divide-y divide-hcx-border">
          {items.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeBadgeStyles[item.type]}`}
                  >
                    {typeLabels[item.type]}
                  </span>
                  <ContentStatusBadge item={item} />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-hcx-text">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-hcx-text-secondary">
                  {item.dateFormatted}
                </p>
              </div>

              <ContentRowActions item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
