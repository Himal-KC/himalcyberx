import type { User } from "@supabase/supabase-js";

/** JWT app_metadata.role value for HCX CMS / Agent administrators. */
export const HCX_ADMIN_ROLE = "hcx_admin" as const;

/**
 * Optional single-admin email allowlist (application-layer defense in depth).
 * Set HCX_ADMIN_EMAIL in production to require a matching email in addition to
 * app_metadata.role. Does not replace database RLS.
 */
export function getConfiguredAdminEmail(): string | null {
  const email = process.env.HCX_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function readAppMetadataRole(
  user: { app_metadata?: Record<string, unknown> } | null | undefined,
): string | null {
  const role = user?.app_metadata?.role;
  return typeof role === "string" && role.trim() ? role.trim() : null;
}

export function hasHcxAdminRole(
  user: { app_metadata?: Record<string, unknown> } | null | undefined,
): boolean {
  return readAppMetadataRole(user) === HCX_ADMIN_ROLE;
}

/**
 * Application-layer admin authorization. Requires JWT app_metadata.role = hcx_admin.
 * When HCX_ADMIN_EMAIL is configured, the signed-in email must also match.
 */
export function isAllowedAdminUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
}): boolean {
  if (!hasHcxAdminRole(user)) {
    return false;
  }

  const allowedEmail = getConfiguredAdminEmail();
  if (!allowedEmail) {
    return true;
  }

  const userEmail = user.email?.trim().toLowerCase();
  return Boolean(userEmail && userEmail === allowedEmail);
}

export function isAllowedAdminSession(user: User | null): user is User {
  return Boolean(user && isAllowedAdminUser(user));
}

/** Simulates a future learner account (authenticated, not admin). */
export function isLearnerSession(user: User | null): boolean {
  return Boolean(user && !hasHcxAdminRole(user));
}
