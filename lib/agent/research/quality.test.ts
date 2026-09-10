import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const { evaluateResearchQuality } = (await import(
  pathToFileURL(join(testDir, "evaluate-research-quality.ts")).href
)) as typeof import("./evaluate-research-quality");

const officialSource = {
  url: "https://www.cisa.gov/stopransomware",
  title: "StopRansomware",
  publisher: "CISA",
  sourceType: "official" as const,
  discoveryContext: "Search excerpt only.",
  verifiedClaims: [] as string[],
};

const pageBackedClaim = (
  statement: string,
  type: "preparedness" | "cve_id" = "preparedness",
  relevanceLevel: "high" | "medium" = "high",
) => ({
  id: `verified-${statement.slice(0, 8)}`,
  type,
  statement,
  sources: [{ url: officialSource.url, title: officialSource.title }],
  confidence: "high" as const,
  relevanceLevel,
  relevanceScore: relevanceLevel === "high" ? 75 : 50,
});

describe("research quality gate", () => {
  it("returns needs_review when authoritative page fetch failed", () => {
    const quality = evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [
        pageBackedClaim(
          "CISA and the FBI maintain the #StopRansomware initiative for network defenders.",
        ),
        pageBackedClaim(
          "The guide includes preparation, prevention, mitigation and response guidance for organizations.",
        ),
      ],
      uncertainClaims: [],
      cveResults: [],
      researchConfidence: "medium",
      unpromotedDiscoveryCount: 1,
      pageBackedClaimCount: 2,
      highRelevanceClaimCount: 2,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 1,
      topicHasCve: false,
    });

    assert.equal(quality, "needs_review");
  });

  it("keeps NVD structured CVE verification behavior unchanged", () => {
    const quality = evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [
        {
          id: "verified-cve",
          type: "cve_id",
          statement: "CVE-2024-21412 is recorded in the NIST National Vulnerability Database.",
          sources: [
            {
              url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
              title: "NVD — CVE-2024-21412",
            },
          ],
          confidence: "high",
          relevanceLevel: "high",
          relevanceScore: 85,
        },
        {
          id: "verified-cvss",
          type: "cvss",
          statement: "CVE-2024-21412 has a CVSS 3.1 base score of 8.1 (High).",
          sources: [
            {
              url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
              title: "NVD — CVE-2024-21412",
            },
          ],
          confidence: "high",
          relevanceLevel: "high",
          relevanceScore: 85,
        },
      ],
      uncertainClaims: [],
      cveResults: [
        {
          cveId: "CVE-2024-21412",
          status: "verified",
          record: null,
        },
      ],
      researchConfidence: "high",
      unpromotedDiscoveryCount: 0,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 2,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 0,
      topicHasCve: true,
    });

    assert.equal(quality, "passed");
  });
});
