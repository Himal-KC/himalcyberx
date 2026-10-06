import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding, buildVerifiedProductCatalog, extractDraftFacts } =
  (await import(
    pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
  )) as typeof import("./grounding-audit-core");

const {
  extractAffectedProductDraftFacts,
  isMetaProductCapture,
} = (await import(
  pathToFileURL(join(testDir, "product-extraction-core.ts")).href
)) as typeof import("./product-extraction-core");

const CVE_ID = "CVE-2026-88771";

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

function topicCveClaim(): VerifiedClaim {
  return {
    id: "claim-topic-cve",
    type: "exploitation_status",
    statement: `${CVE_ID} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: "https://www.cisa.gov/kev", title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  };
}

function withResearchCve(claims: VerifiedClaim[]): VerifiedClaim[] {
  return [topicCveClaim(), ...claims];
}

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

function buildCatalog(claims: VerifiedClaim[]) {
  return buildVerifiedProductCatalog(claims);
}

function productFactsForSentence(sentence: string, claims: VerifiedClaim[]) {
  const catalog = buildCatalog(claims);
  const context = {
    researchCveIds: new Set([CVE_ID]),
    approvedInternalCves: new Set<string>(),
    approvedInternalContent: new Map(),
    verifiedProductCatalog: catalog,
  };
  return extractDraftFacts(`${CVE_ID}. ${sentence}`, context).filter(
    (fact) => fact.type === "affected_product",
  );
}

function auditSentence(sentence: string, claims: VerifiedClaim[]) {
  return auditGrounding({
    draft: {
      contentType: "article",
      title: "Product grounding adversarial",
      slug: "product-grounding-adversarial",
      excerpt: "Test",
      content: `<p>${CVE_ID}. ${sentence}</p>`,
      categoryRecommendation: "Vulnerabilities",
      primaryKeyword: CVE_ID,
      secondaryKeywords: [],
      keyTakeaways: ["Test"],
      seo: {
        seoTitle: "Test",
        seoDescription: "Test",
        seoKeywords: [CVE_ID],
        ogTitle: "Test",
        ogDescription: "Test",
      },
      generationPlan: {
        contentAngle: "Test",
        audience: "Test",
        intent: "Test",
        sectionPlan: ["Test"],
      },
      sourceMappings: [],
      internalLinks: [],
      warnings: [],
    },
    verifiedClaims: claims,
    allowedSourceUrls: ["https://www.cisa.gov/kev", "https://nvd.nist.gov/"],
    allowedContentIds: new Set(),
  });
}

const verifiedFamily = withResearchCve([kevProductClaim("Citrix — NetScaler")]);
const verifiedAdcAndGateway = withResearchCve([
  nvdProductClaim(
    "citrix netscaler_application_delivery_controller; citrix netscaler_gateway",
  ),
]);

describe("affected product adversarial meta prose", () => {
  const metaSentences = [
    "The affected product ranges are described below.",
    "Affected product ranges from Citrix NetScaler 14.1 through 14.1-47.46.",
    "The affected product version ranges for this CVE are documented by the vendor.",
    "Affected product guidance is available from CISA.",
    "The affected product information is available from CISA.",
    "Affected product remediation steps are listed in the advisory.",
    "Affected product mitigation requires network segmentation.",
    "Affected product patching should follow vendor guidance.",
    "Affected product details appear in the NVD record.",
    "Affected product entries include version and platform notes.",
    "The affected product list is maintained by the vendor.",
    "Affected product families are not expanded in this advisory.",
    "Affected product category metadata is informational only.",
  ];

  for (const sentence of metaSentences) {
    it(`does not emit affected_product facts for meta prose: ${sentence.slice(0, 48)}…`, () => {
      const facts = productFactsForSentence(sentence, verifiedFamily);
      assert.equal(
        facts.length,
        0,
        `unexpected facts: ${facts.map((f) => f.value).join(", ")}`,
      );
      assert.equal(auditSentence(sentence, verifiedFamily).passed, true);
    });
  }

  it("does not treat CVSS impact-across-confidentiality prose as a product", () => {
    const sentence =
      "The CVSS assessment shows high impact across confidentiality, integrity and availability.";
    const facts = productFactsForSentence(sentence, verifiedFamily);
    assert.equal(facts.length, 0);
    const trace = extractAffectedProductDraftFacts({
      sentence: `${CVE_ID}. ${sentence}`,
      primaryCve: CVE_ID,
      catalog: buildCatalog(verifiedFamily),
    });
    assert.ok(
      trace.diagnostics.every((entry) => entry.resolution !== "unsupported"),
    );
  });

  it("documents the historical ranges false-positive capture shape", () => {
    const sentence = "The affected product ranges are described below.";
    const legacyPattern =
      /\baffected products?(?:\s+(?:include|is|are|as))?\s+([^.;]+)/i;
    const legacyMatch = sentence.match(legacyPattern);
    assert.ok(legacyMatch?.[1]?.toLowerCase().startsWith("ranges"));

    const extraction = extractAffectedProductDraftFacts({
      sentence: `${CVE_ID}. ${sentence}`,
      primaryCve: CVE_ID,
      catalog: buildCatalog(verifiedFamily),
    });
    assert.equal(extraction.facts.length, 0);
    assert.ok(
      extraction.diagnostics.some(
        (entry) =>
          entry.resolution === "meta_skipped" &&
          entry.rawCandidate?.toLowerCase().startsWith("ranges"),
      ),
    );
  });

  it("treats generic meta tokens as non-products", () => {
    for (const token of [
      "ranges",
      "versions",
      "guidance",
      "information",
      "remediation",
    ]) {
      assert.ok(isMetaProductCapture(token), token);
    }
  });
});

describe("affected product adversarial verified and unsupported entities", () => {
  it("passes explicit verified product list wording", () => {
    for (const sentence of [
      "Affected products include Citrix NetScaler.",
      "CISA identifies the affected product as Citrix NetScaler.",
      "Affected versions of Citrix NetScaler are listed in the advisory.",
    ]) {
      assert.equal(
        auditSentence(sentence, verifiedFamily).passed,
        true,
        sentence,
      );
    }

    assert.equal(
      auditSentence(
        "Affected products include Citrix NetScaler ADC.",
        verifiedFamily,
      ).passed,
      false,
    );
  });

  it("passes ADC only when ADC is independently verified", () => {
    const adcClaims = withResearchCve([
      nvdProductClaim("citrix netscaler_application_delivery_controller"),
    ]);
    assert.equal(
      auditSentence("Affected products include Citrix NetScaler ADC.", adcClaims)
        .passed,
      true,
    );
  });

  it("fails Gateway when only family or ADC is verified", () => {
    assert.equal(
      auditSentence("Citrix NetScaler Gateway is affected.", verifiedFamily)
        .passed,
      false,
    );
    assert.equal(
      auditSentence(
        "Citrix NetScaler Gateway is affected.",
        withResearchCve([
          nvdProductClaim("citrix netscaler_application_delivery_controller"),
        ]),
      ).passed,
      false,
    );
  });

  it("passes comma and semicolon separated verified products", () => {
    assert.equal(
      auditSentence(
        "Affected products include Citrix NetScaler ADC; Citrix NetScaler Gateway.",
        verifiedAdcAndGateway,
      ).passed,
      true,
    );
    assert.equal(
      auditSentence(
        "Affected products include Citrix NetScaler ADC, Citrix NetScaler Gateway.",
        verifiedAdcAndGateway,
      ).passed,
      true,
    );
  });

  it("fails unrelated vendor products", () => {
    assert.equal(
      auditSentence(
        "The affected product as Microsoft Exchange is referenced in vendor guidance.",
        verifiedFamily,
      ).passed,
      false,
    );
    assert.equal(
      auditSentence("Microsoft Exchange is affected.", verifiedFamily).passed,
      true,
    );
  });
});

describe("affected product parser invariants", () => {
  it("does not normalize an unrelated product into a verified alias", () => {
    const facts = productFactsForSentence(
      `${CVE_ID} affects Citrix XenApp.`,
      verifiedFamily,
    );
    assert.ok(facts.length > 0);
    assert.equal(
      auditSentence(`${CVE_ID} affects Citrix XenApp.`, verifiedFamily).passed,
      false,
    );
  });

  it("does not verify Gateway via generic NetScaler family alone", () => {
    const facts = productFactsForSentence(
      "The affected product as Citrix NetScaler Gateway requires urgent patching.",
      verifiedFamily,
    );
    assert.ok(facts.some((fact) => /gateway/i.test(fact.value)));
  });
});
