import "server-only";

import { unstable_cache } from "next/cache";
import { fetchGa4AdminDashboardUncached } from "@/lib/analytics/ga4-fetch.server";
import { fetchRecentPublishedContentForAnalytics } from "@/lib/analytics/recent-content-cms.server";
import { joinRecentContentPerformance } from "@/lib/analytics/recent-content-join-core";
import type { AdminAnalyticsLoadResult } from "@/lib/analytics/ga4-types";

/** ~30 minutes — analytics does not need realtime freshness. */
export const GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS = 1800;

const loadGa4AdminDashboardCached = unstable_cache(
  async (): Promise<AdminAnalyticsLoadResult> => {
    const [gaResult, cmsResult] = await Promise.all([
      fetchGa4AdminDashboardUncached(),
      fetchRecentPublishedContentForAnalytics(),
    ]);

    if (!gaResult.ok) {
      return {
        status: "unavailable",
        message: gaResult.error,
      };
    }

    const recentContentPerformance = joinRecentContentPerformance({
      cmsItems: cmsResult.ok ? cmsResult.items : [],
      pagePathMetrics: gaResult.pagePathMetrics,
      shareActionsByPath: gaResult.shareActionsByPath,
      sharePerContentStatus: gaResult.sharePerContentStatus,
      cmsAvailable: cmsResult.ok,
    });

    return {
      status: "ok",
      data: {
        ...gaResult.data,
        recentContentPerformance,
      },
      fetchedAt: new Date().toISOString(),
      cacheMaxAgeSeconds: GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS,
    };
  },
  ["hcx-admin-ga4-dashboard-v4"],
  { revalidate: GA4_ADMIN_DASHBOARD_REVALIDATE_SECONDS },
);

export async function getAdminAnalyticsDashboard(): Promise<AdminAnalyticsLoadResult> {
  return loadGa4AdminDashboardCached();
}
