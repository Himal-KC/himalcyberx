"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { INITIAL_FORM_STATE } from "@/lib/form-types";
import {
  FormStatusMessage,
  HoneypotField,
  formInputClass,
} from "@/components/forms/form-ui";
import { focusRing } from "@/lib/page-data";

export function FooterNewsletter() {
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletter,
    INITIAL_FORM_STATE,
  );

  return (
    <div className="rounded-xl border border-hcx-border bg-hcx-card/60 p-5 sm:p-6">
      <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        Stay informed.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
        Receive new cybersecurity research, threat intelligence and practical
        learning updates.
      </p>

      {state.success ? (
        <div className="mt-4">
          <FormStatusMessage state={state} />
        </div>
      ) : (
        <form action={formAction} className="mt-4" aria-label="Footer newsletter signup">
          <HoneypotField />
          <input type="hidden" name="source" value="newsletter" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                disabled={isPending}
                className={`${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className={`shrink-0 rounded-lg bg-hcx-cyan px-5 py-3 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {isPending ? "Subscribing..." : "Subscribe"}
            </button>
          </div>

          {!state.success && state.message && (
            <div className="mt-3">
              <FormStatusMessage state={state} />
            </div>
          )}
        </form>
      )}

      <p className="mt-3 text-xs text-hcx-text-secondary">
        <Link
          href="/privacy"
          className={`text-hcx-cyan hover:underline ${focusRing}`}
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
