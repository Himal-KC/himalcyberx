"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyStoredAnalyticsConsent,
  setAnalyticsConsentDenied,
  setAnalyticsConsentGranted,
} from "@/lib/consent/google-consent";
import {
  emitConsentChange,
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
} from "@/lib/consent/store";
import { writeStoredConsent } from "@/lib/consent/storage";

interface ConsentContextValue {
  isReady: boolean;
  analyticsGranted: boolean;
  bannerVisible: boolean;
  preferencesOpen: boolean;
  acceptAnalytics: () => void;
  rejectNonEssential: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
  savePreferences: (analytics: boolean) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }

  return context;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

interface ConsentProviderProps {
  children: ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const isClient = useIsClient();
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    applyStoredAnalyticsConsent(consent.analytics);
  }, [consent.analytics, isClient]);

  const persistAnalyticsChoice = useCallback((analytics: boolean) => {
    writeStoredConsent(analytics);
    emitConsentChange();

    if (analytics) {
      setAnalyticsConsentGranted();
    } else {
      setAnalyticsConsentDenied();
    }
  }, []);

  const acceptAnalytics = useCallback(() => {
    persistAnalyticsChoice(true);
    setPreferencesOpen(false);
  }, [persistAnalyticsChoice]);

  const rejectNonEssential = useCallback(() => {
    persistAnalyticsChoice(false);
    setPreferencesOpen(false);
  }, [persistAnalyticsChoice]);

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setPreferencesOpen(false);
  }, []);

  const savePreferences = useCallback(
    (analytics: boolean) => {
      persistAnalyticsChoice(analytics);
      setPreferencesOpen(false);
    },
    [persistAnalyticsChoice],
  );

  const value = useMemo(
    () => ({
      isReady: isClient,
      analyticsGranted: consent.analytics,
      bannerVisible: isClient && !consent.hasDecided,
      preferencesOpen,
      acceptAnalytics,
      rejectNonEssential,
      openPreferences,
      closePreferences,
      savePreferences,
    }),
    [
      isClient,
      consent.analytics,
      consent.hasDecided,
      preferencesOpen,
      acceptAnalytics,
      rejectNonEssential,
      openPreferences,
      closePreferences,
      savePreferences,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}
