import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "./types";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding, extractDraftFacts, buildVerifiedProductCatalog } =
  (await import(
    pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
  )) as typeof import("./grounding-audit-core");

const { traceAffectedProductExtraction, LEGACY_REVERSE_ARE_AFFECTED_PATTERN } =
  (await import(
    pathToFileURL(join(testDir, "product-extraction-core.ts")).href
  )) as typeof import("./product-extraction-core");

const CVE = "CVE-2026-88771";
const NVD = `https://nvd.nist.gov/vuln/detail/${CVE}`;
const KEV = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";

const PRODUCTION_SENTENCE =
  "The evidence available here does not define which versions are affected, so an asset absent from a first-pass query must not be assumed to be outside scope.";

const VERIFIED: VerifiedClaim[] = [
  {
    id: "cve",
    type: "cve_id",
    statement: `${CVE} is recorded in the NIST National Vulnerability Database.`,
    sources: [{ url: NVD, title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "cvss",
    type: "cvss",
    statement: `NVD records a CVSS base score of 9.8 (Critical) for ${CVE}.`,
    sources: [{ url: NVD, title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "kev",
    type: "exploitation_status",
    statement: `${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: KEV, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "product-kev",
    type: "affected_product",
    statement: "CISA KEV identifies the affected product as Citrix — NetScaler.",
    sources: [{ url: KEV, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "product-nvd",
    type: "affected_product",
    statement: `NVD associates ${CVE} with affected product/configuration entries including citrix netscaler_application_delivery_controller.`,
    sources: [{ url: NVD, title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

function buildProductionStyleDraft(
  overrides: Partial<ArticleGeneratedDraft> = {},
): ArticleGeneratedDraft {
  const inventorySection = [
    "<h2>Affected-product scope: start with validated inventory</h2>",
    `<p>NVD associates ${CVE} with configuration entries for Citrix Netscaler Application Delivery Controller.</p>`,
    "<p>CISA KEV identifies the affected product as Citrix NetScaler.</p>",
    "<p>Use these names, including the common inventory aliases Citrix NetScaler ADC and NetScaler ADC, to search configuration-management databases, cloud inventories, procurement records, and operational ownership records.</p>",
    "<p>Inventory results should be validated against current vendor guidance and the locally installed product and version details.</p>",
    `<p>${PRODUCTION_SENTENCE}</p>`,
  ].join("\n");

  return {
    contentType: "article",
    title: "Citrix NetScaler Security Analysis",
    slug: "citrix-netscaler-security-analysis",
    excerpt: "Production-style inventory and scope guidance.",
    content: [
      `<p>${CVE} has a CVSS base score of 9.8 with severity critical.</p>`,
      `<p>${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.</p>`,
      "<p>The CVSS assessment shows high impact across confidentiality, integrity and availability.</p>",
      inventorySection,
      "<p>The affected product version ranges for this CVE are documented in the vendor bulletin.</p>",
      "<p>Apply vendor mitigation guidance promptly.</p>",
    ].join("\n"),
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: CVE,
    secondaryKeywords: ["Citrix", "NetScaler"],
    keyTakeaways: [
      `${CVE} is listed in CISA KEV.`,
      "Verified affected products include Citrix NetScaler and Citrix NetScaler ADC.",
    ],
    seo: {
      seoTitle: "Citrix NetScaler Security Analysis",
      seoDescription: "Verified analysis.",
      seoKeywords: [CVE],
      ogTitle: "Citrix NetScaler Security Analysis",
      ogDescription: "Verified analysis.",
    },
    generationPlan: {
      contentAngle: "Defender inventory scope",
      audience: "Security teams",
      intent: "Scope validation",
      sectionPlan: ["Inventory", "Scope", "Mitigation"],
    },
    sourceMappings: [
      {
        sectionKey: "severity",
        claim: `NVD records a CVSS base score of 9.8 (Critical) for ${CVE}.`,
        sourceUrls: [NVD],
      },
    ],
    internalLinks: [],
    warnings: [],
    ...overrides,
  };
}

describe("production Vercel failure regression", () => {
  const catalog = buildVerifiedProductCatalog(VERIFIED);

  it("traces the exact production sentence without unsupported product facts", () => {
    const legacyMatch = PRODUCTION_SENTENCE.match(
      LEGACY_REVERSE_ARE_AFFECTED_PATTERN,
    );
    assert.ok(legacyMatch?.[1]?.includes("which versions"));

    const trace = traceAffectedProductExtraction({
      sentence: PRODUCTION_SENTENCE,
      primaryCve: CVE,
      catalog,
    });

    assert.equal(trace.extraction.facts.length, 0);
    assert.equal(
      trace.extraction.diagnostics[0]?.resolution,
      "scope_uncertainty_skipped",
    );
    assert.equal(trace.scopeUncertainty, true);
  });

  it("passes complete auditGrounding on production-style draft", () => {
    const audit = auditGrounding({
      draft: buildProductionStyleDraft(),
      verifiedClaims: VERIFIED,
      allowedSourceUrls: [NVD, KEV],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, true, audit.unsupportedClaims.join(" | "));
  });

  it("mutations on production-style draft", () => {
    assert.equal(
      auditGrounding({
        draft: buildProductionStyleDraft({
          content: `${buildProductionStyleDraft().content}<p>Citrix NetScaler Gateway is affected.</p>`,
        }),
        verifiedClaims: VERIFIED,
        allowedSourceUrls: [NVD, KEV],
        allowedContentIds: new Set(),
      }).passed,
      false,
    );

    assert.equal(
      auditGrounding({
        draft: buildProductionStyleDraft({
          content: `${buildProductionStyleDraft().content}<p>${CVE} affects Microsoft Exchange Server.</p>`,
        }),
        verifiedClaims: VERIFIED,
        allowedSourceUrls: [NVD, KEV],
        allowedContentIds: new Set(),
      }).passed,
      false,
    );

    assert.equal(
      auditGrounding({
        draft: buildProductionStyleDraft({
          content: buildProductionStyleDraft().content.replace("9.8", "7.1"),
        }),
        verifiedClaims: VERIFIED,
        allowedSourceUrls: [NVD, KEV],
        allowedContentIds: new Set(),
      }).passed,
      false,
    );

    assert.equal(
      auditGrounding({
        draft: buildProductionStyleDraft({
          content: buildProductionStyleDraft().content.replace(
            "is listed in the CISA Known Exploited Vulnerabilities catalog",
            "is not listed in the CISA Known Exploited Vulnerabilities catalog",
          ),
        }),
        verifiedClaims: VERIFIED,
        allowedSourceUrls: [NVD, KEV],
        allowedContentIds: new Set(),
      }).passed,
      false,
    );
  });
});

describe("forward unsupported products preserved", () => {
  const catalog = buildVerifiedProductCatalog(VERIFIED);
  const context = {
    researchCveIds: new Set([CVE]),
    approvedInternalCves: new Set<string>(),
    approvedInternalContent: new Map(),
    verifiedProductCatalog: catalog,
  };

  for (const sentence of [
    "Affected product: Microsoft Exchange Server.",
    "Affected products include VMware ESXi.",
    "The affected product is Citrix NetScaler Gateway.",
    `${CVE} affects Microsoft Exchange Server.`,
  ]) {
    it(`flags unsupported forward grammar: ${sentence.slice(0, 50)}`, () => {
      const facts = extractDraftFacts(`${CVE}. ${sentence}`, context).filter(
        (f) => f.type === "affected_product",
      );
      assert.ok(facts.length > 0);
      const audit = auditGrounding({
        draft: buildProductionStyleDraft({
          content: `<p>${sentence}</p>`,
        }),
        verifiedClaims: VERIFIED,
        allowedSourceUrls: [NVD, KEV],
        allowedContentIds: new Set(),
      });
      assert.equal(audit.passed, false);
    });
  }
});

describe("verified reverse wording preserved", () => {
  it("passes Citrix NetScaler is affected", () => {
    const audit = auditGrounding({
      draft: buildProductionStyleDraft({
        content: `<p>${CVE}. Citrix NetScaler is affected.</p>`,
      }),
      verifiedClaims: VERIFIED,
      allowedSourceUrls: [NVD, KEV],
      allowedContentIds: new Set(),
    });
    assert.equal(audit.passed, true);
  });

  it("passes Citrix NetScaler ADC deployments are affected when ADC verified", () => {
    const audit = auditGrounding({
      draft: buildProductionStyleDraft({
        content: `<p>Citrix NetScaler ADC deployments are affected.</p>`,
      }),
      verifiedClaims: VERIFIED,
      allowedSourceUrls: [NVD, KEV],
      allowedContentIds: new Set(),
    });
    assert.equal(audit.passed, true);
  });
});
