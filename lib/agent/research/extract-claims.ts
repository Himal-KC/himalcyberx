import "server-only";

import { classifyWebClaimType } from "@/lib/agent/research/claim-classifier";
import type { CveVerificationResult } from "@/lib/agent/research/cve";
import type { KevEntry, KevLookupResult } from "@/lib/agent/research/cisa-kev";
import type { FetchedSourcePage } from "@/lib/agent/research/fetch-source";
import {
  deduplicateStatements,
  extractCleanStatements,
  isCompleteSentence,
  statementExistsInSourceText,
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
  fetchedPages: Map<string, FetchedSourcePage>;
  cveResults: CveVerificationResult[];
  kevLookups: Array<{ cveId: string; result: KevLookupResult }>;
}

export interface ClaimExtractionOutput {
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  sourceClaimMap: Map<string, string[]>;
  unpromotedDiscoveryCount: number;
  pageBackedClaimCount: number;
  successfulPageFetchCount: number;
  failedPageFetchCount: number;
}

function extractPageBackedClaims(
  sources: ResearchSource[],
  fetchedPages: Map<string, FetchedSourcePage>,
): Array<{ statement: string; source: ResearchSource; type: VerifiedClaimType }> {
  const promotable: Array<{
    statement: string;
    source: ResearchSource;
    type: VerifiedClaimType;
  }> = [];

  for (const source of sources) {
    const fetched = fetchedPages.get(source.url);
    if (!fetched || fetched.status !== "ok" || !fetched.text) {
      continue;
    }

    const statements = extractCleanStatements(fetched.text);
    for (const statement of statements.slice(0, 3)) {
      if (!statementExistsInSourceText(statement, fetched.text)) {
        continue;
      }

      promotable.push({
        statement,
        source,
        type: classifyWebClaimType(statement),
      });
    }
  }

  return promotable;
}

export function extractClaims({
  sources,
  fetchedPages,
  cveResults,
  kevLookups,
}: ClaimExtractionInput): ClaimExtractionOutput {
  claimCounter = 0;
  const verifiedClaims: VerifiedClaim[] = [];
  const uncertainClaims: UncertainClaim[] = [];
  const sourceClaimMap = new Map<string, string[]>();

  let successfulPageFetchCount = 0;
  let failedPageFetchCount = 0;

  for (const source of sources) {
    const fetched = fetchedPages.get(source.url);
    if (!fetched) {
      continue;
    }

    if (fetched.status === "ok") {
      successfulPageFetchCount += 1;
    } else if (fetched.status !== "not_authoritative") {
      failedPageFetchCount += 1;
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

  const promotable = extractPageBackedClaims(sources, fetchedPages);
  const uniqueStatements = deduplicateStatements(
    promotable.map((item) => item.statement),
  );

  let pageBackedClaimCount = 0;
  for (const statement of uniqueStatements.slice(0, 7)) {
    const match = promotable.find((item) => item.statement === statement);
    if (!match) {
      continue;
    }

    addVerifiedClaim(verifiedClaims, sourceClaimMap, {
      type: match.type,
      statement,
      sources: [sourceToRef(match.source)],
      confidence:
        match.source.sourceType === "official" ? "high" : "medium",
    });
    pageBackedClaimCount += 1;
  }

  const sourcesWithDiscovery = sources.filter((source) => source.discoveryContext);
  const unpromotedDiscoveryCount = Math.max(
    0,
    sourcesWithDiscovery.length - pageBackedClaimCount,
  );

  if (failedPageFetchCount > 0 && cveResults.length === 0) {
    uncertainClaims.push({
      id: nextClaimId("uncertain"),
      label: "Source page evidence",
      reason:
        "One or more authoritative source pages could not be fetched for deterministic claim extraction.",
    });
  }

  if (
    sourcesWithDiscovery.length > 0 &&
    pageBackedClaimCount === 0 &&
    cveResults.length === 0
  ) {
    uncertainClaims.push({
      id: nextClaimId("uncertain"),
      label: "Source page evidence",
      reason:
        "Authoritative sources were discovered, but no clean verified claims could be extracted from fetched page content.",
    });
  }

  return {
    verifiedClaims,
    uncertainClaims,
    sourceClaimMap,
    unpromotedDiscoveryCount,
    pageBackedClaimCount,
    successfulPageFetchCount,
    failedPageFetchCount,
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
