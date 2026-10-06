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

const SUBJECTS = [
  "The evidence",
  "Available evidence",
  "Current research",
  "The advisory",
  "CISA",
  "NVD",
  "The sources",
  "The report",
  "The assessment",
  "Available documentation",
];

const PREDICATES = [
  "does not define",
  "does not identify",
  "does not specify",
  "does not establish",
  "cannot confirm",
  "does not clarify",
  "does not list",
  "does not determine",
];

const OBJECTS = [
  "which versions are affected",
  "which releases are affected",
  "whether other products are affected",
  "whether additional platforms are affected",
  "which configurations are affected",
  "whether deployments are affected",
];

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
    sources: [{ url: "https://www.cisa.gov/kev", title: "KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

const COMBINATIONS: string[] = [];
for (const subject of SUBJECTS) {
  for (const predicate of PREDICATES) {
    for (const object of OBJECTS) {
      COMBINATIONS.push(`${subject} ${predicate} ${object}.`);
    }
  }
}

describe("deterministic fuzz corpus", () => {
  const catalog = buildVerifiedProductCatalog(VERIFIED);
  const context = {
    researchCveIds: new Set([CVE]),
    approvedInternalCves: new Set<string>(),
    approvedInternalContent: new Map(),
    verifiedProductCatalog: catalog,
  };

  it(`runs ${COMBINATIONS.length} combinations with zero unsupported product facts`, () => {
    assert.equal(COMBINATIONS.length, 480);

    for (const sentence of COMBINATIONS) {
      const facts = extractDraftFacts(`${CVE}. ${sentence}`, context).filter(
        (fact) => fact.type === "affected_product",
      );
      assert.equal(facts.length, 0, `${sentence} -> ${facts.map((f) => f.value).join(", ")}`);
    }
  });
});
