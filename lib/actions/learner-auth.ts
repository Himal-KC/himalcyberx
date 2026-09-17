"use server";

import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/form-types";
import {
  LEARNER_LOGIN_PATH,
  LEARNER_RESET_PASSWORD_PATH,
  MIN_LEARNER_PASSWORD_LENGTH,
} from "@/lib/auth/constants";
import { getAuthCallbackUrl } from "@/lib/auth/callback";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { sanitizeProfileText } from "@/lib/auth/profile-validation";
import {
  logLearnerAuthFailure,
  safeRedirectOrigin,
} from "@/lib/auth/signup-diagnostics";
import {
  buildLearnerSignUpRequest,
  isLearnerPasswordLongEnough,
} from "@/lib/auth/signup";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isValidEmail, normalizeEmail } from "@/lib/form-validation";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import {
  enforceRateLimit,
  isCurrentlyRateLimited,
  recordRateLimitedFailure,
} from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { updateOwnProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export type LearnerAuthActionState = FormActionState;

const GENERIC_LOGIN_ERROR = "Invalid email or password.";
const GENERIC_SIGNUP_ERROR =
  "Unable to create your account. Please try again.";
const CONFIRM_EMAIL_MESSAGE =
  "Check your email for a confirmation link to finish creating your account.";
const RESET_EMAIL_MESSAGE =
  "If an account exists for that email, you will receive password reset instructions.";

function missingConfigState(): LearnerAuthActionState {
  return {
    success: false,
    message: "Authentication is temporarily unavailable. Please try again later.",
  };
}

export async function signUpLearner(
  _prevState: LearnerAuthActionState,
  formData: FormData,
): Promise<LearnerAuthActionState> {
  if (!hasSupabaseEnv()) {
    return missingConfigState();
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const displayName = sanitizeProfileText(String(formData.get("displayName") ?? ""), 80);
  const nextPath = getSafeRedirectPath(formData.get("next"));

  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  if (!isLearnerPasswordLongEnough(password)) {
    return {
      success: false,
      message: `Password must be at least ${MIN_LEARNER_PASSWORD_LENGTH} characters.`,
      fieldErrors: {
        password: `Password must be at least ${MIN_LEARNER_PASSWORD_LENGTH} characters.`,
      },
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
      fieldErrors: { confirmPassword: "Passwords do not match." },
    };
  }

  const clientIp = await getClientIp();
  if (!(await enforceRateLimit("learner-signup", clientIp))) {
    return { success: false, message: RATE_LIMIT_MESSAGES.learnerSignup };
  }

  const supabase = await createClient();
  const emailRedirectTo = getAuthCallbackUrl(nextPath);
  const request = buildLearnerSignUpRequest({
    email,
    password,
    displayName,
    emailRedirectTo,
  });

  const { data, error } = await supabase.auth.signUp(request);

  if (error) {
    logLearnerAuthFailure("signUp", error, {
      redirectOrigin: safeRedirectOrigin(emailRedirectTo),
      siteUrlOrigin: safeRedirectOrigin(getSiteUrl()),
      hasDisplayName: Boolean(displayName),
    });
    return { success: false, message: GENERIC_SIGNUP_ERROR };
  }

  const identities = data.user?.identities;
  if (data.user && Array.isArray(identities) && identities.length === 0) {
    return {
      success: true,
      message: CONFIRM_EMAIL_MESSAGE,
    };
  }

  if (!data.session) {
    return {
      success: true,
      message: CONFIRM_EMAIL_MESSAGE,
    };
  }

  if (displayName && data.user) {
    await updateOwnProfile(supabase, data.user.id, {
      display_name: displayName,
    });
  }

  redirect(nextPath);
}

export async function signInLearner(
  _prevState: LearnerAuthActionState,
  formData: FormData,
): Promise<LearnerAuthActionState> {
  if (!hasSupabaseEnv()) {
    return missingConfigState();
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeRedirectPath(formData.get("next"));

  if (!email || !password) {
    return {
      success: false,
      message: "Please enter your email and password.",
    };
  }

  const clientIp = await getClientIp();
  if (await isCurrentlyRateLimited("learner-login", clientIp)) {
    return { success: false, message: RATE_LIMIT_MESSAGES.learnerLogin };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await recordRateLimitedFailure("learner-login", clientIp);

    const lowered = error.message.toLowerCase();
    if (lowered.includes("email not confirmed")) {
      return {
        success: false,
        message: "Please confirm your email address before signing in.",
      };
    }

    return { success: false, message: GENERIC_LOGIN_ERROR };
  }

  redirect(nextPath);
}

export async function signOutLearner() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function requestLearnerPasswordReset(
  _prevState: LearnerAuthActionState,
  formData: FormData,
): Promise<LearnerAuthActionState> {
  if (!hasSupabaseEnv()) {
    return missingConfigState();
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  const clientIp = await getClientIp();
  if (!(await enforceRateLimit("learner-password-reset", clientIp))) {
    return {
      success: false,
      message: RATE_LIMIT_MESSAGES.learnerPasswordReset,
    };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(LEARNER_RESET_PASSWORD_PATH),
  });

  return {
    success: true,
    message: RESET_EMAIL_MESSAGE,
  };
}

export async function updateLearnerPassword(
  _prevState: LearnerAuthActionState,
  formData: FormData,
): Promise<LearnerAuthActionState> {
  if (!hasSupabaseEnv()) {
    return missingConfigState();
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!isLearnerPasswordLongEnough(password)) {
    return {
      success: false,
      message: `Password must be at least ${MIN_LEARNER_PASSWORD_LENGTH} characters.`,
      fieldErrors: {
        password: `Password must be at least ${MIN_LEARNER_PASSWORD_LENGTH} characters.`,
      },
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
      fieldErrors: { confirmPassword: "Passwords do not match." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      success: false,
      message: "Unable to update your password. Please request a new reset link.",
    };
  }

  await supabase.auth.signOut();
  redirect(`${LEARNER_LOGIN_PATH}?reset=success`);
}
