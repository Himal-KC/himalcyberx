import Link from "next/link";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ArrowRightIcon } from "@/components/icons";
import type { HomepageFeaturedItem } from "@/lib/supabase/public-homepage";
import type { SearchContentType } from "@/lib/search";
import { getSearchTypeLabel, getTypeBadgeClass } from "@/lib/search";
import { formatCardExcerpt } from "@/lib/format-card-excerpt";
import { focusRing } from "@/lib/page-data";

function getFeaturedCtaLabel(type: SearchContentType): string {
  const labels: Record<SearchContentType, string> = {
    article: "Read Article",
    lab: "Start Lab",
    tutorial: "View Tutorial",
  };
  return labels[type];
}

function FeaturedBadges({ item }: { item: HomepageFeaturedItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${getTypeBadgeClass(item.type)}`}
      >
        {getSearchTypeLabel(item.type)}
      </span>
      <span className="rounded-md bg-hcx-bg/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
        {item.category}
      </span>
    </div>
  );
}

interface FeaturedContentPrimaryCardProps {
  item: HomepageFeaturedItem;
}

export function FeaturedContentPrimaryCard({
  item,
}: FeaturedContentPrimaryCardProps) {
  return (
    <article className="group h-full">
      <Link
        href={item.href}
        className={`flex h-full flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-colors duration-300 hover:border-hcx-cyan/25 ${focusRing}`}
      >
        <div className="relative overflow-hidden border-b border-hcx-border">
          <ArticleFeaturedVisual
            featured_image={item.featured_image}
            pattern={item.pattern}
            title={item.title}
            className="h-52 w-full sm:h-64 md:h-72 lg:h-80"
          />
          <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
            <FeaturedBadges item={item} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-8">
          <h3 className="text-2xl font-bold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan md:text-3xl">
            {item.title}
          </h3>
          <p className="mt-4 line-clamp-3 text-base leading-relaxed text-hcx-text-secondary md:text-[17px]">
            {formatCardExcerpt(item.description)}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {item.publishedAtFormatted ? (
              <p className="text-sm text-hcx-text-secondary">
                {item.publishedAtFormatted}
              </p>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-hcx-cyan transition-colors group-hover:text-hcx-cyan/90">
              {getFeaturedCtaLabel(item.type)}
              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

interface FeaturedContentSupportingCardProps {
  item: HomepageFeaturedItem;
}

export function FeaturedContentSupportingCard({
  item,
}: FeaturedContentSupportingCardProps) {
  return (
    <article className="group h-full">
      <Link
        href={item.href}
        className={`flex h-full gap-4 overflow-hidden rounded-xl border border-hcx-border bg-hcx-card/80 p-3 transition-colors duration-300 hover:border-hcx-cyan/20 hover:bg-hcx-card sm:p-4 ${focusRing}`}
      >
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg border border-hcx-border sm:w-28">
          <ArticleFeaturedVisual
            featured_image={item.featured_image}
            pattern={item.pattern}
            title={item.title}
            className="h-20 w-full sm:h-24"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <FeaturedBadges item={item} />
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-base">
            {item.title}
          </h3>
          {item.publishedAtFormatted ? (
            <p className="mt-2 text-xs text-hcx-text-secondary">
              {item.publishedAtFormatted}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
