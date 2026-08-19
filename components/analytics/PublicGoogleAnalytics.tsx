"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { getGaMeasurementId } from "@/lib/analytics/ga";

export function PublicGoogleAnalytics() {
  const pathname = usePathname();
  const gaId = getGaMeasurementId();

  if (!gaId || pathname.startsWith("/admin")) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
