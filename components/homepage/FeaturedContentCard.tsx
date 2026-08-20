import Link from "next/link";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import type { HomepageFeaturedItem } from "@/lib/supabase/public-homepage";
import { getSearchTypeLabel, getTypeBadgeClass } from "@/lib/search";
import { focusRing } from "@/lib/page-data";

interface FeaturedContentCardProps {
  item: HomepageFeaturedItem;
}

export function FeaturedContentCard({ item }: FeaturedContentCardProps) {
  return (
    <article className="group h-full">
      <Link
        href={item.href}
        className={`flex h-full flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/25 hover:shadow-[0_12px_40px_rgba(0,217,255,0.07)] ${focusRing}`}
      >
        <div className="relative overflow-hidden border-b border-hcx-border">
          <ArticleFeaturedVisual
            featured_image={item.featured_image}
            pattern={item.pattern}
            title={item.title}
            className="h-44 w-full sm:h-48"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${getTypeBadgeClass(item.type)}`}
            >
              {getSearchTypeLabel(item.type)}
            </span>
            <span className="rounded-md bg-hcx-bg/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
              {item.category}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
            {item.title}
          </h3>
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
            {item.description}
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
