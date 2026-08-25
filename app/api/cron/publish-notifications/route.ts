import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";
import { runScheduledContentNotificationCron } from "@/lib/notifications/scheduled-content-cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runScheduledContentNotificationCron();
  return NextResponse.json(summary);
}
