import "server-only";

const KEV_FEED_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const REQUEST_TIMEOUT_MS = 15_000;

export interface KevEntry {
  cveId: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
  cwes: string[];
}

interface KevCache {
  fetchedAt: number;
  entries: Map<string, KevEntry>;
}

let cache: KevCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

function normalizeCveId(value: string): string {
  return value.toUpperCase();
}

function parseKevFeed(payload: unknown): Map<string, KevEntry> {
  const entries = new Map<string, KevEntry>();

  if (!payload || typeof payload !== "object") {
    return entries;
  }

  const vulnerabilities = (payload as { vulnerabilities?: unknown[] })
    .vulnerabilities;

  if (!Array.isArray(vulnerabilities)) {
    return entries;
  }

  for (const item of vulnerabilities) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Record<string, unknown>;
    const cveId = normalizeCveId(String(row.cveID ?? ""));
    if (!cveId.startsWith("CVE-")) {
      continue;
    }

    entries.set(cveId, {
      cveId,
      vendorProject: String(row.vendorProject ?? "").trim(),
      product: String(row.product ?? "").trim(),
      vulnerabilityName: String(row.vulnerabilityName ?? "").trim(),
      dateAdded: String(row.dateAdded ?? "").trim(),
      shortDescription: String(row.shortDescription ?? "").trim(),
      requiredAction: String(row.requiredAction ?? "").trim(),
      dueDate: String(row.dueDate ?? "").trim(),
      knownRansomwareCampaignUse: String(
        row.knownRansomwareCampaignUse ?? "",
      ).trim(),
      notes: String(row.notes ?? "").trim(),
      cwes: Array.isArray(row.cwes)
        ? row.cwes.map((value) => String(value).trim()).filter(Boolean)
        : [],
    });
  }

  return entries;
}

export type KevLookupStatus = "found" | "not_found" | "unavailable";

export interface KevLookupResult {
  status: KevLookupStatus;
  entry: KevEntry | null;
}

async function loadKevEntries(): Promise<Map<string, KevEntry> | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.entries;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(KEV_FEED_URL, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const entries = parseKevFeed(payload);
    cache = { fetchedAt: now, entries };
    return entries;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupKevEntry(cveId: string): Promise<KevLookupResult> {
  const normalizedId = normalizeCveId(cveId);
  const entries = await loadKevEntries();

  if (!entries) {
    return { status: "unavailable", entry: null };
  }

  const entry = entries.get(normalizedId) ?? null;
  if (!entry) {
    return { status: "not_found", entry: null };
  }

  return { status: "found", entry };
}
