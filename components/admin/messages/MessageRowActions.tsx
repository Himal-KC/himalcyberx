"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateMessageStatus } from "@/lib/actions/messages";
import { ArchiveMessageButton } from "@/components/admin/messages/ArchiveMessageButton";
import type { Message } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

interface MessageRowActionsProps {
  message: Message;
  onView: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function MessageRowActions({
  message,
  onView,
  onSuccess,
  onError,
}: MessageRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: "read" | "new", successText: string) {
    startTransition(async () => {
      const result = await updateMessageStatus(message.id, status);
      if (result.error) {
        onError?.(result.error);
        return;
      }
      onSuccess?.(successText);
      router.refresh();
    });
  }

  const actionClass = `text-sm transition-opacity hover:opacity-80 disabled:opacity-60 ${focusRing}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={onView}
        disabled={isPending}
        className={`${actionClass} text-hcx-text-secondary hover:text-hcx-cyan`}
      >
        View
      </button>

      {message.status === "new" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            handleStatusChange("read", "Message marked as read.")
          }
          className={`${actionClass} text-hcx-cyan hover:underline`}
        >
          Mark as Read
        </button>
      )}

      {(message.status === "read" || message.status === "archived") && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            handleStatusChange("new", "Message marked as new.")
          }
          className={`${actionClass} text-hcx-cyan hover:underline`}
        >
          Mark as New
        </button>
      )}

      {message.status === "archived" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            handleStatusChange("read", "Message marked as read.")
          }
          className={`${actionClass} text-hcx-cyan hover:underline`}
        >
          Mark as Read
        </button>
      )}

      {message.status !== "archived" && (
        <ArchiveMessageButton
          messageId={message.id}
          messageSubject={message.subject}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
