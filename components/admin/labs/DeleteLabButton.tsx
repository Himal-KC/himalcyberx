"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLab } from "@/lib/actions/labs";
import { focusRing } from "@/lib/page-data";

interface DeleteLabButtonProps {
  labId: string;
  labTitle: string;
}

export function DeleteLabButton({ labId, labTitle }: DeleteLabButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLab(labId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/admin/labs?success=deleted");
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
            aria-labelledby="delete-lab-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-lab-title"
              className="text-lg font-semibold text-hcx-text"
            >
              Delete lab?
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text">{labTitle}</span> will
              be permanently removed. This action cannot be undone.
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
                {isPending ? "Deleting…" : "Delete Lab"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
