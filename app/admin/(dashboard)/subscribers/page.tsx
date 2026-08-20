import type { Metadata } from "next";
import { Suspense } from "react";
import { SubscribersListFilters } from "@/components/admin/subscribers/SubscribersListFilters";
import { SubscribersTable } from "@/components/admin/subscribers/SubscribersTable";
import {
  applySubscriberListFilters,
  getSubscriberSourceOptions,
  getSubscriberSummaryCounts,
  parseSubscriberListFilters,
  subscriberListFiltersAreActive,
} from "@/lib/admin/subscriber-list";
import { getAdminSubscribers } from "@/lib/supabase/admin-subscribers";

export const metadata: Metadata = {
  title: "Subscribers | HCX Admin",
  robots: { index: false, follow: false },
};

interface AdminSubscribersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSubscribersPage({
  searchParams,
}: AdminSubscribersPageProps) {
  const params = await searchParams;
  const filters = parseSubscriberListFilters(params);
  const subscribers = await getAdminSubscribers();
  const filteredSubscribers = applySubscriberListFilters(subscribers, filters);
  const stats = getSubscriberSummaryCounts(subscribers);
  const sources = getSubscriberSourceOptions(subscribers);

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Audience
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          SUBSCRIBERS
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Review newsletter subscribers and manage subscription status.
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <SubscribersListFilters
            filters={filters}
            sources={sources}
            canExport={filteredSubscribers.length > 0}
          />
        </Suspense>
      </div>

      <SubscribersTable
        subscribers={filteredSubscribers}
        totalCount={subscribers.length}
        stats={stats}
        filters={filters}
        hasActiveFilters={subscriberListFiltersAreActive(filters)}
      />
    </div>
  );
}
