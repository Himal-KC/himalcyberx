/** Bump when consent categories or behaviour change materially to re-prompt visitors. */
export const CONSENT_VERSION = 1;

export const CONSENT_STORAGE_KEY = "hcx-consent-preferences";

/**
 * Reserved for a future advertising category when AdSense is introduced.
 * EEA/UK/CH advertising consent must then use a Google-certified CMP /
 * Google Privacy & Messaging — not this first-party analytics UI alone.
 */
export const CONSENT_CATEGORY_ADVERTISING = "advertising" as const;
