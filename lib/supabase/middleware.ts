import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  LEARNER_FORGOT_PASSWORD_PATH,
  LEARNER_LOGIN_PATH,
  LEARNER_PROFILE_PATH,
  LEARNER_SIGNUP_PATH,
} from "@/lib/auth/constants";
import { buildLoginRedirectPath, getSafeRedirectPath } from "@/lib/auth/redirects";
import { isAllowedAdminUser } from "@/lib/supabase/admin-access";

function isLearnerAuthPage(pathname: string): boolean {
  return (
    pathname === LEARNER_LOGIN_PATH ||
    pathname === LEARNER_SIGNUP_PATH ||
    pathname === LEARNER_FORGOT_PASSWORD_PATH
  );
}

function isLearnerProtectedPath(pathname: string): boolean {
  return (
    pathname === LEARNER_PROFILE_PATH || pathname.startsWith(`${LEARNER_PROFILE_PATH}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const isAuthorizedAdmin = isAuthenticated && isAllowedAdminUser(user ?? {});

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !isLoginPage && (!isAuthenticated || !isAuthorizedAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (isAuthenticated && !isAuthorizedAdmin) {
      url.searchParams.set("error", "unauthorized");
    }
    return NextResponse.redirect(url);
  }

  if (isLoginPage && isAuthorizedAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isLearnerProtectedPath(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = LEARNER_LOGIN_PATH;
    url.search = "";
    const loginPath = buildLoginRedirectPath(pathname);
    const loginUrl = new URL(loginPath, request.nextUrl.origin);
    url.search = loginUrl.search;
    return NextResponse.redirect(url);
  }

  if (isLearnerAuthPage(pathname) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
