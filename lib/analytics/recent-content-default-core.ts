import { GA4_SHARE_PER_CONTENT_UNAVAILABLE_NOTICE } from "./ga4-share-dimension-core.ts";
import {
  RECENT_CONTENT_PERFORMANCE_DESCRIPTION,
  RECENT_CONTENT_PERFORMANCE_PERIOD_DAYS,
} from "./recent-content-join-core.ts";
import type { AdminAnalyticsRecentContentPerformance } from "./ga4-types.ts";

export function createEmptyRecentContentPerformance(): AdminAnalyticsRecentContentPerformance {
  return {
    periodDays: RECENT_CONTENT_PERFORMANCE_PERIOD_DAYS,
    periodDescription: RECENT_CONTENT_PERFORMANCE_DESCRIPTION,
    status: "ok",
    rows: [],
    sharePerContentStatus: "unavailable",
    sharePerContentNotice: GA4_SHARE_PER_CONTENT_UNAVAILABLE_NOTICE,
  };
}
