import { headers } from "next/headers";

function normalizeIp(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  const forwarded = normalizeIp(headerList.get("x-forwarded-for"));
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = normalizeIp(headerList.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }

  const vercelForwarded = normalizeIp(headerList.get("x-vercel-forwarded-for"));
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}
