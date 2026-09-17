import { MIN_LEARNER_PASSWORD_LENGTH } from "./constants.ts";

export interface LearnerSignUpInput {
  email: string;
  password: string;
  displayName?: string | null;
  emailRedirectTo: string;
}

export interface LearnerSignUpRequest {
  email: string;
  password: string;
  options: {
    emailRedirectTo: string;
    data: Record<string, string>;
  };
}

/**
 * Builds a Supabase signUp payload for ordinary learner accounts.
 * Never sets app_metadata or any admin role.
 */
export function buildLearnerSignUpRequest(
  input: LearnerSignUpInput,
): LearnerSignUpRequest {
  const data: Record<string, string> = {};
  const displayName = input.displayName?.trim();
  if (displayName) {
    data.display_name = displayName;
  }

  return {
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      data,
    },
  };
}

export function learnerSignUpAssignsAdminRole(
  request: LearnerSignUpRequest,
): boolean {
  const serialized = JSON.stringify(request);
  return (
    serialized.includes("app_metadata") ||
    serialized.includes("hcx_admin") ||
    Object.prototype.hasOwnProperty.call(request.options, "app_metadata")
  );
}

export function isLearnerPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_LEARNER_PASSWORD_LENGTH;
}
