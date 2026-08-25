"use client";

import { useState, useTransition } from "react";
import { sendMessageReply } from "@/lib/actions/message-replies";
import { buildReplySubject } from "@/lib/messages/reply-subject";
import {
  MESSAGE_REPLY_MAX_LENGTH,
  MESSAGE_REPLY_MIN_LENGTH,
} from "@/lib/messages/constants";
import type { Message } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

interface MessageReplyComposerProps {
  message: Message;
  disabled?: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onSent?: () => void;
}

export function MessageReplyComposer({
  message,
  disabled = false,
  onSuccess,
  onError,
  onSent,
}: MessageReplyComposerProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const defaultSubject = buildReplySubject(message.subject);

  function handleClear() {
    setBody("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBody = body.trim();
    if (trimmedBody.length < MESSAGE_REPLY_MIN_LENGTH) {
      onError(
        `Reply must be at least ${MESSAGE_REPLY_MIN_LENGTH} characters.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await sendMessageReply(message.id, trimmedBody);
      if (result.error) {
        onError(result.error);
        return;
      }

      setBody("");
      onSuccess("Reply sent successfully.");
      onSent?.();
    });
  }

  const isDisabled = disabled || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
        Reply
      </h3>

      <div className="space-y-3">
        <div>
          <label
            htmlFor={`reply-to-${message.id}`}
            className="text-xs font-medium text-hcx-text-secondary"
          >
            To
          </label>
          <input
            id={`reply-to-${message.id}`}
            type="email"
            readOnly
            value={message.email}
            className="mt-1 w-full rounded-lg border border-hcx-border bg-hcx-bg/60 px-3 py-2 text-sm text-hcx-text-secondary"
          />
        </div>

        <div>
          <label
            htmlFor={`reply-subject-${message.id}`}
            className="text-xs font-medium text-hcx-text-secondary"
          >
            Subject
          </label>
          <input
            id={`reply-subject-${message.id}`}
            type="text"
            readOnly
            value={defaultSubject}
            className="mt-1 w-full rounded-lg border border-hcx-border bg-hcx-bg/60 px-3 py-2 text-sm text-hcx-text-secondary"
          />
        </div>

        <div>
          <label
            htmlFor={`reply-body-${message.id}`}
            className="text-xs font-medium text-hcx-text-secondary"
          >
            Body
          </label>
          <textarea
            id={`reply-body-${message.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            maxLength={MESSAGE_REPLY_MAX_LENGTH}
            disabled={isDisabled}
            placeholder="Write your reply..."
            className={`mt-1 w-full rounded-lg border border-hcx-border bg-hcx-card px-3 py-2 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 disabled:opacity-60 ${focusRing}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={isDisabled || body.length === 0}
          onClick={handleClear}
          className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isDisabled || body.trim().length < MESSAGE_REPLY_MIN_LENGTH}
          className={`rounded-lg bg-hcx-cyan px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
        >
          {isPending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </form>
  );
}
