import Link from "next/link";
import { ArticleGridCard } from "@/components/pages/ArticleGridCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRightIcon } from "@/components/icons";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";

interface LatestArticlesSectionProps {
  articles: PublicArticleCard[];
}

export function LatestArticlesSection({ articles }: LatestArticlesSectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      id="latest-news"
      className="border-b border-hcx-border bg-hcx-bg-secondary py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Research & News"
          title="Latest Articles"
          description="Recent cybersecurity analysis, threat reporting and practical security guidance."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {articles.map((article) => (
            <ArticleGridCard
              key={article.id}
              slug={article.slug}
              category={article.category}
              headline={article.title}
              description={article.excerpt}
              author={article.author}
              date={article.publishedAtFormatted}
              dateIso={article.publishedAtIso}
              readTime={article.readTime}
              pattern={article.pattern ?? "network"}
              featured_image={article.featured_image}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:justify-start">
          <Link
            href="/news"
            className={`group inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-6 py-3 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-bg hover:text-hcx-cyan ${focusRing}`}
          >
            View All Articles
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
