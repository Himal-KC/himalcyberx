import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleStatusBadge } from "@/components/admin/articles/ArticleStatusBadge";
import { ArticleContentRenderer } from "@/components/articles/ArticleContentRenderer";
import { getAdminArticleById } from "@/lib/supabase/admin-articles";
import { focusRing } from "@/lib/page-data";

interface PreviewArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PreviewArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getAdminArticleById(id);

  return {
    title: article
      ? `Preview: ${article.title} | HCX Admin`
      : "Article Preview | HCX Admin",
    robots: { index: false, follow: false },
  };
}

export default async function PreviewArticlePage({
  params,
}: PreviewArticlePageProps) {
  const { id } = await params;
  const article = await getAdminArticleById(id);

  if (!article) {
    notFound();
  }

  if (article.status === "published") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-orange">
          Admin Preview — Not Public
        </p>
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
        >
          Edit Article
        </Link>
      </div>

      <article className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <ArticleStatusBadge status={article.status} />
          {article.featured && (
            <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
              Featured
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-hcx-text">
          {article.title}
        </h1>
        <p className="mt-4 text-sm text-hcx-text-secondary">
          By {article.author}
          {article.published_at &&
            ` · ${new Date(article.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}`}
        </p>

        {article.featured_image && (
          <div className="mt-6 overflow-hidden rounded-lg border border-hcx-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featured_image}
              alt={article.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <p className="mt-6 text-lg leading-relaxed text-hcx-text-secondary">
          {article.excerpt}
        </p>

        <div className="mt-8">
          {article.content ? (
            <ArticleContentRenderer content={article.content} />
          ) : (
            <p className="text-base leading-relaxed text-hcx-text-secondary">
              Full article content is not available.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
