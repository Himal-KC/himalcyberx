import Link from "next/link";
import type { ArticleLabel } from "@/lib/articles";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ContentLabelBadge } from "@/components/ContentLabelBadge";
import { articlePath } from "@/lib/articles";
import { focusRing } from "@/lib/page-data";

interface ArticleGridCardProps {
  slug: string;
  category: string;
  headline: string;
  description: string;
  author: string;
  date: string;
  dateIso: string;
  readTime: string;
  label?: ArticleLabel;
  pattern?: "network" | "grid" | "circuit" | "featured";
  featured_image?: string | null;
  featured_image_alt?: string | null;
}

export function ArticleGridCard({
  slug,
  category,
  headline,
  description,
  author,
  date,
  readTime,
  label,
  dateIso,
  pattern = "network",
  featured_image = null,
  featured_image_alt = null,
}: ArticleGridCardProps) {
  const href = articlePath(slug);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/25">
      <Link href={href} className={`relative block ${focusRing}`}>
        <ArticleFeaturedVisual
          featured_image={featured_image}
          pattern={pattern}
          title={headline}
          imageAlt={featured_image_alt}
          className="h-40"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
            {category}
          </span>
          {label && <ContentLabelBadge label={label} />}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
          <Link href={href} className={focusRing}>
            {headline}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
          {description}
        </p>
        <div className="mt-4 border-t border-hcx-border pt-4">
          <p className="text-sm font-medium text-hcx-text/90">{author}</p>
          <div className="mt-2 flex items-center gap-3 text-sm text-hcx-text-secondary">
            <time dateTime={dateIso}>{date}</time>
            <span aria-hidden="true">•</span>
            <span>{readTime}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
