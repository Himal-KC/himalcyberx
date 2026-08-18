"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSubscriberStatus } from "@/lib/actions/subscribers";
import type { SubscriberStatus } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

interface SubscriberStatusButtonProps {
  subscriberId: string;
  subscriberEmail: string;
  nextStatus: SubscriberStatus;
  label: string;
  confirmMessage: string;
  className?: string;
}

export function SubscriberStatusButton({
  subscriberId,
  subscriberEmail,
  nextStatus,
  label,
  confirmMessage,
  className,
}: SubscriberStatusButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubscriberStatus(subscriberId, nextStatus);
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
        className={className}
      >
        {label}
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
            aria-labelledby="subscriber-status-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="subscriber-status-title"
              className="text-lg font-semibold text-hcx-text"
            >
              {confirmMessage}
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text">{subscriberEmail}</span>
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
                className={`rounded-lg bg-hcx-cyan px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
              >
                {isPending ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
