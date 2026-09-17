import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAllowedAuthCallbackCode,
  resolveAuthRedirectUrl,
} from "@/lib/auth/callback";
import { LEARNER_LOGIN_PATH } from "@/lib/auth/constants";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

const AUTH_ERROR_PATH = `${LEARNER_LOGIN_PATH}?error=auth`;

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(resolveAuthRedirectUrl(request.url, path));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (searchParams.get("error")) {
    return redirectTo(request, AUTH_ERROR_PATH);
  }

  const supabase = await createClient();

  if (code) {
    if (!isAllowedAuthCallbackCode(code)) {
      return redirectTo(request, AUTH_ERROR_PATH);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectTo(request, AUTH_ERROR_PATH);
    }

    return redirectTo(request, next);
  }

  if (tokenHash && type) {
    const otpType =
      type === "recovery" ||
      type === "signup" ||
      type === "invite" ||
      type === "magiclink" ||
      type === "email"
        ? type
        : null;

    if (!otpType) {
      return redirectTo(request, AUTH_ERROR_PATH);
    }

    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (error) {
      return redirectTo(request, AUTH_ERROR_PATH);
    }

    return redirectTo(request, next);
  }

  return redirectTo(request, AUTH_ERROR_PATH);
}
