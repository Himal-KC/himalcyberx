import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";
import { updateArticle } from "@/lib/actions/articles";
import {
  getAdminArticleById,
  getAdminCategories,
} from "@/lib/supabase/admin-articles";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getAdminArticleById(id);

  return {
    title: article
      ? `Edit: ${article.title} | HCX Admin`
      : "Edit Article | HCX Admin",
    robots: { index: false, follow: false },
  };
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    getAdminArticleById(id),
    getAdminCategories(),
  ]);

  if (!article) {
    notFound();
  }

  const boundUpdate = updateArticle.bind(null, id);

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Content
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          Edit Article
        </h1>
        <p className="mt-2 text-sm text-hcx-text-secondary">{article.title}</p>
      </div>

      <ArticleForm
        action={boundUpdate}
        categories={categories}
        article={article}
        submitLabel="Save Changes"
      />
    </div>
  );
}
