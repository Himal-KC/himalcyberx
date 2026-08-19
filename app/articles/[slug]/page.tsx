import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { PlainTextArticleContent } from "@/components/articles/PlainTextArticleContent";
import { ArticleShare } from "@/components/articles/ArticleShare";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleMetadata, buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildArticleBreadcrumbStructuredData,
  buildArticleStructuredData,
} from "@/lib/seo/article-structured-data";
import { articlePath } from "@/lib/articles";
import {
  getArticleBySlug,
  getPublishedArticleSlugs,
  getRelatedArticles,
} from "@/lib/supabase/public-articles";
import { focusRing } from "@/lib/page-data";

export const revalidate = 60;
export const dynamicParams = true;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getPublishedArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return buildPageMetadata({
      title: "Article Not Found",
      description: "The requested article could not be found.",
      noIndex: true,
    });
  }

  return buildArticleMetadata({
    title: article.title,
    description: article.excerpt,
    path: articlePath(article.slug),
    imageUrl: article.featured_image,
    author: article.author,
    publishedTime: article.publishedAtIso,
    modifiedTime: article.updatedAtIso,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(
    article.slug,
    article.categorySlug,
    3,
  );

  return (
    <>
      <JsonLd data={buildArticleStructuredData(article)} />
      <JsonLd data={buildArticleBreadcrumbStructuredData(article)} />
      <PageShell>
      <Breadcrumb
        items={[
          { label: article.category, href: article.categoryHref },
          { label: article.title },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <article className="mx-auto max-w-3xl">
          <header>
            <Link
              href={article.categoryHref}
              className={`text-xs font-semibold uppercase tracking-wide text-hcx-cyan hover:underline ${focusRing}`}
            >
              {article.category}
            </Link>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-hcx-text sm:text-4xl lg:text-[2.5rem]">
              {article.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-hcx-text-secondary">
              {article.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-hcx-border pb-6 text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text/90">
                {article.author}
              </span>
              <span aria-hidden="true">•</span>
              <time dateTime={article.publishedAtIso}>
                {article.publishedAtFormatted}
              </time>
              <span aria-hidden="true">•</span>
              <span>{article.readTime}</span>
            </div>
          </header>

          <div className="mt-8 overflow-hidden rounded-xl border border-hcx-border">
            <ArticleFeaturedVisual
              featured_image={article.featured_image}
              pattern={article.pattern}
              title={article.title}
            />
          </div>

          <div className="mt-10">
            {article.content ? (
              <PlainTextArticleContent content={article.content} />
            ) : (
              <p className="text-base leading-relaxed text-hcx-text-secondary">
                Full article content is not available.
              </p>
            )}
          </div>

          <footer className="mt-12 border-t border-hcx-border pt-8">
            <ArticleShare title={article.title} slug={article.slug} />
          </footer>

          {related.length > 0 && (
            <section className="mt-12 border-t border-hcx-border pt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
                Related Coverage
              </h2>
              <ul className="mt-6 space-y-4">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={articlePath(item.slug)}
                      className={`group block rounded-lg border border-hcx-border bg-hcx-card p-4 transition-colors hover:border-hcx-cyan/25 ${focusRing}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                        {item.category}
                      </p>
                      <p className="mt-2 font-semibold text-hcx-text transition-colors group-hover:text-hcx-cyan">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-hcx-text-secondary">
                        {item.publishedAtFormatted} • {item.readTime}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </PageShell>
    </>
  );
}
