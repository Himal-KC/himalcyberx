import "server-only";

import {
  extractPromotableStatementsFromSources,
} from "@/lib/agent/research/discovery-context";
import type { CveVerificationResult } from "@/lib/agent/research/cve";
import type { KevEntry, KevLookupResult } from "@/lib/agent/research/cisa-kev";
import {
  deduplicateStatements,
  extractCleanStatements,
  isCompleteSentence,
} from "@/lib/agent/research/source-text";
import type {
  ClaimSourceRef,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
  VerifiedClaimConfidence,
  VerifiedClaimType,
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

function addVerifiedClaim(
  verifiedClaims: VerifiedClaim[],
  sourceClaimMap: Map<string, string[]>,
  claim: {
    type: VerifiedClaimType;
    statement: string;
    sources: ClaimSourceRef[];
    confidence: VerifiedClaimConfidence;
  },
): void {
  const duplicate = verifiedClaims.some(
    (existing) =>
      existing.type === claim.type &&
      existing.statement.toLowerCase() === claim.statement.toLowerCase(),
  );

  if (duplicate) {
    return;
  }

  const id = nextClaimId("verified");
  verifiedClaims.push({
    id,
    type: claim.type,
    statement: claim.statement,
    sources: claim.sources,
    confidence: claim.confidence,
  });

  for (const ref of claim.sources) {
    const existing = sourceClaimMap.get(ref.url) ?? [];
    if (!existing.includes(claim.statement)) {
      existing.push(claim.statement);
      sourceClaimMap.set(ref.url, existing);
    }
  }
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
  unpromotedDiscoveryCount: number;
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

    addVerifiedClaim(verifiedClaims, sourceClaimMap, {
      type: "cve_id",
      statement: `${cveId} is recorded in the NIST National Vulnerability Database.`,
      sources: [nvdRef],
      confidence: "high",
    });

    if (record.description) {
      const descriptionStatements = extractCleanStatements(record.description);
      const description =
        descriptionStatements[0] ??
        (isCompleteSentence(record.description) ? record.description : null);

      if (description) {
        addVerifiedClaim(verifiedClaims, sourceClaimMap, {
          type: "general",
          statement: description,
          sources: [nvdRef],
          confidence: "high",
        });
      }
    }

    if (record.published) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "disclosure_date",
        statement: `NVD lists ${cveId} with a published date of ${record.published}.`,
        sources: [nvdRef],
        confidence: "high",
      });
    }

    if (record.cvssScore) {
      const severitySuffix = record.cvssSeverity
        ? ` (${record.cvssSeverity})`
        : "";
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "cvss",
        statement: `NVD records a CVSS base score of ${record.cvssScore}${severitySuffix} for ${cveId}.`,
        sources: [nvdRef],
        confidence: "high",
      });
    }

    if (record.cvssVector) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "cvss",
        statement: `NVD records CVSS vector ${record.cvssVector} for ${cveId}.`,
        sources: [nvdRef],
        confidence: "high",
      });
    }

    if (record.affectedProducts.length > 0) {
      const products = record.affectedProducts
        .slice(0, 3)
        .map(formatCpeProduct)
        .join("; ");

      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "affected_product",
        statement: `NVD associates ${cveId} with affected product/configuration entries including ${products}.`,
        sources: [nvdRef],
        confidence: "high",
      });
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

    addVerifiedClaim(verifiedClaims, sourceClaimMap, {
      type: "exploitation_status",
      statement: `${cveId} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
      sources: [kevRef],
      confidence: "high",
    });

    if (entry.requiredAction && isCompleteSentence(entry.requiredAction)) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "mitigation",
        statement: entry.requiredAction,
        sources: [kevRef],
        confidence: "high",
      });
    } else if (entry.requiredAction) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "mitigation",
        statement: `CISA KEV lists the following required action for ${cveId}: ${entry.requiredAction}`,
        sources: [kevRef],
        confidence: "high",
      });
    }

    if (entry.dateAdded) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "disclosure_date",
        statement: `CISA added ${cveId} to the Known Exploited Vulnerabilities catalog on ${entry.dateAdded}.`,
        sources: [kevRef],
        confidence: "high",
      });
    }

    if (entry.vendorProject || entry.product) {
      addVerifiedClaim(verifiedClaims, sourceClaimMap, {
        type: "affected_product",
        statement: `CISA KEV identifies the affected product as ${[entry.vendorProject, entry.product].filter(Boolean).join(" — ")}.`,
        sources: [kevRef],
        confidence: "high",
      });
    }
  }

  const promotable = extractPromotableStatementsFromSources(sources);
  const uniqueStatements = deduplicateStatements(
    promotable.map((item) => item.statement),
  );

  let promotedFromDiscovery = 0;
  for (const statement of uniqueStatements.slice(0, 5)) {
    const match = promotable.find((item) => item.statement === statement);
    if (!match) {
      continue;
    }

    addVerifiedClaim(verifiedClaims, sourceClaimMap, {
      type: "guidance",
      statement,
      sources: [sourceToRef(match.source)],
      confidence:
        match.source.sourceType === "official" ? "high" : "medium",
    });
    promotedFromDiscovery += 1;
  }

  const sourcesWithDiscovery = sources.filter((source) => source.discoveryContext);
  const unpromotedDiscoveryCount = Math.max(
    0,
    sourcesWithDiscovery.length - promotedFromDiscovery,
  );

  if (
    sourcesWithDiscovery.length > 0 &&
    promotedFromDiscovery === 0 &&
    cveResults.length === 0
  ) {
    uncertainClaims.push({
      id: nextClaimId("uncertain"),
      label: "Discovery context",
      reason:
        "Authoritative sources were found, but their excerpts could not be promoted to verified claims without inference.",
    });
  }

  return {
    verifiedClaims,
    uncertainClaims,
    sourceClaimMap,
    unpromotedDiscoveryCount,
  };
}

export function applyClaimLabelsToSources(
  sources: ResearchSource[],
  sourceClaimMap: Map<string, string[]>,
): ResearchSource[] {
  return sources.map((source) => ({
    ...source,
    supportsClaims: sourceClaimMap.get(source.url) ?? null,
  }));
}
