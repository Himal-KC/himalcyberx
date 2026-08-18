import Link from "next/link";
import { SubscriberStatusBadge } from "@/components/admin/subscribers/SubscriberStatusBadge";
import type { DashboardRecentSubscriber } from "@/lib/supabase/admin-queries";
import { focusRing } from "@/lib/page-data";

function formatSubscriberDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface DashboardRecentSubscribersProps {
  subscribers: DashboardRecentSubscriber[];
}

export function DashboardRecentSubscribers({
  subscribers,
}: DashboardRecentSubscribersProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Recent Subscribers
        </h2>
        <Link
          href="/admin/subscribers"
          className={`shrink-0 text-sm font-medium text-hcx-cyan hover:underline ${focusRing}`}
        >
          View All Subscribers →
        </Link>
      </div>

      {subscribers.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          No subscribers yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hcx-border">
          {subscribers.map((subscriber) => (
            <li
              key={subscriber.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-hcx-text">
                  {subscriber.email}
                </p>
                <div className="mt-1">
                  <SubscriberStatusBadge status={subscriber.status} />
                </div>
              </div>
              <p className="shrink-0 text-xs text-hcx-text-secondary">
                {formatSubscriberDate(subscriber.subscribed_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
