"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateMessageStatus } from "@/lib/actions/messages";
import { ArchiveMessageButton } from "@/components/admin/messages/ArchiveMessageButton";
import { MessageConversationThread } from "@/components/admin/messages/MessageConversationThread";
import { MessageReplyComposer } from "@/components/admin/messages/MessageReplyComposer";
import { MessageStatusBadge } from "@/components/admin/messages/MessageStatusBadge";
import type { Message, MessageReply, MessageStatus } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface MessageDetailModalProps {
  message: Message;
  replies: MessageReply[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function MessageDetailModal({
  message,
  replies,
  onClose,
  onSuccess,
  onError,
}: MessageDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: MessageStatus, successText: string) {
    startTransition(async () => {
      const result = await updateMessageStatus(message.id, status);
      if (result.error) {
        onError(result.error);
        return;
      }

      onSuccess(successText);
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={() => !isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-detail-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-hcx-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
                Message Detail
              </p>
              <h2
                id="message-detail-title"
                className="mt-2 text-lg font-semibold text-hcx-text"
              >
                {message.subject}
              </h2>
            </div>
            <MessageStatusBadge status={message.status} />
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-hcx-text-secondary">Name</dt>
              <dd className="mt-1 font-medium text-hcx-text">{message.name}</dd>
            </div>
            <div>
              <dt className="text-hcx-text-secondary">Email</dt>
              <dd className="mt-1 break-all text-hcx-text">{message.email}</dd>
            </div>
            <div>
              <dt className="text-hcx-text-secondary">Subject</dt>
              <dd className="mt-1 text-hcx-text">{message.subject}</dd>
            </div>
            <div>
              <dt className="text-hcx-text-secondary">Received Date</dt>
              <dd className="mt-1 text-hcx-text">
                {formatDate(message.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-hcx-text-secondary">Status</dt>
              <dd className="mt-1">
                <MessageStatusBadge status={message.status} />
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <MessageConversationThread message={message} replies={replies} />
          </div>

          {message.status !== "spam" ? (
            <div className="mt-8 border-t border-hcx-border pt-8">
              <MessageReplyComposer
                message={message}
                disabled={isPending}
                onSuccess={onSuccess}
                onError={onError}
                onSent={() => router.refresh()}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-hcx-border px-6 py-4">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
          >
            Close
          </button>

          {message.status === "spam" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                handleStatusChange("new", "Message restored from spam.")
              }
              className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-cyan transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
            >
              Not Spam
            </button>
          ) : null}

          {(message.status === "read" || message.status === "archived") && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("new", "Message marked as new.")}
              className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-cyan transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
            >
              Mark as New
            </button>
          )}

          {(message.status === "new" || message.status === "archived") && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                handleStatusChange("read", "Message marked as read.")
              }
              className={`rounded-lg bg-hcx-cyan px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
            >
              Mark as Read
            </button>
          )}

          {message.status !== "archived" && message.status !== "spam" ? (
            <ArchiveMessageButton
              messageId={message.id}
              messageSubject={message.subject}
              onSuccess={(successMessage) => {
                onSuccess(successMessage);
                onClose();
              }}
              className={`rounded-lg border border-hcx-orange/30 bg-hcx-orange/10 px-4 py-2 text-sm font-medium text-hcx-orange transition-colors hover:bg-hcx-orange/15 ${focusRing}`}
            />
          ) : null}

          {message.status !== "spam" && message.status !== "archived" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                handleStatusChange("spam", "Message marked as spam.")
              }
              className={`rounded-lg border border-hcx-red/30 bg-hcx-red/10 px-4 py-2 text-sm font-medium text-hcx-red transition-colors hover:bg-hcx-red/15 disabled:opacity-60 ${focusRing}`}
            >
              Mark as Spam
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
