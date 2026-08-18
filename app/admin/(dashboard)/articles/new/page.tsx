import Link from "next/link";
import type { Metadata } from "next";
import { NewArticleForm } from "@/components/admin/articles/NewArticleForm";
import { createArticle } from "@/lib/actions/articles";
import { getAdminCategories } from "@/lib/supabase/admin-articles";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "New Article | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNewArticlePage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/articles"
          className={`inline-flex items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          ← Back to Articles
        </Link>

        <p className="mt-4 font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Content
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          NEW ARTICLE
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Create and publish cybersecurity content for HimalCyberX.
        </p>
      </div>

      <NewArticleForm action={createArticle} categories={categories} />
    </div>
  );
}
