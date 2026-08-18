import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { isAllowedAdminUser } from "@/lib/supabase/admin-access";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface AdminAuthDebugDetails {
  hasUser: boolean;
  userId?: string;
  authErrorMessage?: string;
  dbErrorCode?: string;
  dbErrorMessage?: string;
  dbErrorDetails?: string;
  dbErrorHint?: string;
  getClaimsHasSub?: boolean;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function logAdminAuthDebug(
  scope: string,
  details: AdminAuthDebugDetails,
): void {
  console.info(`[admin-auth:${scope}]`, {
    hasUser: details.hasUser,
    userId: details.userId ?? null,
    getClaimsHasSub: details.getClaimsHasSub ?? null,
    authError: details.authErrorMessage ?? null,
    dbErrorCode: details.dbErrorCode ?? null,
    dbErrorMessage: details.dbErrorMessage ?? null,
    dbErrorDetails: details.dbErrorDetails ?? null,
    dbErrorHint: details.dbErrorHint ?? null,
  });
}

export interface SafeDbError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export function logSafeDbError(
  scope: string,
  userId: string | undefined,
  error: SafeDbError,
): void {
  logAdminAuthDebug(scope, {
    hasUser: Boolean(userId),
    userId,
    dbErrorCode: error.code,
    dbErrorMessage: error.message,
    dbErrorDetails: error.details,
    dbErrorHint: error.hint,
  });
}

export function formatDevErrorMessage(
  error: SafeDbError,
  fallback: string,
): string {
  if (!isDevelopment()) {
    return fallback;
  }

  const parts = [
    error.code ? `[${error.code}]` : null,
    error.message,
    error.details ? `Details: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

export type AuthenticatedServerClientResult =
  | {
      ok: true;
      supabase: SupabaseServerClient;
      user: User;
    }
  | {
      ok: false;
      error: string;
      authErrorMessage?: string;
    };

export async function getAuthenticatedServerClient(
  scope: string,
  options?: { getClaimsHasSub?: boolean },
): Promise<AuthenticatedServerClientResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  logAdminAuthDebug(scope, {
    hasUser: Boolean(user),
    userId: user?.id,
    authErrorMessage: authError?.message,
    getClaimsHasSub: options?.getClaimsHasSub,
  });

  if (authError || !user) {
    return {
      ok: false,
      error: "Authenticated Supabase session not found on server.",
      authErrorMessage: authError?.message,
    };
  }

  if (!isAllowedAdminUser(user)) {
    return {
      ok: false,
      error: "You are not authorized to perform this admin action.",
    };
  }

  return { ok: true, supabase, user };
}
