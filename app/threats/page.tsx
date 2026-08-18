import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ThreatIntelligence } from "@/components/ThreatIntelligence";
import { articlePath } from "@/lib/articles";
import { mapPublicArticleToGridCard } from "@/lib/news-content";
import {
  buildThreatResearchList,
  buildThreatSections,
} from "@/lib/threats-content";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";
import { ArrowRightIcon } from "@/components/icons";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Threat Intelligence",
  description:
    "Research and analysis of emerging cyber threats, adversaries and attack techniques.",
  path: "/threats",
});

export const revalidate = 60;

export default async function ThreatsPage() {
  const publishedArticles = await getPublishedArticles();
  const threatArticles = buildThreatResearchList(publishedArticles);
  const threatSections = buildThreatSections(publishedArticles);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Threats" }]} />
      <PageHero
        label="HCX Intelligence"
        title="Threat Intelligence"
        description="Research and analysis of emerging cyber threats, adversaries and attack techniques based on publicly available security information."
      />

      <section className="border-b border-hcx-border bg-hcx-bg">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Threat Overview
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
            HimalCyberX threat intelligence covers ransomware, malware, phishing
            and advanced persistent threat research. Analysis is based on public
            advisories, vendor reporting and defensive security guidance.
          </p>
        </div>
      </section>

      <ThreatIntelligence embedded articles={threatArticles.slice(0, 4)} />

      {threatSections.some((section) => section.articles.length > 0) && (
        <section className="border-b border-hcx-border py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold uppercase tracking-[0.06em] text-hcx-text">
              Threat Research by Category
            </h2>

            <div className="mt-10 space-y-12">
              {threatSections.map((section) => {
                if (section.articles.length === 0) {
                  return null;
                }

                return (
                  <div key={section.slug}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
                      {section.title}
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {section.articles.map((item) => {
                        const card = mapPublicArticleToGridCard(item);
                        return (
                          <article
                            key={item.id}
                            className="group rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25 sm:p-6"
                          >
                            <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                              {card.category}
                            </span>
                            <h4 className="mt-2 text-base font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-lg">
                              <Link
                                href={articlePath(card.slug)}
                                className={focusRing}
                              >
                                {card.headline}
                              </Link>
                            </h4>
                            <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary">
                              {card.description}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                              <span className="font-medium text-hcx-text/90">
                                {card.author}
                              </span>
                              <span aria-hidden="true">•</span>
                              <time dateTime={card.dateIso}>{card.date}</time>
                              <span aria-hidden="true">•</span>
                              <span>{card.readTime}</span>
                            </div>
                            <Link
                              href={articlePath(card.slug)}
                              className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan ${focusRing}`}
                            >
                              Read analysis
                              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
