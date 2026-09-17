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

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAdminAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAllowedAdminUser(user)) {
    redirect("/admin/login?error=unauthorized");
  }

  return user;
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  const email = user?.email;

  if (typeof email !== "string" || !email) {
    return null;
  }

  return email;
}
