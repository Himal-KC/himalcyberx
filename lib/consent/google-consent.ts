/**
 * Google Consent Mode helpers for GA4.
 *
 * When AdSense is introduced, EEA/UK/Switzerland advertising consent must be
 * handled through an appropriate Google-certified CMP / Google Privacy &
 * Messaging configuration. This module must not conflict with that future layer.
 */

export const GOOGLE_CONSENT_DEFAULTS_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});
`;

function getGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined") {
    return null;
  }

  const gtag = window.gtag;
  return typeof gtag === "function" ? gtag : null;
}

export function setAnalyticsConsentGranted(): void {
  getGtag()?.("consent", "update", {
    analytics_storage: "granted",
  });
}

export function setAnalyticsConsentDenied(): void {
  getGtag()?.("consent", "update", {
    analytics_storage: "denied",
  });

  // Previously transmitted analytics data cannot be removed retroactively by the
  // browser once it has been sent to Google.
}

export function applyStoredAnalyticsConsent(analyticsGranted: boolean): void {
  if (analyticsGranted) {
    setAnalyticsConsentGranted();
    return;
  }

  setAnalyticsConsentDenied();
}
