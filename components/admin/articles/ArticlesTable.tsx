import Link from "next/link";
import type { AdminArticleRow } from "@/lib/supabase/types";
import { articlePath } from "@/lib/articles";
import { ArticleStatusBadge } from "@/components/admin/articles/ArticleStatusBadge";
import { DeleteArticleButton } from "@/components/admin/articles/DeleteArticleButton";
import { focusRing } from "@/lib/page-data";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ArticleRowActions({ article }: { article: AdminArticleRow }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={articlePath(article.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
      >
        View
      </Link>
      <Link
        href={`/admin/articles/${article.id}/edit`}
        className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
      >
        Edit
      </Link>
      <DeleteArticleButton
        articleId={article.id}
        articleTitle={article.title}
      />
    </div>
  );
}

export function ArticlesTable({ articles }: { articles: AdminArticleRow[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-hcx-text">No articles yet.</p>
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Create your first HimalCyberX article.
        </p>
        <Link
          href="/admin/articles/new"
          className={`mt-6 inline-flex rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          Create Article
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-hcx-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hcx-border bg-hcx-bg-secondary/60">
            <tr>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Title
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Featured
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Published Date
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hcx-border bg-hcx-card">
            {articles.map((article) => (
              <tr key={article.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-hcx-text">{article.title}</p>
                  <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                    /{article.slug}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <ArticleStatusBadge status={article.status} />
                </td>
                <td className="px-4 py-4">
                  {article.featured ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                      Featured
                    </span>
                  ) : (
                    <span className="text-hcx-text-secondary">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {formatDate(article.published_at)}
                </td>
                <td className="px-4 py-4">
                  <ArticleRowActions article={article} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-xl border border-hcx-border bg-hcx-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-hcx-text">{article.title}</p>
                <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                  /{article.slug}
                </p>
              </div>
              <ArticleStatusBadge status={article.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-hcx-text-secondary">Featured</dt>
                <dd className="mt-1 text-hcx-text">
                  {article.featured ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Published Date</dt>
                <dd className="mt-1 text-hcx-text">
                  {formatDate(article.published_at)}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <ArticleRowActions article={article} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
