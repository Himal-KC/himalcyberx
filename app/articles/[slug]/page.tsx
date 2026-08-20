import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ArticleContentRenderer } from "@/components/articles/ArticleContentRenderer";
import { ArticleShare } from "@/components/articles/ArticleShare";
import { RelatedContentSection } from "@/components/related/RelatedContentSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleMetadata, buildPageMetadata } from "@/lib/seo/metadata";
import { resolveArticleSeo } from "@/lib/articles/seo";
import {
  buildArticleBreadcrumbStructuredData,
  buildArticleStructuredData,
} from "@/lib/seo/article-structured-data";
import { articlePath } from "@/lib/articles";
import {
  getArticleBySlug,
  getPublishedArticleSlugs,
} from "@/lib/supabase/public-articles";
import { getRelatedContent } from "@/lib/supabase/public-related-content";
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

  const seo = resolveArticleSeo({
    title: article.title,
    excerpt: article.excerpt,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    og_title: article.og_title,
    og_description: article.og_description,
    featured_image_alt: article.featured_image_alt,
  });

  return buildArticleMetadata({
    title: seo.metaTitle,
    description: seo.metaDescription,
    path: articlePath(article.slug),
    imageUrl: article.featured_image,
    author: article.author,
    publishedTime: article.publishedAtIso,
    modifiedTime: article.updatedAtIso,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    imageAlt: seo.imageAlt,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedContent({
    type: "article",
    slug: article.slug,
    category: article.category ?? "Cybersecurity News",
  });

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

            <h1 className="mt-4 break-words text-3xl font-bold leading-tight text-hcx-text sm:text-4xl lg:text-[2.5rem]">
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
              <ArticleContentRenderer content={article.content} />
            ) : (
              <p className="text-base leading-relaxed text-hcx-text-secondary">
                Full article content is not available.
              </p>
            )}
          </div>

          <footer className="mt-12 border-t border-hcx-border pt-8">
            <ArticleShare title={article.title} slug={article.slug} />
          </footer>
        </article>

        {related.length > 0 ? (
          <div className="mx-auto mt-14 max-w-7xl">
            <RelatedContentSection items={related} />
          </div>
        ) : null}
      </div>
    </PageShell>
    </>
  );
}
