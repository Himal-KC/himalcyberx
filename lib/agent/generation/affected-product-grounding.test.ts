import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding, buildVerifiedFactIndex } = (await import(
  pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
)) as typeof import("./grounding-audit-core");

const productGrounding = (await import(
  pathToFileURL(join(testDir, "product-grounding-core.ts")).href
)) as typeof import("./product-grounding-core");

const validationLog = (await import(
  pathToFileURL(join(testDir, "validation-log-core.ts")).href
)) as typeof import("./validation-log-core");

const CVE_ID = "CVE-2026-88771";

function nvdProductClaim(products: string): VerifiedClaim {
  return {
    id: "claim-nvd-products",
    type: "affected_product",
    statement: `NVD associates ${CVE_ID} with affected product/configuration entries including ${products}.`,
    sources: [{ url: "https://nvd.nist.gov/", title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  };
}

function kevProductClaim(label: string): VerifiedClaim {
  return {
    id: "claim-kev-product",
    type: "affected_product",
    statement: `CISA KEV identifies the affected product as ${label}.`,
    sources: [{ url: "https://www.cisa.gov/kev", title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  };
}

function auditProductSentence(
  sentence: string,
  verifiedClaims: VerifiedClaim[],
): ReturnType<typeof auditGrounding> {
  return auditGrounding({
    draft: {
      contentType: "article",
      title: "Citrix NetScaler CVE-2026-88771 Security Analysis",
      slug: "citrix-netscaler-cve-2026-88771-security-analysis",
      excerpt:
        "Grounded security analysis of Citrix NetScaler CVE-2026-88771 with verified product evidence.",
      content: `<p>${sentence}</p>`,
      categoryRecommendation: "Vulnerabilities",
      primaryKeyword: CVE_ID,
      secondaryKeywords: ["Citrix", "NetScaler"],
      keyTakeaways: ["Apply verified Citrix NetScaler remediation guidance."],
      seo: {
        seoTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
        seoDescription:
          "Verified Citrix NetScaler CVE-2026-88771 analysis with grounded affected-product evidence.",
        seoKeywords: [CVE_ID, "Citrix", "NetScaler"],
        ogTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
        ogDescription:
          "Verified Citrix NetScaler CVE-2026-88771 analysis with grounded affected-product evidence.",
      },
      generationPlan: {
        contentAngle: "Defender-focused CVE analysis",
        audience: "Security teams",
        intent: "Explain verified product scope",
        sectionPlan: ["Overview", "Affected products", "Mitigation"],
      },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
    },
    verifiedClaims,
    allowedSourceUrls: ["https://nvd.nist.gov/", "https://www.cisa.gov/kev"],
    allowedContentIds: new Set(),
  });
}

describe("affected product grounding", () => {
  it("passes ADC wording when NVD verifies Application Delivery Controller", () => {
    const claims = [
      nvdProductClaim("citrix netscaler_application_delivery_controller"),
    ];
    const index = buildVerifiedFactIndex(claims);

    assert.ok(
      productGrounding.isAffectedProductSupported(
        "Citrix NetScaler ADC",
        index.affectedProducts,
      ),
    );
    assert.equal(
      auditProductSentence(`${CVE_ID} affects Citrix NetScaler ADC.`, claims)
        .passed,
      true,
    );
  });

  it("fails Gateway wording when only generic NetScaler is verified", () => {
    const claims = [kevProductClaim("Citrix — NetScaler")];

    assert.equal(
      auditProductSentence(
        `${CVE_ID} affects Citrix NetScaler Gateway.`,
        claims,
      ).passed,
      false,
    );
  });

  it("passes ADC and Gateway when each is independently verified", () => {
    const claims = [
      nvdProductClaim(
        "citrix netscaler_application_delivery_controller; citrix netscaler_gateway",
      ),
    ];

    assert.equal(
      auditProductSentence(
        `${CVE_ID} affects Citrix NetScaler ADC and Gateway.`,
        claims,
      ).passed,
      true,
    );
  });

  it("passes case, punctuation, and underscore differences from NVD CPE labels", () => {
    const claims = [
      nvdProductClaim("citrix netscaler_application_delivery_controller"),
    ];
    const index = buildVerifiedFactIndex(claims);

    assert.ok(
      productGrounding.isAffectedProductSupported(
        "CITRIX NetScaler Application Delivery Controller",
        index.affectedProducts,
      ),
    );
    assert.ok(
      productGrounding.isAffectedProductSupported(
        "NetScaler Application Delivery Controller (ADC)",
        index.affectedProducts,
      ),
    );
  });

  it("fails a completely different Citrix product", () => {
    const claims = [
      nvdProductClaim("citrix netscaler_application_delivery_controller"),
      kevProductClaim("Citrix — NetScaler"),
    ];

    assert.equal(
      auditProductSentence(`${CVE_ID} affects Citrix XenApp.`, claims).passed,
      false,
    );
  });

  it("includes sanitized product wording in admin grounding errors", () => {
    const reason = validationLog.formatGroundingAuditFailureReason({
      passed: false,
      unsupportedClaims: [
        `affected_product:${CVE_ID}:NetScaler ADC`,
      ],
      invalidSourceUrls: [],
      invalidInternalLinks: [],
      warnings: [],
    });

    assert.match(reason, /affected product "NetScaler ADC"/);
  });
});

describe("affected product extraction lead-ins", () => {
  const verifiedNetScaler = [
    kevProductClaim("Citrix — NetScaler"),
    {
      id: "claim-topic-cve",
      type: "exploitation_status" as const,
      statement: `${CVE_ID} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
      sources: [{ url: "https://www.cisa.gov/kev", title: "CISA KEV" }],
      confidence: "high" as const,
      relevanceLevel: "high" as const,
    },
  ];

  it("passes when draft mirrors KEV phrasing: affected product as Citrix NetScaler", () => {
    const sentence =
      "CISA KEV identifies the affected product as Citrix NetScaler for active remediation.";
    const audit = auditProductSentence(sentence, verifiedNetScaler);

    assert.equal(audit.passed, true, audit.unsupportedClaims.join(", "));
    assert.equal(
      productGrounding.normalizeAffectedProductSegment("as Citrix NetScaler"),
      "citrix netscaler",
    );
  });

  it("passes identified-as and such-as phrasing when Citrix NetScaler is verified", () => {
    assert.equal(
      auditProductSentence(
        `${CVE_ID} impacts products identified as Citrix NetScaler.`,
        verifiedNetScaler,
      ).passed,
      true,
    );
    assert.equal(
      auditProductSentence(
        `${CVE_ID} affects platforms such as Citrix NetScaler.`,
        verifiedNetScaler,
      ).passed,
      true,
    );
  });

  it("fails as Citrix NetScaler Gateway when Gateway is not independently verified", () => {
    const audit = auditProductSentence(
      "The affected product as Citrix NetScaler Gateway requires urgent patching.",
      verifiedNetScaler,
    );

    assert.equal(audit.passed, false);
    assert.ok(
      audit.unsupportedClaims.some((claim) =>
        claim.includes("affected_product"),
      ),
    );
  });

  it("fails unrelated products even with an as lead-in", () => {
    assert.equal(
      auditProductSentence(
        "The affected product as Microsoft Exchange is referenced in vendor guidance.",
        verifiedNetScaler,
      ).passed,
      false,
    );
  });

  it("keeps ADC alias behavior and unsupported Gateway strictness", () => {
    const adcClaims = [
      nvdProductClaim("citrix netscaler_application_delivery_controller"),
    ];

    assert.equal(
      auditProductSentence(`${CVE_ID} affects Citrix NetScaler ADC.`, adcClaims)
        .passed,
      true,
    );
    assert.equal(
      auditProductSentence(
        `${CVE_ID} affects Citrix NetScaler Gateway.`,
        adcClaims,
      ).passed,
      false,
    );
  });
});
