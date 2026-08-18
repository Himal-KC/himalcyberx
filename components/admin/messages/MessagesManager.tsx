"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateMessageStatus } from "@/lib/actions/messages";
import { MessageStatusBadge } from "@/components/admin/messages/MessageStatusBadge";
import { PlainTextMessageContent } from "@/components/admin/messages/PlainTextMessageContent";
import type { Message, MessageStatus } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

type StatusFilter = "all" | MessageStatus;

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

interface MessagesManagerProps {
  messages: Message[];
}

export function MessagesManager({ messages }: MessagesManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return messages.filter((message) => {
      if (statusFilter !== "all" && message.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        message.name.toLowerCase().includes(normalizedQuery) ||
        message.email.toLowerCase().includes(normalizedQuery) ||
        message.subject.toLowerCase().includes(normalizedQuery) ||
        message.message.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [messages, query, statusFilter]);

  const stats = useMemo(
    () => ({
      total: messages.length,
      newCount: messages.filter((message) => message.status === "new").length,
      read: messages.filter((message) => message.status === "read").length,
      archived: messages.filter((message) => message.status === "archived")
        .length,
    }),
    [messages],
  );

  const selectedMessage =
    messages.find((message) => message.id === selectedId) ?? null;

  function handleStatusChange(messageId: string, status: MessageStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateMessageStatus(messageId, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Total Messages
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-text">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            New / Unread
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-cyan">
            {stats.newCount}
          </p>
        </div>
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Read
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-green">
            {stats.read}
          </p>
        </div>
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Archived
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-text-secondary">
            {stats.archived}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md flex-1">
          <label htmlFor="message-search" className="sr-only">
            Search messages
          </label>
          <input
            id="message-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by sender, email, or subject..."
            className={`w-full rounded-lg border border-hcx-border bg-hcx-card px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter messages by status"
        >
          {(
            [
              ["all", "All"],
              ["new", "New"],
              ["read", "Read"],
              ["archived", "Archived"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
                statusFilter === value
                  ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
                  : "border-hcx-border bg-hcx-card text-hcx-text-secondary hover:border-hcx-cyan/25 hover:text-hcx-cyan"
              }`}
              aria-pressed={statusFilter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-hcx-text">No messages yet.</p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Contact form submissions will appear here.
          </p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-xl border border-hcx-border bg-hcx-card px-6 py-12 text-center">
          <p className="text-hcx-text">No messages match your search.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-hcx-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hcx-border bg-hcx-bg-secondary/60">
                <tr>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Sender
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Subject
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Received Date
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hcx-border bg-hcx-card">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-hcx-text">
                      {message.name}
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary break-all">
                      {message.email}
                    </td>
                    <td className="px-4 py-4 text-hcx-text">{message.subject}</td>
                    <td className="px-4 py-4">
                      <MessageStatusBadge status={message.status} />
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary">
                      {formatDate(message.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSelectedId(message.id);
                        }}
                        className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredMessages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-hcx-border bg-hcx-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-hcx-text">{message.name}</p>
                    <p className="mt-1 text-xs text-hcx-text-secondary break-all">
                      {message.email}
                    </p>
                  </div>
                  <MessageStatusBadge status={message.status} />
                </div>
                <p className="mt-3 text-sm text-hcx-text">{message.subject}</p>
                <p className="mt-2 text-xs text-hcx-text-secondary">
                  {formatDate(message.created_at)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSelectedId(message.id);
                  }}
                  className={`mt-4 text-sm text-hcx-cyan hover:underline ${focusRing}`}
                >
                  View
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => !isPending && setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-detail-title"
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card shadow-xl"
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
                    {selectedMessage.subject}
                  </h2>
                </div>
                <MessageStatusBadge status={selectedMessage.status} />
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-hcx-text-secondary">Name</dt>
                  <dd className="mt-1 font-medium text-hcx-text">
                    {selectedMessage.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-hcx-text-secondary">Email</dt>
                  <dd className="mt-1 break-all text-hcx-text">
                    {selectedMessage.email}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-hcx-text-secondary">Received Date</dt>
                  <dd className="mt-1 text-hcx-text">
                    {formatDate(selectedMessage.created_at)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
                  Full Message
                </h3>
                <div className="mt-3 rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
                  <PlainTextMessageContent content={selectedMessage.message} />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-hcx-red" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-hcx-border px-6 py-4">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setSelectedId(null)}
                className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
              >
                Close
              </button>
              {selectedMessage.status !== "new" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleStatusChange(selectedMessage.id, "new")
                  }
                  className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
                >
                  Mark as New
                </button>
              )}
              {selectedMessage.status !== "read" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleStatusChange(selectedMessage.id, "read")
                  }
                  className={`rounded-lg bg-hcx-cyan px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
                >
                  Mark as Read
                </button>
              )}
              {selectedMessage.status !== "archived" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleStatusChange(selectedMessage.id, "archived")
                  }
                  className={`rounded-lg border border-hcx-orange/30 bg-hcx-orange/10 px-4 py-2 text-sm font-medium text-hcx-orange transition-colors hover:bg-hcx-orange/15 disabled:opacity-60 ${focusRing}`}
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
