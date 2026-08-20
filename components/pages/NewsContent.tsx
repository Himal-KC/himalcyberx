import Link from "next/link";
import { ArticleGridCard } from "@/components/pages/ArticleGridCard";
import { NewsFeaturedArticle } from "@/components/pages/NewsFeaturedArticle";
import { NewsListFilters } from "@/components/pages/NewsListFilters";
import { mapPublicArticleToGridCard } from "@/lib/news-content";
import type {
  NewsCategoryOption,
  NewsListFilters as NewsListFiltersState,
} from "@/lib/news-list";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";

interface NewsContentProps {
  featured: PublicArticleCard | null;
  articles: PublicArticleCard[];
  categories: NewsCategoryOption[];
  filters: NewsListFiltersState;
  filtersActive: boolean;
  totalPublished: number;
}

export function NewsContent({
  featured,
  articles,
  categories,
  filters,
  filtersActive,
  totalPublished,
}: NewsContentProps) {
  if (totalPublished === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-hcx-text">
            Articles coming soon
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-hcx-text-secondary">
            HimalCyberX is preparing cybersecurity news and research coverage.
            Check back soon for published articles.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {featured ? <NewsFeaturedArticle article={featured} /> : null}

      <section
        className={featured ? "mt-14" : undefined}
        aria-labelledby="news-articles-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="news-articles-heading"
            className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
          >
            {filtersActive ? "Matching Articles" : "All Articles"}
          </h2>
        </div>

        <div className="mt-6">
          <NewsListFilters filters={filters} categories={categories} />
        </div>

        {articles.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const card = mapPublicArticleToGridCard(article);
              return <ArticleGridCard key={article.id} {...card} />;
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-14 text-center">
            <p className="text-base font-medium text-hcx-text">
              No matching articles found.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hcx-text-secondary">
              Try adjusting your search or filters to find published HimalCyberX
              articles.
            </p>
            {filtersActive ? (
              <Link
                href="/news"
                className={`mt-6 inline-flex rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Reset Filters
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
