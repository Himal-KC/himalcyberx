import Link from "next/link";
import type { Metadata } from "next";
import { AdminFlashBanner } from "@/components/admin/AdminFlashBanner";
import { ArticlesTable } from "@/components/admin/articles/ArticlesTable";
import { getAdminArticles } from "@/lib/supabase/admin-articles";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Articles | HCX Admin",
  robots: { index: false, follow: false },
};

interface AdminArticlesPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function AdminArticlesPage({
  searchParams,
}: AdminArticlesPageProps) {
  const [{ success }, articles] = await Promise.all([
    searchParams,
    getAdminArticles(),
  ]);

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

      {success && <AdminFlashBanner type={success} />}

      <ArticlesTable articles={articles} />
    </div>
  );
}
