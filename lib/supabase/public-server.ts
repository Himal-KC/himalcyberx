import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Dedicated public Supabase client for unauthenticated form submissions.
 *
 * Uses only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 * Does not read auth cookies or attach any existing admin session.
 */
export function createPublicServerClient() {
  const { url, key } = getSupabaseEnv();

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** @deprecated Use createPublicServerClient */
export const createAnonServerClient = createPublicServerClient;
