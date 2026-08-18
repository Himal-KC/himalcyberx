"use client";

import type { AdminCategoryRow } from "@/lib/supabase/admin-categories";
import { DeleteCategoryButton } from "@/components/admin/categories/DeleteCategoryButton";
import { focusRing } from "@/lib/page-data";

interface CategoriesTableProps {
  categories: AdminCategoryRow[];
  onEdit: (category: AdminCategoryRow) => void;
}

export function CategoriesTable({ categories, onEdit }: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-hcx-text">No categories yet.</p>
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Create categories to organize HimalCyberX content.
        </p>
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
                Name
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Slug
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Description
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Articles
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hcx-border bg-hcx-card">
            {categories.map((category) => (
              <tr key={category.id} className="align-top">
                <td className="px-4 py-4 font-medium text-hcx-text">
                  {category.name}
                </td>
                <td className="px-4 py-4 font-mono text-xs text-hcx-text-secondary">
                  {category.slug}
                </td>
                <td className="max-w-xs px-4 py-4 text-hcx-text-secondary">
                  {category.description || "—"}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {category.article_count}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className={`text-sm text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`}
                    >
                      Edit
                    </button>
                    <DeleteCategoryButton
                      categoryId={category.id}
                      categoryName={category.name}
                      articleCount={category.article_count}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-xl border border-hcx-border bg-hcx-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-hcx-text">{category.name}</p>
                <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                  {category.slug}
                </p>
              </div>
              <span className="text-xs text-hcx-text-secondary">
                {category.article_count} article
                {category.article_count === 1 ? "" : "s"}
              </span>
            </div>

            {category.description && (
              <p className="mt-3 text-sm text-hcx-text-secondary">
                {category.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hcx-border pt-4">
              <button
                type="button"
                onClick={() => onEdit(category)}
                className={`text-sm text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`}
              >
                Edit
              </button>
              <DeleteCategoryButton
                categoryId={category.id}
                categoryName={category.name}
                articleCount={category.article_count}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
