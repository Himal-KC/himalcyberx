"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContactForm } from "@/lib/actions/contact";
import { INITIAL_FORM_STATE } from "@/lib/form-types";
import {
  FormStatusMessage,
  HoneypotField,
  formErrorClass,
  formInputClass,
  formLabelClass,
} from "@/components/forms/form-ui";
import { focusRing } from "@/lib/page-data";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    INITIAL_FORM_STATE,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="relative rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8"
      aria-label="Contact form"
    >
      <HoneypotField />

      {state.success ? (
        <FormStatusMessage state={state} />
      ) : (
        <>
          <div className="space-y-5">
            <div>
              <label htmlFor="contact-name" className={formLabelClass}>
                Full Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.name)}
                aria-describedby={
                  state.fieldErrors?.name ? "contact-name-error" : undefined
                }
                className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {state.fieldErrors?.name && (
                <p id="contact-name-error" className={formErrorClass} role="alert">
                  {state.fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className={formLabelClass}>
                Email Address
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={
                  state.fieldErrors?.email ? "contact-email-error" : undefined
                }
                className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {state.fieldErrors?.email && (
                <p id="contact-email-error" className={formErrorClass} role="alert">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-subject" className={formLabelClass}>
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                minLength={4}
                autoComplete="off"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.subject)}
                aria-describedby={
                  state.fieldErrors?.subject
                    ? "contact-subject-error"
                    : undefined
                }
                className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {state.fieldErrors?.subject && (
                <p id="contact-subject-error" className={formErrorClass} role="alert">
                  {state.fieldErrors.subject}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-message" className={formLabelClass}>
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                minLength={20}
                maxLength={2000}
                rows={6}
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.message)}
                aria-describedby={
                  state.fieldErrors?.message
                    ? "contact-message-error"
                    : undefined
                }
                className={`mt-2 resize-y ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {state.fieldErrors?.message && (
                <p id="contact-message-error" className={formErrorClass} role="alert">
                  {state.fieldErrors.message}
                </p>
              )}
            </div>
          </div>

          {!state.success && state.message && (
            <div className="mt-5">
              <FormStatusMessage state={state} />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={`mt-6 w-full rounded-lg bg-hcx-cyan px-6 py-3 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${focusRing}`}
          >
            {isPending ? "Sending..." : "Send Message"}
          </button>
        </>
      )}
    </form>
  );
}
