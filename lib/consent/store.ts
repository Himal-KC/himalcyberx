import { readStoredConsent } from "@/lib/consent/storage";

type ConsentListener = () => void;

const listeners = new Set<ConsentListener>();

export interface ConsentSnapshot {
  hasDecided: boolean;
  analytics: boolean;
}

export function subscribeConsent(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitConsentChange(): void {
  listeners.forEach((listener) => listener());
}

export function getConsentSnapshot(): ConsentSnapshot {
  const stored = readStoredConsent();

  return {
    hasDecided: Boolean(stored),
    analytics: stored?.analytics ?? false,
  };
}

export function getServerConsentSnapshot(): ConsentSnapshot {
  return {
    hasDecided: false,
    analytics: false,
  };
}
