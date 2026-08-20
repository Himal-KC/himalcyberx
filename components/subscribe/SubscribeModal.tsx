"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { CloseIcon } from "@/components/icons";
import {
  FormStatusMessage,
  HoneypotField,
  formInputClass,
} from "@/components/forms/form-ui";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { INITIAL_FORM_STATE } from "@/lib/form-types";
import { focusRing, iconButtonClass } from "@/lib/page-data";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletter,
    INITIAL_FORM_STATE,
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isPending, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={() => !isPending && onClose()}
    >
      <button
        type="button"
        className="absolute inset-0 bg-hcx-bg/80 backdrop-blur-sm"
        aria-label="Close subscribe modal"
        onClick={() => !isPending && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-title"
        className="relative w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-hcx-border px-5 py-4">
          <div>
            <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
              Newsletter
            </p>
            <h2
              id="subscribe-modal-title"
              className="mt-1 text-lg font-semibold text-hcx-text"
            >
              Subscribe to HimalCyberX
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={`${iconButtonClass} text-hcx-text-secondary transition-colors hover:bg-hcx-bg-secondary hover:text-hcx-cyan disabled:opacity-60`}
            aria-label="Close subscribe modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          {state.success ? (
            <FormStatusMessage state={state} />
          ) : (
            <form action={formAction} aria-label="Newsletter signup">
              <HoneypotField />
              <input type="hidden" name="source" value="modal" />

              <label htmlFor="subscribe-modal-email" className="sr-only">
                Email address
              </label>
              <input
                id="subscribe-modal-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.email)}
                className={`${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {state.fieldErrors?.email && (
                <p className="mt-1.5 text-sm text-hcx-red" role="alert">
                  {state.fieldErrors.email}
                </p>
              )}

              {!state.success && state.message && !state.fieldErrors?.email && (
                <div className="mt-3">
                  <FormStatusMessage state={state} />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className={`mt-4 w-full rounded-lg bg-hcx-cyan px-4 py-3 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_24px_rgba(0,217,255,0.25)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                {isPending ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs leading-relaxed text-hcx-text-secondary">
            No spam. Unsubscribe anytime. We only use your email for HimalCyberX
            security updates.{" "}
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
  );
}
