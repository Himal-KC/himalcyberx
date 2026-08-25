import { readStoredConsent } from "@/lib/consent/storage";

type ConsentListener = () => void;

const listeners = new Set<ConsentListener>();

export interface ConsentSnapshot {
  hasDecided: boolean;
  analytics: boolean;
}

const SERVER_CONSENT_SNAPSHOT: ConsentSnapshot = {
  hasDecided: false,
  analytics: false,
};

let cachedClientSnapshot: ConsentSnapshot = SERVER_CONSENT_SNAPSHOT;

function buildConsentSnapshot(): ConsentSnapshot {
  const stored = readStoredConsent();

  return {
    hasDecided: Boolean(stored),
    analytics: stored?.analytics ?? false,
  };
}

function snapshotsEqual(
  left: ConsentSnapshot,
  right: ConsentSnapshot,
): boolean {
  return left.hasDecided === right.hasDecided && left.analytics === right.analytics;
}

export function subscribeConsent(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitConsentChange(): void {
  const nextSnapshot = buildConsentSnapshot();

  if (!snapshotsEqual(cachedClientSnapshot, nextSnapshot)) {
    cachedClientSnapshot = nextSnapshot;
  }

  listeners.forEach((listener) => listener());
}

/**
 * Must return a referentially stable object while underlying consent values are
 * unchanged. useSyncExternalStore compares snapshots with Object.is.
 */
export function getConsentSnapshot(): ConsentSnapshot {
  const nextSnapshot = buildConsentSnapshot();

  if (snapshotsEqual(cachedClientSnapshot, nextSnapshot)) {
    return cachedClientSnapshot;
  }

  cachedClientSnapshot = nextSnapshot;
  return cachedClientSnapshot;
}

export function getServerConsentSnapshot(): ConsentSnapshot {
  return SERVER_CONSENT_SNAPSHOT;
}
