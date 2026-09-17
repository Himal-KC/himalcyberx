"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormStatusMessage } from "@/components/forms/form-ui";
import {
  AuthPasswordField,
  authSecondaryLinkClass,
  authSubmitClass,
} from "@/components/auth/AuthPasswordField";
import {
  updateLearnerPassword,
  type LearnerAuthActionState,
} from "@/lib/actions/learner-auth";
import {
  LEARNER_FORGOT_PASSWORD_PATH,
  MIN_LEARNER_PASSWORD_LENGTH,
} from "@/lib/auth/constants";

const INITIAL_STATE: LearnerAuthActionState = {
  success: false,
  message: "",
};

interface ResetPasswordFormProps {
  hasSession: boolean;
}

export function ResetPasswordForm({ hasSession }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateLearnerPassword,
    INITIAL_STATE,
  );

  if (!hasSession) {
    return (
      <div>
        <FormStatusMessage
          state={{
            success: false,
            message:
              "This reset link is invalid or has expired. Request a new password reset email.",
          }}
        />
        <p className="mt-6 text-center text-sm text-hcx-text-secondary">
          <Link href={LEARNER_FORGOT_PASSWORD_PATH} className={authSecondaryLinkClass}>
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate aria-label="Set a new password">
      {state.message ? <FormStatusMessage state={state} /> : null}

      <div className={`space-y-5 ${state.message ? "mt-5" : ""}`}>
        <AuthPasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          disabled={isPending}
          minLength={MIN_LEARNER_PASSWORD_LENGTH}
          error={state.fieldErrors?.password}
        />
        <AuthPasswordField
          id="reset-confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          disabled={isPending}
          minLength={MIN_LEARNER_PASSWORD_LENGTH}
          error={state.fieldErrors?.confirmPassword}
        />
      </div>

      <button type="submit" disabled={isPending} className={authSubmitClass}>
        {isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
