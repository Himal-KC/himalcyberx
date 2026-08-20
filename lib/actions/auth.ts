"use server";

import { redirect } from "next/navigation";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import {
  isCurrentlyRateLimited,
  recordRateLimitedFailure,
} from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import { isAllowedAdminUser } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const clientIp = await getClientIp();
  if (await isCurrentlyRateLimited("admin-login", clientIp)) {
    return { error: RATE_LIMIT_MESSAGES.adminLogin };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await recordRateLimitedFailure("admin-login", clientIp);
    return { error: "Invalid email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdminUser(user ?? {})) {
    await supabase.auth.signOut();
    await recordRateLimitedFailure("admin-login", clientIp);
    return { error: "You are not authorized to access HCX Admin." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
