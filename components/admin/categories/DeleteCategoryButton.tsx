"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory } from "@/lib/actions/categories";
import { focusRing } from "@/lib/page-data";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  articleCount: number;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  articleCount,
}: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm text-hcx-red transition-opacity hover:opacity-80 ${focusRing}`}
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-category-title"
              className="text-lg font-semibold text-hcx-text"
            >
              Delete category?
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text">{categoryName}</span>{" "}
              will be permanently removed. This action cannot be undone.
            </p>

            {articleCount > 0 && (
              <p className="mt-3 rounded-lg border border-hcx-orange/25 bg-hcx-orange/10 p-3 text-sm text-hcx-orange">
                This category is assigned to {articleCount} article
                {articleCount === 1 ? "" : "s"} and cannot be deleted until they
                are reassigned.
              </p>
            )}

            {error && (
              <p className="mt-4 text-sm text-hcx-red" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || articleCount > 0}
                onClick={handleDelete}
                className={`rounded-lg bg-hcx-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                {isPending ? "Deleting…" : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
