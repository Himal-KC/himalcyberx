"use client";

import { useConsent } from "@/components/consent/ConsentProvider";
import { focusRing } from "@/lib/page-data";

export function CookiePreferencesLink() {
  const { openPreferences } = useConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={`inline-flex min-h-11 items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
    >
      Cookie Preferences
    </button>
  );
}
