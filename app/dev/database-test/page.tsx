// REMOVE THIS ROUTE BEFORE PRODUCTION — development-only database connectivity check.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDatabaseStatus } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Database Test | HimalCyberX",
  robots: { index: false, follow: false },
};

export default async function DatabaseTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const status = await getDatabaseStatus();

  return (
    <div className="min-h-screen bg-hcx-bg px-4 py-16 text-hcx-text sm:px-6">
      <div className="mx-auto max-w-xl rounded-lg border border-hcx-border bg-hcx-card p-8">
        <h1 className="text-xl font-semibold tracking-tight">
          HimalCyberX Database Connection
        </h1>

        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-hcx-text-secondary">Database</dt>
            <dd className="mt-1">
              {status.connected ? (
                <span className="text-hcx-green">Connected</span>
              ) : (
                <span className="text-hcx-red">Unavailable</span>
              )}
            </dd>
          </div>

          {status.readAccessRestricted && (
            <div>
              <dt className="font-medium text-hcx-text-secondary">Read access</dt>
              <dd className="mt-1 text-hcx-orange">
                Restricted by Row Level Security
              </dd>
              <dd className="mt-2 text-hcx-text-secondary">
                This is acceptable and expected until public read policies are
                added.
              </dd>
            </div>
          )}

          {status.counts && (
            <>
              <div>
                <dt className="font-medium text-hcx-text-secondary">Articles</dt>
                <dd className="mt-1 font-mono">{status.counts.articles}</dd>
              </div>
              <div>
                <dt className="font-medium text-hcx-text-secondary">Labs</dt>
                <dd className="mt-1 font-mono">{status.counts.labs}</dd>
              </div>
              <div>
                <dt className="font-medium text-hcx-text-secondary">Tutorials</dt>
                <dd className="mt-1 font-mono">{status.counts.tutorials}</dd>
              </div>
              <div>
                <dt className="font-medium text-hcx-text-secondary">Categories</dt>
                <dd className="mt-1 font-mono">{status.counts.categories}</dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
