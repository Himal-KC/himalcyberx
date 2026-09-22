import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};
