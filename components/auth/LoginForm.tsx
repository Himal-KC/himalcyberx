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
  signInLearner,
  type LearnerAuthActionState,
} from "@/lib/actions/learner-auth";
import {
  LEARNER_FORGOT_PASSWORD_PATH,
  LEARNER_SIGNUP_PATH,
} from "@/lib/auth/constants";

const INITIAL_STATE: LearnerAuthActionState = {
  success: false,
  message: "",
};

interface LoginFormProps {
  nextPath: string;
  initialMessage?: string;
  initialSuccess?: boolean;
}

export function LoginForm({
  nextPath,
  initialMessage,
  initialSuccess = false,
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInLearner,
    initialMessage
      ? { success: initialSuccess, message: initialMessage }
      : INITIAL_STATE,
  );

  return (
    <form action={formAction} noValidate aria-label="Sign in">
      <input type="hidden" name="next" value={nextPath} />

      {state.message ? <FormStatusMessage state={state} /> : null}

      <div className={`space-y-5 ${state.message ? "mt-5" : ""}`}>
        <div>
          <label htmlFor="learner-email" className={formLabelClass}>
            Email
          </label>
          <input
            id="learner-email"
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
          id="learner-password"
          label="Password"
          autoComplete="current-password"
          disabled={isPending}
          error={state.fieldErrors?.password}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Link href={LEARNER_FORGOT_PASSWORD_PATH} className={authSecondaryLinkClass}>
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={isPending} className={authSubmitClass}>
        {isPending ? "Signing in…" : "Sign In"}
      </button>

      <p className="mt-6 text-center text-sm text-hcx-text-secondary">
        New here?{" "}
        <Link href={LEARNER_SIGNUP_PATH} className={authSecondaryLinkClass}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
