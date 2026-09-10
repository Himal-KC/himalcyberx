import "server-only";

import { getNvdApiKey } from "@/lib/agent/research/env";

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/gi;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const REQUEST_TIMEOUT_MS = 15_000;

export type CveVerificationStatus =
  | "verified"
  | "not_found"
  | "unavailable";

export interface NvdCveRecord {
  cveId: string;
  description: string | null;
  published: string | null;
  lastModified: string | null;
  cvssScore: string | null;
  cvssSeverity: string | null;
  cvssVector: string | null;
  affectedProducts: string[];
  references: Array<{ url: string; source: string | null }>;
}

export interface CveVerificationResult {
  cveId: string;
  status: CveVerificationStatus;
  record: NvdCveRecord | null;
}

function normalizeCveId(value: string): string {
  return value.toUpperCase();
}

export function extractCveIds(text: string): string[] {
  const matches = text.match(CVE_PATTERN) ?? [];
  const unique = new Set(matches.map(normalizeCveId));
  return [...unique];
}

function parseNvdRecord(cveId: string, payload: unknown): NvdCveRecord | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as {
    vulnerabilities?: Array<{
      cve?: {
        id?: string;
        descriptions?: Array<{ lang?: string; value?: string }>;
        published?: string;
        lastModified?: string;
        metrics?: {
          cvssMetricV31?: Array<{
            cvssData?: { baseScore?: number; baseSeverity?: string; vectorString?: string };
          }>;
          cvssMetricV30?: Array<{
            cvssData?: { baseScore?: number; baseSeverity?: string; vectorString?: string };
          }>;
          cvssMetricV2?: Array<{
            cvssData?: { baseScore?: number; vectorString?: string };
          }>;
        };
        configurations?: Array<{
          nodes?: Array<{
            cpeMatch?: Array<{ criteria?: string; vulnerable?: boolean }>;
          }>;
        }>;
        references?: Array<{ url?: string; source?: string }>;
      };
    }>;
  };

  const cve = root.vulnerabilities?.[0]?.cve;
  if (!cve || normalizeCveId(cve.id ?? "") !== cveId) {
    return null;
  }

  const englishDescription =
    cve.descriptions?.find((item) => item.lang === "en")?.value?.trim() ??
    cve.descriptions?.[0]?.value?.trim() ??
    null;

  const cvss31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const cvss30 = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
  const cvss2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
  const cvss = cvss31 ?? cvss30 ?? cvss2;

  const affectedProducts = new Set<string>();
  for (const configuration of cve.configurations ?? []) {
    for (const node of configuration.nodes ?? []) {
      for (const match of node.cpeMatch ?? []) {
        if (match.vulnerable && match.criteria) {
          affectedProducts.add(match.criteria);
        }
      }
    }
  }

  const references = (cve.references ?? [])
    .filter((ref) => ref.url)
    .map((ref) => ({
      url: ref.url as string,
      source: ref.source?.trim() || null,
    }));

  return {
    cveId,
    description: englishDescription,
    published: cve.published ?? null,
    lastModified: cve.lastModified ?? null,
    cvssScore:
      cvss?.baseScore !== undefined && cvss?.baseScore !== null
        ? String(cvss.baseScore)
        : null,
    cvssSeverity:
      "baseSeverity" in (cvss ?? {})
        ? ((cvss as { baseSeverity?: string }).baseSeverity ?? null)
        : null,
    cvssVector: cvss?.vectorString ?? null,
    affectedProducts: [...affectedProducts],
    references,
  };
}

export async function verifyCveWithNvd(
  cveId: string,
): Promise<CveVerificationResult> {
  const normalizedId = normalizeCveId(cveId);
  const apiKey = getNvdApiKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (apiKey) {
      headers.apiKey = apiKey;
    }

    const response = await fetch(
      `${NVD_BASE_URL}?cveId=${encodeURIComponent(normalizedId)}`,
      {
        method: "GET",
        headers,
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return { cveId: normalizedId, status: "not_found", record: null };
    }

    if (!response.ok) {
      return { cveId: normalizedId, status: "unavailable", record: null };
    }

    const payload = await response.json();
    const totalResults =
      typeof payload === "object" &&
      payload !== null &&
      "totalResults" in payload
        ? Number((payload as { totalResults?: number }).totalResults)
        : 0;

    if (!totalResults) {
      return { cveId: normalizedId, status: "not_found", record: null };
    }

    const record = parseNvdRecord(normalizedId, payload);
    if (!record) {
      return { cveId: normalizedId, status: "not_found", record: null };
    }

    return { cveId: normalizedId, status: "verified", record };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { cveId: normalizedId, status: "unavailable", record: null };
    }

    return { cveId: normalizedId, status: "unavailable", record: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyCvesInTopic(
  topic: string,
): Promise<CveVerificationResult[]> {
  const cveIds = extractCveIds(topic);
  const results: CveVerificationResult[] = [];

  for (const cveId of cveIds) {
    results.push(await verifyCveWithNvd(cveId));
  }

  return results;
}
