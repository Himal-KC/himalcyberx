"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteArticle } from "@/lib/actions/articles";
import { focusRing } from "@/lib/page-data";

interface DeleteArticleButtonProps {
  articleId: string;
  articleTitle: string;
}

export function DeleteArticleButton({
  articleId,
  articleTitle,
}: DeleteArticleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteArticle(articleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/admin/articles?success=deleted");
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
            aria-labelledby="delete-article-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-article-title"
              className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-red"
            >
              DELETE ARTICLE?
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              Are you sure you want to permanently delete:
            </p>
            <p className="mt-2 text-sm font-medium text-hcx-text">
              &ldquo;{articleTitle}&rdquo;?
            </p>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              This action cannot be undone.
            </p>

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
                disabled={isPending}
                onClick={handleDelete}
                className={`rounded-lg bg-hcx-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
              >
                {isPending ? "Deleting…" : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
