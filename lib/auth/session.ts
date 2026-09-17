import { redirect } from "next/navigation";
import { LEARNER_PROFILE_PATH } from "@/lib/auth/constants";
import { buildLoginRedirectPath } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function getLearnerSessionUser() {
  return getAuthenticatedUser();
}

export async function requireLearnerSession(
  nextPath = LEARNER_PROFILE_PATH,
) {
  const user = await getLearnerSessionUser();

  if (!user) {
    redirect(buildLoginRedirectPath(nextPath));
  }

  return user;
}

export async function getLearnerServerClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "Please sign in to continue." };
  }

  return { ok: true as const, supabase, user };
}
