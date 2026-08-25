"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { consentCategories } from "@/lib/consent/categories";
import { focusRing } from "@/lib/page-data";

const buttonPrimaryClass = `inline-flex min-h-11 items-center justify-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`;

const buttonSecondaryClass = `inline-flex min-h-11 items-center justify-center rounded-lg border border-hcx-border bg-hcx-bg-secondary px-4 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`;

interface ConsentPreferencesPanelProps {
  initialAnalytics: boolean;
  onClose: () => void;
  onSave: (analytics: boolean) => void;
  onAcceptAnalytics: () => void;
  onRejectNonEssential: () => void;
}

function ConsentPreferencesPanel({
  initialAnalytics,
  onClose,
  onSave,
  onAcceptAnalytics,
  onRejectNonEssential,
}: ConsentPreferencesPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialAnalytics);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close cookie preferences"
        className="absolute inset-0 bg-hcx-bg/70"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl outline-none sm:p-8"
      >
        <h2 id={titleId} className="text-lg font-semibold text-hcx-text">
          Cookie Preferences
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
          Choose which optional technologies may be used. Essential functionality
          remains active so the site can operate.
        </p>

        <div className="mt-6 space-y-4">
          {consentCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border border-hcx-border bg-hcx-bg-secondary/50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-hcx-text">
                    {category.label}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-hcx-text-secondary">
                    {category.description}
                  </p>
                </div>

                {category.required ? (
                  <span className="shrink-0 rounded-full border border-hcx-border px-2.5 py-1 text-xs font-medium text-hcx-text-secondary">
                    Always active
                  </span>
                ) : (
                  <label className="inline-flex shrink-0 items-center gap-2 text-sm text-hcx-text">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                      className="h-4 w-4 rounded border-hcx-border bg-hcx-bg text-hcx-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan"
                    />
                    <span className="sr-only">Enable analytics cookies</span>
                    <span aria-hidden="true">{analyticsEnabled ? "On" : "Off"}</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => onSave(analyticsEnabled)}
            className={buttonPrimaryClass}
          >
            Save Preferences
          </button>
          <button type="button" onClick={onAcceptAnalytics} className={buttonSecondaryClass}>
            Accept Analytics
          </button>
          <button type="button" onClick={onRejectNonEssential} className={buttonSecondaryClass}>
            Reject Non-Essential
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentPreferences() {
  const {
    preferencesOpen,
    analyticsGranted,
    closePreferences,
    savePreferences,
    acceptAnalytics,
    rejectNonEssential,
  } = useConsent();

  if (!preferencesOpen) {
    return null;
  }

  return (
    <ConsentPreferencesPanel
      key={`${analyticsGranted}-${preferencesOpen}`}
      initialAnalytics={analyticsGranted}
      onClose={closePreferences}
      onSave={savePreferences}
      onAcceptAnalytics={acceptAnalytics}
      onRejectNonEssential={rejectNonEssential}
    />
  );
}
