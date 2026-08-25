"use client";

import { ConsentAwareGoogleAnalytics } from "@/components/consent/ConsentAwareGoogleAnalytics";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ConsentPreferences } from "@/components/consent/ConsentPreferences";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import type { ReactNode } from "react";

interface ConsentRootProps {
  children: ReactNode;
}

export function ConsentRoot({ children }: ConsentRootProps) {
  return (
    <ConsentProvider>
      {children}
      <ConsentBanner />
      <ConsentPreferences />
      <ConsentAwareGoogleAnalytics />
    </ConsentProvider>
  );
}
