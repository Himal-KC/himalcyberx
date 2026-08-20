import Link from "next/link";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import type { RelatedContentItem } from "@/lib/supabase/public-related-content";
import { getSearchTypeLabel, getTypeBadgeClass } from "@/lib/search";
import { focusRing } from "@/lib/page-data";

interface RelatedContentCardProps {
  item: RelatedContentItem;
}

export function RelatedContentCard({ item }: RelatedContentCardProps) {
  return (
    <article className="group h-full">
      <Link
        href={item.href}
        className={`flex h-full flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-colors hover:border-hcx-cyan/25 hover:bg-hcx-bg-secondary/40 ${focusRing}`}
      >
        <div className="overflow-hidden border-b border-hcx-border">
          <ArticleFeaturedVisual
            featured_image={item.featured_image}
            pattern={item.pattern}
            title={item.title}
            className="h-40 w-full sm:h-44"
          />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTypeBadgeClass(item.type)}`}
            >
              {getSearchTypeLabel(item.type)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
              {item.category}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-lg">
            {item.title}
          </h3>

          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
            {item.description || "No description available."}
          </p>

          {item.publishedAtFormatted ? (
            <p className="mt-4 text-xs text-hcx-text-secondary">
              {item.publishedAtFormatted}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
