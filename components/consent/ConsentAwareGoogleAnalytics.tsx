"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { getGaMeasurementId } from "@/lib/analytics/ga";
import { useConsent } from "@/components/consent/ConsentProvider";

export function ConsentAwareGoogleAnalytics() {
  const pathname = usePathname();
  const { analyticsGranted, isReady } = useConsent();
  const measurementId = getGaMeasurementId();

  if (!isReady || !measurementId || !analyticsGranted || pathname.startsWith("/admin")) {
    return null;
  }

  return <GoogleAnalytics gaId={measurementId} />;
}
