import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFlashBanner } from "@/components/admin/AdminFlashBanner";
import { ArticlesListFilters } from "@/components/admin/articles/ArticlesListFilters";
import { ArticlesTable } from "@/components/admin/articles/ArticlesTable";
import {
  applyArticleListFilters,
  articleListFiltersAreActive,
  parseArticleListFilters,
} from "@/lib/admin/article-list";
import { getAdminArticles, getAdminCategories } from "@/lib/supabase/admin-articles";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Articles | HCX Admin",
  robots: { index: false, follow: false },
};

interface AdminArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminArticlesPage({
  searchParams,
}: AdminArticlesPageProps) {
  const params = await searchParams;
  const filters = parseArticleListFilters(params);
  const [articles, categories] = await Promise.all([
    getAdminArticles(),
    getAdminCategories(),
  ]);
  const filteredArticles = applyArticleListFilters(articles, filters);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Content
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
            ARTICLES
          </h1>
        </div>
        <Link
          href="/admin/articles/new"
          className={`inline-flex items-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          + New Article
        </Link>
      </div>

      {params.success && typeof params.success === "string" ? (
        <AdminFlashBanner type={params.success} />
      ) : null}

      <div className="mb-6">
        <Suspense fallback={null}>
          <ArticlesListFilters filters={filters} categories={categories} />
        </Suspense>
      </div>

      <ArticlesTable
        articles={filteredArticles}
        totalCount={articles.length}
        hasActiveFilters={articleListFiltersAreActive(filters)}
      />
    </div>
  );
}
