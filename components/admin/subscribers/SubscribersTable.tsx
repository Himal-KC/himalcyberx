"use client";

import { useMemo, useState } from "react";
import type { Subscriber } from "@/lib/supabase/types";
import { SubscriberStatusBadge } from "@/components/admin/subscribers/SubscriberStatusBadge";
import { SubscriberStatusButton } from "@/components/admin/subscribers/SubscriberStatusButton";
import { focusRing } from "@/lib/page-data";

type StatusFilter = "all" | "active" | "unsubscribed";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSource(source: string): string {
  return source
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface SubscribersTableProps {
  subscribers: Subscriber[];
}

export function SubscribersTable({ subscribers }: SubscribersTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredSubscribers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return subscribers.filter((subscriber) => {
      if (statusFilter !== "all" && subscriber.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        subscriber.email.toLowerCase().includes(normalizedQuery) ||
        subscriber.source.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, statusFilter, subscribers]);

  const stats = useMemo(
    () => ({
      total: subscribers.length,
      active: subscribers.filter((subscriber) => subscriber.status === "active")
        .length,
      unsubscribed: subscribers.filter(
        (subscriber) => subscriber.status === "unsubscribed",
      ).length,
    }),
    [subscribers],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Total Subscribers
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-text">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Active
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-green">
            {stats.active}
          </p>
        </div>
        <div className="rounded-xl border border-hcx-border bg-hcx-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
            Unsubscribed
          </p>
          <p className="mt-2 text-3xl font-semibold text-hcx-text-secondary">
            {stats.unsubscribed}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md flex-1">
          <label htmlFor="subscriber-search" className="sr-only">
            Search subscribers
          </label>
          <input
            id="subscriber-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by email or source..."
            className={`w-full rounded-lg border border-hcx-border bg-hcx-card px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter subscribers by status"
        >
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["unsubscribed", "Unsubscribed"],
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

      {subscribers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-hcx-text">No subscribers yet.</p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Newsletter signups from the public site will appear here.
          </p>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="rounded-xl border border-hcx-border bg-hcx-card px-6 py-12 text-center">
          <p className="text-hcx-text">No subscribers match your search.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-hcx-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hcx-border bg-hcx-bg-secondary/60">
                <tr>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Source
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Subscribed Date
                  </th>
                  <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hcx-border bg-hcx-card">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-hcx-text">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-4">
                      <SubscriberStatusBadge status={subscriber.status} />
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary">
                      {formatSource(subscriber.source)}
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary">
                      {formatDate(subscriber.subscribed_at)}
                    </td>
                    <td className="px-4 py-4">
                      {subscriber.status === "active" ? (
                        <SubscriberStatusButton
                          subscriberId={subscriber.id}
                          subscriberEmail={subscriber.email}
                          nextStatus="unsubscribed"
                          label="Unsubscribe"
                          confirmMessage="Mark this subscriber as unsubscribed?"
                          className={`text-sm text-hcx-orange transition-opacity hover:opacity-80 ${focusRing}`}
                        />
                      ) : (
                        <SubscriberStatusButton
                          subscriberId={subscriber.id}
                          subscriberEmail={subscriber.email}
                          nextStatus="active"
                          label="Reactivate"
                          confirmMessage="Reactivate this subscriber?"
                          className={`text-sm text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredSubscribers.map((subscriber) => (
              <article
                key={subscriber.id}
                className="rounded-xl border border-hcx-border bg-hcx-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-hcx-text break-all">
                    {subscriber.email}
                  </p>
                  <SubscriberStatusBadge status={subscriber.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-hcx-text-secondary">Source</dt>
                    <dd className="mt-1 text-hcx-text">
                      {formatSource(subscriber.source)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-hcx-text-secondary">Subscribed Date</dt>
                    <dd className="mt-1 text-hcx-text">
                      {formatDate(subscriber.subscribed_at)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  {subscriber.status === "active" ? (
                    <SubscriberStatusButton
                      subscriberId={subscriber.id}
                      subscriberEmail={subscriber.email}
                      nextStatus="unsubscribed"
                      label="Unsubscribe"
                      confirmMessage="Mark this subscriber as unsubscribed?"
                      className={`text-sm text-hcx-orange transition-opacity hover:opacity-80 ${focusRing}`}
                    />
                  ) : (
                    <SubscriberStatusButton
                      subscriberId={subscriber.id}
                      subscriberEmail={subscriber.email}
                      nextStatus="active"
                      label="Reactivate"
                      confirmMessage="Reactivate this subscriber?"
                      className={`text-sm text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
