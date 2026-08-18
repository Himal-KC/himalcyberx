import type { Metadata } from "next";
import { SubscribersTable } from "@/components/admin/subscribers/SubscribersTable";
import { getAdminSubscribers } from "@/lib/supabase/admin-subscribers";

export const metadata: Metadata = {
  title: "Subscribers | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSubscribersPage() {
  const subscribers = await getAdminSubscribers();

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

      <SubscribersTable subscribers={subscribers} />
    </div>
  );
}
