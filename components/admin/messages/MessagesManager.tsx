"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getMessageFilterEmptyMessage,
  messageListFiltersAreActive,
  parseMessageListFilters,
  type MessageStatusFilter,
} from "@/lib/admin/message-list";
import { MessageDetailModal } from "@/components/admin/messages/MessageDetailModal";
import { MessageRowActions } from "@/components/admin/messages/MessageRowActions";
import { MessageStatusBadge } from "@/components/admin/messages/MessageStatusBadge";
import type { Message, MessageReply } from "@/lib/supabase/types";
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

interface MessagesManagerProps {
  messages: Message[];
  replies: MessageReply[];
}

export function MessagesManager({ messages, replies }: MessagesManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const statusFilter = parseMessageListFilters({
    status: searchParams.get("status") ?? undefined,
  }).status;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashIsError, setFlashIsError] = useState(false);

  function setStatusFilter(status: MessageStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function resetFilters() {
    setQuery("");
    router.push(pathname);
  }

  const hasActiveFilters =
    messageListFiltersAreActive({ status: statusFilter }) ||
    Boolean(query.trim());

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

  const repliesByMessageId = useMemo(() => {
    const grouped = new Map<string, MessageReply[]>();

    for (const reply of replies) {
      const existing = grouped.get(reply.message_id) ?? [];
      existing.push(reply);
      grouped.set(reply.message_id, existing);
    }

    return grouped;
  }, [replies]);

  const selectedReplies = selectedMessage
    ? (repliesByMessageId.get(selectedMessage.id) ?? [])
    : [];

  function showSuccess(message: string) {
    setFlashIsError(false);
    setFlashMessage(message);
  }

  function showError(message: string) {
    setFlashIsError(true);
    setFlashMessage(message);
  }

  return (
    <div className="space-y-6">
      {flashMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            flashIsError
              ? "border-hcx-red/25 bg-hcx-red/10 text-hcx-red"
              : "border-hcx-green/25 bg-hcx-green/10 text-hcx-green"
          }`}
        >
          {flashMessage}
        </div>
      )}

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

        <div className="flex flex-wrap items-center gap-3">
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
                ["spam", "Spam"],
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

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className={`text-sm font-medium text-hcx-cyan hover:underline ${focusRing}`}
            >
              Reset Filters
            </button>
          ) : null}
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
          <p className="text-hcx-text">
            {getMessageFilterEmptyMessage(
              statusFilter,
              Boolean(query.trim()),
            )}
          </p>
          {hasActiveFilters ? (
            <p className="mt-2 text-sm text-hcx-text-secondary">
              Try adjusting your search or filters.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-hcx-border md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
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
                    <td className="px-4 py-4 break-all text-hcx-text-secondary">
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
                      <MessageRowActions
                        message={message}
                        onView={() => {
                          setFlashMessage(null);
                          setSelectedId(message.id);
                        }}
                        onSuccess={showSuccess}
                        onError={showError}
                      />
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
                    <p className="mt-1 break-all text-xs text-hcx-text-secondary">
                      {message.email}
                    </p>
                  </div>
                  <MessageStatusBadge status={message.status} />
                </div>
                <p className="mt-3 text-sm text-hcx-text">{message.subject}</p>
                <p className="mt-2 text-xs text-hcx-text-secondary">
                  {formatDate(message.created_at)}
                </p>
                <div className="mt-4">
                  <MessageRowActions
                    message={message}
                    onView={() => {
                      setFlashMessage(null);
                      setSelectedId(message.id);
                    }}
                    onSuccess={showSuccess}
                    onError={showError}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {selectedMessage ? (
        <MessageDetailModal
          message={selectedMessage}
          replies={selectedReplies}
          onClose={() => setSelectedId(null)}
          onSuccess={showSuccess}
          onError={showError}
        />
      ) : null}
    </div>
  );
}
