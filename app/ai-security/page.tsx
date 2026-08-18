import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { aiSecuritySections } from "@/lib/page-data";
import { articlePath } from "@/lib/articles";
import { mapPublicArticleToGridCard } from "@/lib/news-content";
import {
  getArticlesByCategory,
  getPublishedArticles,
} from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Security",
  description:
    "Educational research and guidance on artificial intelligence, cyber threats and defensive security.",
  path: "/ai-security",
});

export const revalidate = 60;

interface ContentSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function ContentSection({ id, title, children }: ContentSectionProps) {
  return (
    <section className="mb-14 last:mb-0" aria-labelledby={id}>
      <h2
        id={id}
        className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
      >
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AISecurityPage() {
  const [aiArticles, allPublished] = await Promise.all([
    getArticlesByCategory("ai-security"),
    getPublishedArticles(),
  ]);

  const dbArticles =
    aiArticles.length > 0
      ? aiArticles
      : allPublished.filter(
          (article) =>
            article.categoryHref === "/ai-security" ||
            article.category.toLowerCase().includes("ai security"),
        );

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "AI Security" }]} />
      <PageHero
        label="HCX Research"
        title="AI + Cybersecurity"
        description="Educational research and guidance on artificial intelligence, cyber threats and defensive security."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {dbArticles.length > 0 && (
          <ContentSection id="ai-security-articles" title="Latest AI Security Coverage">
            <div className="grid gap-4 sm:grid-cols-2">
              {dbArticles.map((item) => {
                const card = mapPublicArticleToGridCard(item);
                return (
                  <article
                    key={item.id}
                    className="group rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25 sm:p-6"
                  >
                    <h3 className="text-lg font-semibold text-hcx-text transition-colors group-hover:text-hcx-cyan">
                      <Link href={articlePath(card.slug)} className={focusRing}>
                        {card.headline}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                      {card.description}
                    </p>
                    <p className="mt-4 text-sm text-hcx-text-secondary">
                      {card.date} • {card.readTime}
                    </p>
                  </article>
                );
              })}
            </div>
          </ContentSection>
        )}

        <ContentSection id="llm-security" title="LLM Security">
          <div className="grid gap-4 sm:grid-cols-2">
            {aiSecuritySections.llm.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-hcx-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection
          id="ai-social-engineering"
          title="AI-Powered Social Engineering"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {aiSecuritySections.threats.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-hcx-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection id="defensive-ai" title="Defensive AI">
          <div className="grid gap-4 sm:grid-cols-2">
            {aiSecuritySections.defensive.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-hcx-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection id="deepfake-risk" title="Deepfake Risk">
          <div className="grid gap-4 sm:grid-cols-2">
            {aiSecuritySections.deepfakes.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-hcx-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection id="prompt-injection" title="Prompt Injection">
          <article className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-hcx-text">
              Defending Applications Against Prompt Injection
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
              Input validation, output filtering and architectural controls for
              LLM-integrated applications in enterprise environments.
            </p>
          </article>
        </ContentSection>

        <ContentSection id="ai-governance" title="AI Governance">
          <div className="grid gap-4 sm:grid-cols-2">
            {aiSecuritySections.governance.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-hcx-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </ContentSection>
      </div>
    </PageShell>
  );
}
