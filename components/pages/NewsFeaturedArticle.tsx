import Link from "next/link";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ArrowRightIcon } from "@/components/icons";
import { articlePath } from "@/lib/articles";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";

interface NewsFeaturedArticleProps {
  article: PublicArticleCard;
}

export function NewsFeaturedArticle({ article }: NewsFeaturedArticleProps) {
  return (
    <section aria-labelledby="featured-news-heading">
      <h2
        id="featured-news-heading"
        className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
      >
        Featured Article
      </h2>
      <article className="group mt-5 overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-colors hover:border-hcx-cyan/25">
        <div className="grid lg:grid-cols-2">
          <Link
            href={articlePath(article.slug)}
            className={`relative block ${focusRing}`}
          >
            <ArticleFeaturedVisual
              featured_image={article.featured_image}
              pattern={article.pattern ?? "featured"}
              title={article.title}
              className="h-56 lg:h-full lg:min-h-[20rem]"
            />
            <div className="absolute left-5 top-5 flex gap-2">
              <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                {article.category}
              </span>
            </div>
          </Link>

          <div className="flex flex-col p-6 md:p-8">
            <h3 className="text-2xl font-bold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan md:text-3xl">
              <Link href={articlePath(article.slug)} className={focusRing}>
                {article.title}
              </Link>
            </h3>
            <p className="mt-4 flex-1 leading-relaxed text-hcx-text-secondary">
              {article.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                <time dateTime={article.publishedAtIso}>
                  {article.publishedAtFormatted}
                </time>
                <span aria-hidden="true">•</span>
                <span>{article.readTime}</span>
              </div>
              <Link
                href={articlePath(article.slug)}
                className={`inline-flex items-center gap-2 text-sm font-semibold text-hcx-cyan transition-colors hover:text-hcx-cyan/90 ${focusRing}`}
              >
                Read Article
                <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
