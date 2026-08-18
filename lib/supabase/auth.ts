import { redirect } from "next/navigation";
import { isAllowedAdminUser } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

export async function getAuthClaims() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims;
}

export async function requireAdminAuth() {
  const claims = await getAuthClaims();

  if (!claims) {
    redirect("/admin/login");
  }

  if (!isAllowedAdminUser({ email: claims.email as string | undefined })) {
    redirect("/admin/login?error=unauthorized");
  }

  return claims;
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const claims = await getAuthClaims();
  const email = claims?.email;

  if (typeof email !== "string" || !email) {
    return null;
  }

  return email;
}
