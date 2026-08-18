"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMessageStatus } from "@/lib/actions/messages";
import { focusRing } from "@/lib/page-data";

interface ArchiveMessageButtonProps {
  messageId: string;
  messageSubject: string;
  onSuccess?: (message: string) => void;
  className?: string;
}

export function ArchiveMessageButton({
  messageId,
  messageSubject,
  onSuccess,
  className,
}: ArchiveMessageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await updateMessageStatus(messageId, "archived");
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onSuccess?.("Message archived successfully.");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          `text-sm text-hcx-orange transition-opacity hover:opacity-80 ${focusRing}`
        }
      >
        Archive
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
            aria-labelledby="archive-message-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="archive-message-title"
              className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-orange"
            >
              Archive message?
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              Are you sure you want to archive:
            </p>
            <p className="mt-2 text-sm font-medium text-hcx-text">
              &ldquo;{messageSubject}&rdquo;?
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
                onClick={handleConfirm}
                className={`rounded-lg bg-hcx-orange px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
              >
                {isPending ? "Archiving…" : "Archive Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
