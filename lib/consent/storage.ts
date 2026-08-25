import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/consent/constants";
import type { ConsentPreferences } from "@/lib/consent/types";

function isConsentPreferences(value: unknown): value is ConsentPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ConsentPreferences>;
  return (
    record.version === CONSENT_VERSION &&
    typeof record.analytics === "boolean" &&
    typeof record.decidedAt === "string"
  );
}

export function readStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isConsentPreferences(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredConsent(analytics: boolean): ConsentPreferences {
  const preferences: ConsentPreferences = {
    version: CONSENT_VERSION,
    analytics,
    decidedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  return preferences;
}
