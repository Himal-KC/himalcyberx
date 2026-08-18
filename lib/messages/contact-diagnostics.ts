import { isDevelopment } from "@/lib/supabase/admin-session";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { createClient } from "@/lib/supabase/server";

export async function logPublicContactDiagnostics(scope: string): Promise<void> {
  if (!isDevelopment()) {
    return;
  }

  const publicClient = createPublicServerClient();
  const cookieClient = await createClient();

  const [publicAuth, cookieAuth] = await Promise.all([
    publicClient.auth.getUser(),
    cookieClient.auth.getUser(),
  ]);

  console.info(`[${scope}:diagnostics]`, {
    publicClientHasAuthenticatedUser: Boolean(publicAuth.data.user),
    publicClientUserId: publicAuth.data.user?.id ?? null,
    cookieClientHasAuthenticatedUser: Boolean(cookieAuth.data.user),
    cookieClientUserId: cookieAuth.data.user?.id ?? null,
    expectedInsertRole: "anon",
    note: "Public contact inserts must use the public client without admin session cookies.",
  });
}
