import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS for tightly scoped trusted server operations (e.g. token-verified unsubscribe).
 * Never import this module from client components.
 */
export function hasServiceRoleEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function createServiceServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Supabase service role environment is not configured.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
