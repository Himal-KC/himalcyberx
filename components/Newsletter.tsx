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

export function Newsletter() {
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletter,
    INITIAL_FORM_STATE,
  );

  return (
    <section
      id="newsletter"
      className="py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-hcx-border bg-hcx-card">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,217,255,0.06), transparent)",
            }}
          />

          <div className="relative grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
                Newsletter
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-hcx-text md:text-4xl">
                Stay Ahead of the Threat
              </h2>
              <p className="mt-4 text-hcx-text-secondary leading-relaxed">
                Weekly cybersecurity intelligence, research and practical
                security guides.
              </p>
            </div>

            <div>
              {state.success ? (
                <FormStatusMessage state={state} />
              ) : (
                <form action={formAction} aria-label="Newsletter signup">
                  <HoneypotField />
                  <input type="hidden" name="source" value="newsletter" />

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="newsletter-email"
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
                      className={`shrink-0 rounded-lg bg-hcx-cyan px-6 py-3 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_24px_rgba(0,217,255,0.25)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
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

              <p className="mt-4 text-xs text-hcx-text-secondary">
                No spam. Unsubscribe anytime.{" "}
                <Link
                  href="/privacy"
                  className={`text-hcx-cyan hover:underline ${focusRing}`}
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
