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
  AuthPasswordField,
  authSecondaryLinkClass,
  authSubmitClass,
} from "@/components/auth/AuthPasswordField";
import {
  signUpLearner,
  type LearnerAuthActionState,
} from "@/lib/actions/learner-auth";
import {
  LEARNER_LOGIN_PATH,
  MIN_LEARNER_PASSWORD_LENGTH,
} from "@/lib/auth/constants";

const INITIAL_STATE: LearnerAuthActionState = {
  success: false,
  message: "",
};

interface SignupFormProps {
  nextPath: string;
}

export function SignupForm({ nextPath }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    signUpLearner,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} noValidate aria-label="Create account">
      <input type="hidden" name="next" value={nextPath} />

      {state.message ? (
        <FormStatusMessage
          state={state}
          successTitle={state.success ? "Check your email" : undefined}
        />
      ) : null}

      {!state.success ? (
        <>
          <div className={`space-y-5 ${state.message ? "mt-5" : ""}`}>
            <div>
              <label htmlFor="signup-display-name" className={formLabelClass}>
                Display name
              </label>
              <input
                id="signup-display-name"
                name="displayName"
                type="text"
                maxLength={80}
                autoComplete="nickname"
                disabled={isPending}
                className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              <p className="mt-1.5 text-xs text-hcx-text-secondary">
                Shown on your profile. Do not use your email address.
              </p>
            </div>

            <div>
              <label htmlFor="signup-email" className={formLabelClass}>
                Email
              </label>
              <input
                id="signup-email"
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

            <AuthPasswordField
              id="signup-password"
              label="Password"
              autoComplete="new-password"
              disabled={isPending}
              minLength={MIN_LEARNER_PASSWORD_LENGTH}
              error={state.fieldErrors?.password}
            />

            <AuthPasswordField
              id="signup-confirm-password"
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              disabled={isPending}
              minLength={MIN_LEARNER_PASSWORD_LENGTH}
              error={state.fieldErrors?.confirmPassword}
            />
          </div>

          <button type="submit" disabled={isPending} className={authSubmitClass}>
            {isPending ? "Creating account…" : "Create Account"}
          </button>
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-hcx-text-secondary">
        Already have an account?{" "}
        <Link href={LEARNER_LOGIN_PATH} className={authSecondaryLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
