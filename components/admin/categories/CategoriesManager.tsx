"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";
import type { AdminCategoryRow } from "@/lib/supabase/admin-categories";
import { focusRing } from "@/lib/page-data";

interface CategoriesManagerProps {
  categories: AdminCategoryRow[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<AdminCategoryRow | null>(null);

  const handleSuccess = useCallback(() => {
    setCreateOpen(false);
    setEditingCategory(null);
    router.refresh();
  }, [router]);

  const boundUpdateAction = editingCategory
    ? updateCategory.bind(null, editingCategory.id)
    : createCategory;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Content
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
            CATEGORIES
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
            Organize HimalCyberX cybersecurity content.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className={`inline-flex items-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          + New Category
        </button>
      </div>

      <CategoriesTable
        categories={categories}
        onEdit={(category) => setEditingCategory(category)}
      />

      <CategoryFormModal
        open={createOpen}
        action={createCategory}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      <CategoryFormModal
        open={Boolean(editingCategory)}
        category={editingCategory}
        action={boundUpdateAction}
        onClose={() => setEditingCategory(null)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
