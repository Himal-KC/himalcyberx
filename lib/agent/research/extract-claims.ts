import "server-only";

import type { CveVerificationResult } from "@/lib/agent/research/cve";
import type { KevEntry, KevLookupResult } from "@/lib/agent/research/cisa-kev";
import type {
  ClaimSourceRef,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
} from "@/lib/agent/types";

let claimCounter = 0;

function nextClaimId(prefix: string): string {
  claimCounter += 1;
  return `${prefix}-${claimCounter}`;
}

function nvdSourceRef(cveId: string): ClaimSourceRef {
  return {
    url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
    title: `NVD — ${cveId}`,
    publisher: "NIST NVD",
  };
}

function kevSourceRef(cveId: string): ClaimSourceRef {
  return {
    url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    title: `CISA KEV — ${cveId}`,
    publisher: "CISA",
  };
}

function sourceToRef(source: ResearchSource): ClaimSourceRef {
  return {
    url: source.url,
    title: source.title,
    publisher: source.publisher ?? null,
  };
}

function formatCpeProduct(cpe: string): string {
  const parts = cpe.split(":");
  if (parts.length >= 5) {
    const vendor = parts[3] || "unknown vendor";
    const product = parts[4] || "unknown product";
    return `${vendor} ${product}`;
  }

  return cpe;
}

export interface ClaimExtractionInput {
  topic: string;
  sources: ResearchSource[];
  cveResults: CveVerificationResult[];
  kevLookups: Array<{ cveId: string; result: KevLookupResult }>;
}

export interface ClaimExtractionOutput {
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  sourceClaimMap: Map<string, string[]>;
}

export function extractClaims({
  sources,
  cveResults,
  kevLookups,
}: ClaimExtractionInput): ClaimExtractionOutput {
  claimCounter = 0;
  const verifiedClaims: VerifiedClaim[] = [];
  const uncertainClaims: UncertainClaim[] = [];
  const sourceClaimMap = new Map<string, string[]>();

  function attachClaimToSources(claimLabel: string, refs: ClaimSourceRef[]) {
    for (const ref of refs) {
      const existing = sourceClaimMap.get(ref.url) ?? [];
      if (!existing.includes(claimLabel)) {
        existing.push(claimLabel);
        sourceClaimMap.set(ref.url, existing);
      }
    }
  }

  for (const cveResult of cveResults) {
    const { cveId, status, record } = cveResult;

    if (status === "not_found") {
      uncertainClaims.push({
        id: nextClaimId("uncertain"),
        label: cveId,
        reason: `${cveId} was not found in NVD and cannot be treated as verified.`,
      });
      continue;
    }

    if (status === "unavailable") {
      uncertainClaims.push({
        id: nextClaimId("uncertain"),
        label: cveId,
        reason: `${cveId} could not be verified because NVD is temporarily unavailable.`,
      });
      continue;
    }

    if (!record) {
      continue;
    }

    const nvdRef = nvdSourceRef(cveId);

    verifiedClaims.push({
      id: nextClaimId("verified"),
      label: "CVE ID",
      value: cveId,
      field: "cve_id",
      sources: [nvdRef],
    });
    attachClaimToSources(cveId, [nvdRef]);

    if (record.description) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Vulnerability description",
        value: record.description,
        field: "general",
        sources: [nvdRef],
      });
      attachClaimToSources("Vulnerability description", [nvdRef]);
    }

    if (record.published) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Disclosure date",
        value: record.published,
        field: "disclosure_date",
        sources: [nvdRef],
      });
      attachClaimToSources("Disclosure date", [nvdRef]);
    }

    if (record.cvssScore) {
      const severitySuffix = record.cvssSeverity
        ? ` (${record.cvssSeverity})`
        : "";
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "CVSS score",
        value: `${record.cvssScore}${severitySuffix}`,
        field: "cvss",
        sources: [nvdRef],
      });
      attachClaimToSources("CVSS score", [nvdRef]);
    }

    if (record.cvssVector) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "CVSS vector",
        value: record.cvssVector,
        field: "cvss",
        sources: [nvdRef],
      });
      attachClaimToSources("CVSS vector", [nvdRef]);
    }

    if (record.affectedProducts.length > 0) {
      const products = record.affectedProducts
        .slice(0, 5)
        .map(formatCpeProduct)
        .join("; ");

      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Affected product/configuration",
        value: products,
        field: "affected_product",
        sources: [nvdRef],
      });
      attachClaimToSources("Affected product/configuration", [nvdRef]);

      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Affected versions/configuration (CPE)",
        value: record.affectedProducts.slice(0, 5).join("; "),
        field: "affected_versions",
        sources: [nvdRef],
      });
      attachClaimToSources("Affected versions/configuration (CPE)", [nvdRef]);
    }
  }

  for (const { cveId, result } of kevLookups) {
    if (result.status === "unavailable") {
      uncertainClaims.push({
        id: nextClaimId("uncertain"),
        label: `${cveId} exploitation status`,
        reason:
          "CISA Known Exploited Vulnerabilities catalog was temporarily unavailable.",
      });
      continue;
    }

    if (result.status === "not_found") {
      uncertainClaims.push({
        id: nextClaimId("uncertain"),
        label: `${cveId} exploitation status`,
        reason: `${cveId} is not listed in the CISA KEV catalog at this time.`,
        partialValue: "Not listed in CISA KEV",
      });
      continue;
    }

    const entry = result.entry as KevEntry;
    const kevRef = kevSourceRef(cveId);

    verifiedClaims.push({
      id: nextClaimId("verified"),
      label: "Exploitation status",
      value: `${cveId} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
      field: "exploitation_status",
      sources: [kevRef],
    });
    attachClaimToSources("Exploitation status", [kevRef]);

    if (entry.requiredAction) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Mitigation / required action",
        value: entry.requiredAction,
        field: "mitigation",
        sources: [kevRef],
      });
      attachClaimToSources("Mitigation / required action", [kevRef]);
    }

    if (entry.dateAdded) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "CISA KEV date added",
        value: entry.dateAdded,
        field: "disclosure_date",
        sources: [kevRef],
      });
      attachClaimToSources("CISA KEV date added", [kevRef]);
    }

    if (entry.vendorProject || entry.product) {
      verifiedClaims.push({
        id: nextClaimId("verified"),
        label: "Affected product (CISA KEV)",
        value: [entry.vendorProject, entry.product].filter(Boolean).join(" — "),
        field: "affected_product",
        sources: [kevRef],
      });
      attachClaimToSources("Affected product (CISA KEV)", [kevRef]);
    }
  }

  for (const source of sources) {
    const ref = sourceToRef(source);
    const snippet = source.supportsClaims?.join(" ").trim();
    if (!snippet) {
      continue;
    }

    verifiedClaims.push({
      id: nextClaimId("verified"),
      label: "Source-supported context",
      value: snippet.slice(0, 500),
      field: "general",
      sources: [ref],
    });
    attachClaimToSources("Source-supported context", [ref]);
  }

  return {
    verifiedClaims,
    uncertainClaims,
    sourceClaimMap,
  };
}

export function applyClaimLabelsToSources(
  sources: ResearchSource[],
  sourceClaimMap: Map<string, string[]>,
): ResearchSource[] {
  return sources.map((source) => ({
    ...source,
    supportsClaims: sourceClaimMap.get(source.url) ?? source.supportsClaims ?? null,
  }));
}
