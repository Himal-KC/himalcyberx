import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { extractDraftFacts, buildVerifiedProductCatalog } = (await import(
  pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
)) as typeof import("./grounding-audit-core");

const CVE = "CVE-2026-88771";

const VERIFIED: VerifiedClaim[] = [
  {
    id: "topic",
    type: "exploitation_status",
    statement: `${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: "https://www.cisa.gov/kev", title: "KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "product",
    type: "affected_product",
    statement: "CISA KEV identifies the affected product as Citrix — NetScaler.",
    sources: [{ url: "https://www.cisa.gov/kev", title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "adc",
    type: "affected_product",
    statement: `NVD associates ${CVE} with affected product/configuration entries including citrix netscaler_application_delivery_controller.`,
    sources: [{ url: "https://nvd.nist.gov/", title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

const CORPUS = [
  "The evidence available here does not define which versions are affected.",
  "The available evidence does not identify which products are affected.",
  "Research does not establish whether other products are affected.",
  "It is unclear which versions are affected.",
  "No additional affected products were identified.",
  "The sources do not specify which releases are affected.",
  "Evidence is insufficient to determine which versions are affected.",
  "We cannot confirm whether other platforms are affected.",
  "The advisory does not list additional affected products.",
  "Available evidence only confirms Citrix NetScaler.",
  "The evidence does not define whether Citrix NetScaler versions are affected.",
  "It remains unknown which releases are affected.",
];

describe("evidence limitation corpus", () => {
  const catalog = buildVerifiedProductCatalog(VERIFIED);
  const context = {
    researchCveIds: new Set([CVE]),
    approvedInternalCves: new Set<string>(),
    approvedInternalContent: new Map(),
    verifiedProductCatalog: catalog,
  };

  for (const [index, sentence] of CORPUS.entries()) {
    it(`case ${index + 1}: no invented product — ${sentence.slice(0, 55)}…`, () => {
      const facts = extractDraftFacts(`${CVE}. ${sentence}`, context).filter(
        (fact) => fact.type === "affected_product",
      );
      assert.equal(
        facts.length,
        0,
        `unexpected: ${facts.map((f) => f.value).join(", ")}`,
      );
    });
  }
});
