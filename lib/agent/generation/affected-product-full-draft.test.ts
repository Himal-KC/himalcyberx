import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "./types";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding } = (await import(
  pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
)) as typeof import("./grounding-audit-core");

const CVE = "CVE-2026-88771";
const NVD = `https://nvd.nist.gov/vuln/detail/${CVE}`;
const KEV = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";

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
    statement: `NVD records a CVSS base score of 9.4 (Critical) for ${CVE}.`,
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

const RELATED_CVE_B = "CVE-2024-21412";
const RELATED_ID = "00000000-0000-4000-8000-000000000099";

function buildFullArticle(overrides: Partial<ArticleGeneratedDraft> = {}): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: "Citrix NetScaler Security Analysis and Mitigation Guidance",
    slug: "citrix-netscaler-security-analysis",
    excerpt:
      "Executive summary of verified severity, affected Citrix NetScaler products, and remediation guidance.",
    content: [
      "<h2>Executive Summary</h2>",
      `<p>${CVE} has a CVSS base score of 9.4 with severity critical.</p>`,
      `<p>${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.</p>`,
      "<h2>Impact Analysis</h2>",
      "<p>The CVSS assessment shows high impact across confidentiality, integrity and availability for remote exploitation scenarios.</p>",
      "<p>Scope remains unchanged while attack complexity is low.</p>",
      "<h2>Affected Products</h2>",
      "<p>CISA identifies the affected product as Citrix NetScaler for active remediation.</p>",
      `<p>${CVE} affects Citrix NetScaler ADC.</p>`,
      "<h2>Affected Versions</h2>",
      "<p>Affected product version ranges for this CVE are documented in the vendor bulletin.</p>",
      "<p>Affected versions of Citrix NetScaler are listed in the official advisory.</p>",
      "<h2>Mitigation</h2>",
      "<p>Apply vendor guidance and prioritise patching for internet-facing appliances.</p>",
      "<h2>Related Analysis</h2>",
      `<p>For broader context, review ${RELATED_CVE_B} Security Analysis and Mitigation Guidance.</p>`,
      "<h2>References</h2>",
      "<p>References include NVD, CISA KEV, and vendor documentation.</p>",
    ].join("\n"),
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: CVE,
    secondaryKeywords: ["Citrix", "NetScaler", "CVSS"],
    keyTakeaways: [
      `${CVE} is listed in CISA KEV and requires urgent remediation.`,
      "Verified affected products include Citrix NetScaler and Citrix NetScaler ADC.",
    ],
    seo: {
      seoTitle: "Citrix NetScaler Security Analysis",
      seoDescription: "Verified CVE analysis with CVSS, KEV, and affected product guidance.",
      seoKeywords: [CVE, "Citrix", "NetScaler"],
      ogTitle: "Citrix NetScaler Security Analysis",
      ogDescription: "Verified CVE analysis with CVSS, KEV, and affected product guidance.",
    },
    generationPlan: {
      contentAngle: "Defender-focused analysis",
      audience: "Security teams",
      intent: "Explain verified evidence",
      sectionPlan: ["Summary", "Impact", "Products", "Mitigation"],
    },
    sourceMappings: [
      {
        sectionKey: "severity",
        claim: `NVD records a CVSS base score of 9.4 (Critical) for ${CVE}.`,
        sourceUrls: [NVD],
      },
      {
        sectionKey: "kev",
        claim: `${CVE} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
        sourceUrls: [KEV],
      },
    ],
    internalLinks: [
      {
        contentId: RELATED_ID,
        contentType: "article",
        anchorText: `${RELATED_CVE_B} Security Analysis and Mitigation Guidance`,
        suggestedSection: "related",
      },
    ],
    warnings: [],
    ...overrides,
  };
}

function auditDraft(draft: ArticleGeneratedDraft) {
  return auditGrounding({
    draft,
    verifiedClaims: VERIFIED,
    allowedSourceUrls: [NVD, KEV],
    allowedContentIds: new Set([RELATED_ID]),
    approvedInternalContent: [
      {
        id: RELATED_ID,
        contentType: "article",
        title: `${RELATED_CVE_B} Security Analysis and Mitigation Guidance`,
        slug: "cve-2024-21412-security-analysis",
      },
    ],
  });
}

describe("full draft grounding regression", () => {
  it("passes complete supported cybersecurity article fixture", () => {
    const audit = auditDraft(buildFullArticle());
    assert.equal(audit.passed, true, audit.unsupportedClaims.join(" | "));
  });

  it("fails mutated unsupported Gateway claim (A)", () => {
    const draft = buildFullArticle({
      content: buildFullArticle().content.replace(
        `${CVE} affects Citrix NetScaler ADC.`,
        `${CVE} affects Citrix NetScaler Gateway.`,
      ),
    });
    const audit = auditDraft(draft);
    assert.equal(audit.passed, false);
    assert.ok(audit.unsupportedClaims.some((c) => c.includes("affected_product")));
  });

  it("fails mutated unsupported Microsoft Exchange claim (B)", () => {
    const draft = buildFullArticle({
      content: `${buildFullArticle().content}<p>${CVE} affects Microsoft Exchange Server.</p>`,
    });
    assert.equal(auditDraft(draft).passed, false);
  });

  it("fails mutated unsupported CVSS claim (C)", () => {
    const draft = buildFullArticle({
      content: buildFullArticle().content.replace(
        "CVSS base score of 9.4",
        "CVSS base score of 7.1",
      ),
    });
    assert.equal(auditDraft(draft).passed, false);
  });

  it("fails mutated unsupported KEV claim (D)", () => {
    const draft = buildFullArticle({
      content: buildFullArticle().content.replace(
        "is listed in the CISA Known Exploited Vulnerabilities catalog",
        "is not listed in the CISA Known Exploited Vulnerabilities catalog",
      ),
    });
    assert.equal(auditDraft(draft).passed, false);
  });

  it("passes with ordinary impact across confidentiality phrasing (E)", () => {
    const audit = auditDraft(buildFullArticle());
    assert.ok(
      audit.passed,
      "baseline article already includes impact across confidentiality prose",
    );
  });

  it("passes affected product ranges meta language (F)", () => {
    const audit = auditDraft(buildFullArticle());
    assert.match(buildFullArticle().content, /Affected product version ranges/);
    assert.equal(audit.passed, true);
  });

  it("passes related HCX secondary CVE title as link only (G)", () => {
    const audit = auditDraft(buildFullArticle());
    assert.equal(audit.passed, true);
    assert.ok(
      !audit.unsupportedClaims.some((claim) => claim.includes(RELATED_CVE_B)),
    );
  });
});
