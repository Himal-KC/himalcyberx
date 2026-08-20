"use client";

import { useState } from "react";
import type { Subscriber } from "@/lib/supabase/types";
import {
  formatSubscriberSource,
  getSubscriberFilterEmptyMessage,
  type SubscriberListFilters,
  type SubscriberSummaryCounts,
} from "@/lib/admin/subscriber-list";
import { SubscriberStatusBadge } from "@/components/admin/subscribers/SubscriberStatusBadge";
import { SubscriberRowActions } from "@/components/admin/subscribers/SubscriberRowActions";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface SubscribersTableProps {
  subscribers: Subscriber[];
  totalCount: number;
  stats: SubscriberSummaryCounts;
  filters: SubscriberListFilters;
  hasActiveFilters: boolean;
}

export function SubscribersTable({
  subscribers,
  totalCount,
  stats,
  filters,
  hasActiveFilters,
}: SubscribersTableProps) {
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashIsError, setFlashIsError] = useState(false);

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

      {totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-hcx-text">No subscribers yet.</p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Newsletter signups from the public site will appear here.
          </p>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-xl border border-hcx-border bg-hcx-card px-6 py-12 text-center">
          <p className="text-hcx-text">
            {getSubscriberFilterEmptyMessage(filters)}
          </p>
          {hasActiveFilters ? (
            <p className="mt-2 text-sm text-hcx-text-secondary">
              Try adjusting your search or filters.
            </p>
          ) : null}
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
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-hcx-text">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-4">
                      <SubscriberStatusBadge status={subscriber.status} />
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary">
                      {formatSubscriberSource(subscriber.source)}
                    </td>
                    <td className="px-4 py-4 text-hcx-text-secondary">
                      {formatDate(subscriber.subscribed_at)}
                    </td>
                    <td className="px-4 py-4">
                      <SubscriberRowActions
                        subscriber={subscriber}
                        onSuccess={(message) => {
                          setFlashIsError(false);
                          setFlashMessage(message);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {subscribers.map((subscriber) => (
              <article
                key={subscriber.id}
                className="rounded-xl border border-hcx-border bg-hcx-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="break-all font-medium text-hcx-text">
                    {subscriber.email}
                  </p>
                  <SubscriberStatusBadge status={subscriber.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-hcx-text-secondary">Source</dt>
                    <dd className="mt-1 text-hcx-text">
                      {formatSubscriberSource(subscriber.source)}
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
                  <SubscriberRowActions
                    subscriber={subscriber}
                    onSuccess={(message) => {
                      setFlashIsError(false);
                      setFlashMessage(message);
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
