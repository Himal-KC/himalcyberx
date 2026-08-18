import { redirect } from "next/navigation";
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

  // TODO: Add role-based authorization (e.g. admin role in app_metadata or a
  // profiles table). Authentication alone is sufficient for portal access at
  // this stage — do not trust email alone as authorization long term.
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
