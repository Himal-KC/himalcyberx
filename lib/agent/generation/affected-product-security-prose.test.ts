import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding, extractDraftFacts, buildVerifiedProductCatalog } =
  (await import(
    pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
  )) as typeof import("./grounding-audit-core");

const {
  traceAffectedProductExtraction,
  collectHighConfidenceEntityClauses,
} = (await import(
  pathToFileURL(join(testDir, "product-extraction-core.ts")).href
)) as typeof import("./product-extraction-core");

const productGrounding = (await import(
  pathToFileURL(join(testDir, "product-grounding-core.ts")).href
)) as typeof import("./product-grounding-core");

const CVE = "CVE-2026-88771";

function topicClaim(): VerifiedClaim {
  return {
    id: "cve-topic",
    type: "exploitation_status",
    statement: `${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: "https://www.cisa.gov/kev", title: "KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  };
}

function productClaims(products: string): VerifiedClaim[] {
  return [
    topicClaim(),
    {
      id: "product",
      type: "affected_product",
      statement: `CISA KEV identifies the affected product as ${products}.`,
      sources: [{ url: "https://www.cisa.gov/kev", title: "KEV" }],
      confidence: "high",
      relevanceLevel: "high",
    },
    {
      id: "nvd-product",
      type: "affected_product",
      statement: `NVD associates ${CVE} with affected product/configuration entries including citrix netscaler_application_delivery_controller.`,
      sources: [{ url: "https://nvd.nist.gov/", title: "NVD" }],
      confidence: "high",
      relevanceLevel: "high",
    },
  ];
}

function facts(sentence: string, claims: VerifiedClaim[]) {
  const catalog = buildVerifiedProductCatalog(claims);
  return extractDraftFacts(`${CVE}. ${sentence}`, {
    researchCveIds: new Set([CVE]),
    approvedInternalCves: new Set(),
    approvedInternalContent: new Map(),
    verifiedProductCatalog: catalog,
  }).filter((fact) => fact.type === "affected_product");
}

type Expectation = "none" | "unsupported";

const SECURITY_PROSE: Array<{ sentence: string; expect: Expectation }> = [
  { sentence: "The vulnerability impacts confidentiality, integrity and availability.", expect: "none" },
  { sentence: "This issue has high impact across confidentiality and integrity.", expect: "none" },
  { sentence: "The flaw affects availability for remote services.", expect: "none" },
  { sentence: "Impact is rated critical with scope unchanged.", expect: "none" },
  { sentence: "Scope remains unchanged while user interaction is required.", expect: "none" },
  { sentence: "The attack impacts confidentiality through memory disclosure.", expect: "none" },
  { sentence: "Exploitation affects internet-facing organizations first.", expect: "none" },
  { sentence: "The advisory impacts customers running default configurations.", expect: "none" },
  { sentence: "This vulnerability affects deployments worldwide.", expect: "none" },
  { sentence: "The bug impacts vulnerable environments with weak segmentation.", expect: "none" },
  { sentence: "Affected versions range from 14.1-12.35 through 14.1-47.46.", expect: "none" },
  { sentence: "Affected version ranges are documented in the vendor bulletin.", expect: "none" },
  { sentence: "Version range affects only maintenance releases.", expect: "none" },
  { sentence: "Supported releases include long-term support branches.", expect: "none" },
  { sentence: "The issue affects remediation priorities for security teams.", expect: "none" },
  { sentence: "Exploitation impacts patching decisions this quarter.", expect: "none" },
  { sentence: "The advisory affects mitigation planning for edge deployments.", expect: "none" },
  { sentence: "The affected product ranges are described below.", expect: "none" },
  { sentence: "Affected product guidance is available from CISA.", expect: "none" },
  { sentence: "Affected product information is maintained by the vendor.", expect: "none" },
  { sentence: "NVD lists affected configurations without naming additional products.", expect: "none" },
  { sentence: "CISA KEV affects remediation deadlines for federal agencies.", expect: "none" },
  { sentence: "KEV inclusion impacts prioritization for patch teams.", expect: "none" },
  { sentence: "## Affected Products", expect: "none" },
  { sentence: "## Impact", expect: "none" },
  { sentence: "Confidentiality Impact: High", expect: "none" },
  { sentence: "References include vendor and government advisories.", expect: "none" },
  { sentence: "Mitigation Guidance should be applied immediately.", expect: "none" },
  { sentence: `${CVE} may impact operations if left unpatched.`, expect: "none" },
  { sentence: `${CVE} impacts security posture for perimeter appliances.`, expect: "none" },
  { sentence: "Risk impacts users with administrative access.", expect: "none" },
  { sentence: "Systems across confidentiality domains remain exposed.", expect: "none" },
  { sentence: "High impact across confidentiality, integrity and availability was confirmed.", expect: "none" },
  { sentence: "The CVSS vector indicates impacts across confidentiality and integrity.", expect: "none" },
  { sentence: "Impact across confidentiality remains the primary concern.", expect: "none" },
  { sentence: "effects across confidentiality, integrity and availability are noted in NVD.", expect: "none" },
  { sentence: "The vulnerability impact across confidentiality should be reviewed.", expect: "none" },
  { sentence: "impacts across confidentiality are reflected in the base score.", expect: "none" },
  { sentence: "This weakness affects systems that expose management interfaces.", expect: "none" },
  { sentence: "The issue impacts products only indirectly through shared libraries.", expect: "none" },
  { sentence: "Affected product families are informational in this summary.", expect: "none" },
  { sentence: "Affected product entries include version notes only.", expect: "none" },
  { sentence: "Affected product remediation requires vendor guidance.", expect: "none" },
  { sentence: "Affected product patching should follow change control.", expect: "none" },
  { sentence: "Affected product mitigation depends on network architecture.", expect: "none" },
  { sentence: "Affected product details appear in the official record.", expect: "none" },
  { sentence: "Affected product list updates are published separately.", expect: "none" },
  { sentence: "Affected product category metadata is not authoritative.", expect: "none" },
  { sentence: "Affected product version ranges for this CVE are vendor-maintained.", expect: "none" },
  { sentence: "Affected versions of supported platforms are listed separately.", expect: "none" },
  { sentence: `${CVE} affects organizations that delay patching.`, expect: "none" },
  { sentence: `${CVE} impacts environments with exposed management planes.`, expect: "none" },
  { sentence: "The flaw affects customers using default credentials.", expect: "none" },
  { sentence: "Microsoft Exchange is affected.", expect: "none" },
  { sentence: "VMware ESXi is also affected.", expect: "none" },
  { sentence: "Citrix NetScaler Gateway is affected.", expect: "unsupported" },
  { sentence: "Affected products include Microsoft Exchange.", expect: "unsupported" },
  { sentence: `${CVE} affects Microsoft Exchange Server.`, expect: "unsupported" },
];

describe("security prose corpus (50+ cases)", () => {
  const claims = productClaims("Citrix — NetScaler");

  for (const [index, entry] of SECURITY_PROSE.entries()) {
    it(`case ${index + 1}: ${entry.sentence.slice(0, 56)}… → ${entry.expect}`, () => {
      const productFacts = facts(entry.sentence, claims);
      if (entry.expect === "none") {
        assert.equal(productFacts.length, 0, productFacts.map((f) => f.value).join(", "));
      } else {
        assert.ok(productFacts.length > 0);
      }
    });
  }

  it("traces production-like across confidentiality failure without emitting facts", () => {
    const sentence =
      "The CVSS assessment shows high impact across confidentiality, integrity and availability for remote exploitation scenarios.";
    const catalog = buildVerifiedProductCatalog(claims);
    const trace = traceAffectedProductExtraction({
      sentence: `${CVE}. ${sentence}`,
      primaryCve: CVE,
      catalog,
    });

    assert.equal(trace.extraction.facts.length, 0);
    assert.equal(trace.extraction.facts.length, 0);
    assert.equal(collectHighConfidenceEntityClauses(sentence).length, 0);
  });
});

describe("empty verified product alias set", () => {
  it("fails closed when explicit product facts exist without verified aliases", () => {
    assert.equal(
      productGrounding.isAffectedProductSupported(
        "Citrix NetScaler",
        new Set(),
      ),
      false,
    );
  });

  it("does not extract ambiguous impact prose without verified catalog", () => {
    const claimsWithoutProduct = [topicClaim()];
    assert.equal(
      facts("impact across confidentiality and integrity", claimsWithoutProduct).length,
      0,
    );
  });
});

describe("verified product positive cases in corpus", () => {
  const claims = productClaims("Citrix — NetScaler");

  it("passes audit for verified Citrix NetScaler assertions", () => {
    for (const sentence of [
      `${CVE} affects Citrix NetScaler ADC.`,
      "Citrix NetScaler is affected.",
      "Affected products include Citrix NetScaler.",
      "CISA identifies the affected product as Citrix NetScaler.",
    ]) {
      const audit = auditGrounding({
        draft: {
          contentType: "article",
          title: "Test",
          slug: "test",
          excerpt: "Test",
          content: `<p>${CVE}. ${sentence}</p>`,
          categoryRecommendation: "Vulnerabilities",
          primaryKeyword: CVE,
          secondaryKeywords: [],
          keyTakeaways: ["Test"],
          seo: {
            seoTitle: "t",
            seoDescription: "t",
            seoKeywords: [CVE],
            ogTitle: "t",
            ogDescription: "t",
          },
          generationPlan: {
            contentAngle: "a",
            audience: "a",
            intent: "a",
            sectionPlan: ["a"],
          },
          sourceMappings: [],
          internalLinks: [],
          warnings: [],
        },
        verifiedClaims: claims,
        allowedSourceUrls: ["https://www.cisa.gov/kev", "https://nvd.nist.gov/"],
        allowedContentIds: new Set(),
      });
      assert.equal(audit.passed, true, `${sentence} -> ${audit.unsupportedClaims.join(", ")}`);
    }
  });
});
