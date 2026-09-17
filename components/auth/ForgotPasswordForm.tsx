"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  formErrorClass,
  formInputClass,
  formLabelClass,
  FormStatusMessage,
} from "@/components/forms/form-ui";
import {
  authSecondaryLinkClass,
  authSubmitClass,
} from "@/components/auth/AuthPasswordField";
import {
  requestLearnerPasswordReset,
  type LearnerAuthActionState,
} from "@/lib/actions/learner-auth";
import { LEARNER_LOGIN_PATH } from "@/lib/auth/constants";

const INITIAL_STATE: LearnerAuthActionState = {
  success: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestLearnerPasswordReset,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} noValidate aria-label="Forgot password">
      {state.message ? <FormStatusMessage state={state} /> : null}

      {!state.success ? (
        <>
          <div className={state.message ? "mt-5" : ""}>
            <label htmlFor="forgot-email" className={formLabelClass}>
              Email
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={isPending}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {state.fieldErrors?.email ? (
              <p className={formErrorClass} role="alert">
                {state.fieldErrors.email}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={isPending} className={authSubmitClass}>
            {isPending ? "Sending…" : "Send reset link"}
          </button>
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-hcx-text-secondary">
        Remembered your password?{" "}
        <Link href={LEARNER_LOGIN_PATH} className={authSecondaryLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
