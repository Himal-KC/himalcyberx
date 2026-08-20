import { ArticleGridCard } from "@/components/pages/ArticleGridCard";
import { SectionHeading } from "@/components/SectionHeading";
import { mapPublicArticleToGridCard } from "@/lib/news-content";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";

interface ThreatAnalysisSectionProps {
  articles: PublicArticleCard[];
}

export function ThreatAnalysisSection({ articles }: ThreatAnalysisSectionProps) {
  return (
    <section
      className="border-b border-hcx-border py-12 md:py-16"
      aria-labelledby="latest-threat-analysis-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Latest Coverage"
          title="Latest Threat Analysis"
          description="Published research and reporting on active cyber threats from HimalCyberX."
        />

        {articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const card = mapPublicArticleToGridCard(article);
              return <ArticleGridCard key={article.id} {...card} />;
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No threat analysis has been published yet.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-hcx-text-secondary">
              HimalCyberX threat intelligence articles will appear here as new
              research is published.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
