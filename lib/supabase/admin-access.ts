import type { User } from "@supabase/supabase-js";

/**
 * Optional single-admin allowlist.
 * Set HCX_ADMIN_EMAIL in production to restrict portal access to one account.
 * When unset, any authenticated Supabase user may access admin routes (RLS still applies).
 */
export function getConfiguredAdminEmail(): string | null {
  const email = process.env.HCX_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAllowedAdminUser(user: {
  email?: string | null;
}): boolean {
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
