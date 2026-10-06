"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
  GA4_SHARE_EVENT_NAME,
  buildArticleShareEventParams,
  shouldSendShareAnalyticsEvent,
  type ArticleShareMethod,
} from "@/lib/analytics/ga4-share-events-core";

export function trackArticleShareButtonAction(
  analyticsGranted: boolean,
  method: ArticleShareMethod,
  slug: string,
): void {
  if (!shouldSendShareAnalyticsEvent(analyticsGranted)) {
    return;
  }

  const params = buildArticleShareEventParams(method, slug);
  if (!params) {
    return;
  }

  sendGAEvent("event", GA4_SHARE_EVENT_NAME, params);
}
