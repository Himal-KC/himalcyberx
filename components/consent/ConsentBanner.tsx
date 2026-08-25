"use client";

import Link from "next/link";
import { useConsent } from "@/components/consent/ConsentProvider";
import { focusRing } from "@/lib/page-data";

const buttonPrimaryClass = `inline-flex min-h-11 items-center justify-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`;

const buttonSecondaryClass = `inline-flex min-h-11 items-center justify-center rounded-lg border border-hcx-border bg-hcx-card px-4 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`;

export function ConsentBanner() {
  const { bannerVisible, acceptAnalytics, rejectNonEssential, openPreferences } =
    useConsent();

  if (!bannerVisible) {
    return null;
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hcx-border bg-hcx-bg-secondary/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-sm font-semibold text-hcx-text">Privacy choices</h2>
          <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
            HimalCyberX uses essential functionality to operate the site. Optional
            Google Analytics helps us understand how public pages are used. You
            can accept analytics, reject non-essential cookies, or manage your
            preferences. See our{" "}
            <Link href="/privacy" className={`text-hcx-cyan hover:underline ${focusRing}`}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <button type="button" onClick={rejectNonEssential} className={buttonSecondaryClass}>
            Reject Non-Essential
          </button>
          <button type="button" onClick={openPreferences} className={buttonSecondaryClass}>
            Manage Preferences
          </button>
          <button type="button" onClick={acceptAnalytics} className={buttonPrimaryClass}>
            Accept Analytics
          </button>
        </div>
      </div>
    </section>
  );
}
