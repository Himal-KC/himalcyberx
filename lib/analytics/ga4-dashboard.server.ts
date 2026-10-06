import "server-only";

import { unstable_cache } from "next/cache";
import { fetchGa4AdminDashboardUncached } from "@/lib/analytics/ga4-fetch.server";
import type { AdminAnalyticsLoadResult } from "@/lib/analytics/ga4-types";

/** ~30 minutes — analytics does not need realtime freshness. */
export const GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS = 1800;

const loadGa4AdminDashboardCached = unstable_cache(
  async (): Promise<AdminAnalyticsLoadResult> => {
    const result = await fetchGa4AdminDashboardUncached();

    if (!result.ok) {
      return {
        status: "unavailable",
        message: result.error,
      };
    }

    return {
      status: "ok",
      data: result.data,
      fetchedAt: new Date().toISOString(),
      cacheMaxAgeSeconds: GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS,
    };
  },
  ["hcx-admin-ga4-dashboard-v1"],
  { revalidate: GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS },
);

export async function getAdminAnalyticsDashboard(): Promise<AdminAnalyticsLoadResult> {
  return loadGa4AdminDashboardCached();
}
