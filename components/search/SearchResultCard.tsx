import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import { getSearchTypeLabel, getTypeBadgeClass } from "@/lib/search";
import { focusRing } from "@/lib/page-data";
import { ArrowRightIcon } from "@/components/icons";

interface SearchResultCardProps {
  item: SearchResult;
  compact?: boolean;
}

export function SearchResultCard({ item, compact = false }: SearchResultCardProps) {
  return (
    <article className="group">
      <Link
        href={item.href}
        className={`block rounded-lg border border-hcx-border bg-hcx-card transition-colors hover:border-hcx-cyan/25 hover:bg-hcx-bg-secondary/40 ${focusRing} ${
          compact ? "p-4" : "p-5 sm:p-6"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTypeBadgeClass(item.type)}`}
          >
            {getSearchTypeLabel(item.type)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            {item.category}
          </span>
          {item.difficulty && (
            <span className="text-xs text-hcx-text-secondary">
              {item.difficulty}
            </span>
          )}
        </div>

        <h3
          className={`font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan ${
            compact ? "mt-2 text-base" : "mt-3 text-lg"
          }`}
        >
          {item.title}
        </h3>

        <p
          className={`line-clamp-2 leading-relaxed text-hcx-text-secondary ${
            compact ? "mt-1.5 text-xs" : "mt-2 text-sm"
          }`}
        >
          {item.description}
        </p>

        {item.publishedAtFormatted && (
          <p className="mt-2 text-xs text-hcx-text-secondary">
            {item.publishedAtFormatted}
          </p>
        )}

        {!compact && (
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-hcx-cyan">
            Open Result
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </Link>
    </article>
  );
}
