"use client";

import type { Subscriber } from "@/lib/supabase/types";
import { SubscriberStatusBadge } from "@/components/admin/subscribers/SubscriberStatusBadge";
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

function formatSource(source: string): string {
  return source
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface SubscriberViewModalProps {
  subscriber: Subscriber;
  onClose: () => void;
}

export function SubscriberViewModal({
  subscriber,
  onClose,
}: SubscriberViewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscriber-view-title"
        className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
              Subscriber Details
            </p>
            <h2
              id="subscriber-view-title"
              className="mt-2 text-lg font-semibold text-hcx-text break-all"
            >
              {subscriber.email}
            </h2>
          </div>
          <SubscriberStatusBadge status={subscriber.status} />
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-hcx-text-secondary">Email</dt>
            <dd className="mt-1 break-all font-medium text-hcx-text">
              {subscriber.email}
            </dd>
          </div>
          <div>
            <dt className="text-hcx-text-secondary">Status</dt>
            <dd className="mt-1 text-hcx-text capitalize">{subscriber.status}</dd>
          </div>
          <div>
            <dt className="text-hcx-text-secondary">Source</dt>
            <dd className="mt-1 text-hcx-text">{formatSource(subscriber.source)}</dd>
          </div>
          <div>
            <dt className="text-hcx-text-secondary">Subscribed Date</dt>
            <dd className="mt-1 text-hcx-text">
              {formatDate(subscriber.subscribed_at)}
            </dd>
          </div>
          <div>
            <dt className="text-hcx-text-secondary">Unsubscribed Date</dt>
            <dd className="mt-1 text-hcx-text">
              {formatDate(subscriber.unsubscribed_at)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg ${focusRing}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
