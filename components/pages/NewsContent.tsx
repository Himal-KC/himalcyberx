"use client";

import Link from "next/link";
import { useState } from "react";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ArticleGridCard } from "@/components/pages/ArticleGridCard";
import { articlePath } from "@/lib/articles";
import type { NewsListItem } from "@/lib/news-content";
import { focusRing, newsCategories, type NewsCategory } from "@/lib/page-data";

interface NewsContentProps {
  articles: NewsListItem[];
}

export function NewsContent({ articles }: NewsContentProps) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("All");

  const featured = articles.find((article) => article.featured) ?? articles[0];
  const stories = articles.filter((article) => article.id !== featured?.id);
  const filtered =
    activeCategory === "All"
      ? stories
      : stories.filter((article) => article.category === activeCategory);

  if (!featured) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section aria-labelledby="featured-news-heading">
        <h2
          id="featured-news-heading"
          className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
        >
          Featured from HCX
        </h2>
        <article className="group mt-5 overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-colors hover:border-hcx-cyan/25">
          <div className="grid lg:grid-cols-2">
            <Link
              href={articlePath(featured.slug)}
              className={`relative block ${focusRing}`}
            >
              <ArticleFeaturedVisual
                featured_image={featured.featured_image}
                pattern={featured.pattern ?? "featured"}
                title={featured.headline}
                className="h-56 lg:h-full"
              />
              <div className="absolute left-5 top-5 flex gap-2">
                <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                  {featured.category}
                </span>
              </div>
            </Link>
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan md:text-3xl">
                <Link href={articlePath(featured.slug)} className={focusRing}>
                  {featured.headline}
                </Link>
              </h3>
              <p className="mt-4 leading-relaxed text-hcx-text-secondary">
                {featured.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-hcx-text-secondary">
                <span className="font-medium text-hcx-text/90">
                  {featured.author}
                </span>
                <span aria-hidden="true">•</span>
                <time dateTime={featured.dateIso}>{featured.date}</time>
                <span aria-hidden="true">•</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      {filtered.length > 0 && (
        <section className="mt-14" aria-labelledby="latest-stories-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="latest-stories-heading"
              className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
            >
              Latest from HCX
            </h2>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by category"
            >
              {newsCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
                    activeCategory === cat
                      ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
                      : "border-hcx-border bg-hcx-card text-hcx-text-secondary hover:border-hcx-cyan/25 hover:text-hcx-cyan"
                  }`}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <ArticleGridCard key={article.id} {...article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
