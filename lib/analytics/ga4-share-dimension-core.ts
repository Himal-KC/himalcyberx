/**
 * GA4 Data API: event parameters (e.g. share `method`) are not queryable as
 * breakdown dimensions until registered as an event-scoped custom dimension.
 *
 * Manual setup (Google Analytics → Admin → Data display → Custom definitions):
 * - Custom dimension name: Share method (any display name)
 * - Scope: Event
 * - Event parameter: method
 * - API dimension after registration: customEvent:method
 *
 * Historical share events before registration will not backfill the dimension;
 * only events collected after the dimension is active appear in breakdown reports.
 *
 * Deploy client share event tracking first; add the custom dimension when you
 * want method breakdown in Admin (totals work without it).
 */
export const GA4_SHARE_METHOD_DIMENSION = "customEvent:method" as const;

export const GA4_SHARE_METHOD_BREAKDOWN_SETUP_NOTICE =
  "Method breakdown requires a GA4 event-scoped custom dimension on the method parameter (Admin → Custom definitions). Until configured, only total share-button actions are shown." as const;
