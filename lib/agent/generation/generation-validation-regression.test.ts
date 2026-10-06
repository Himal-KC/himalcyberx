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

const validationLog = (await import(
  pathToFileURL(join(testDir, "validation-log-core.ts")).href
)) as typeof import("./validation-log-core");

const schemas = (await import(
  pathToFileURL(join(testDir, "schemas.ts")).href
)) as typeof import("./schemas");

const CVE_ID = "CVE-2026-88771";
const NVD_URL = `https://nvd.nist.gov/vuln/detail/${CVE_ID}`;
const KEV_URL =
  "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search=CVE-2026-88771";
const ACSC_URL = "https://www.cyber.gov.au/about-us/view-all-content/alerts";

const CITRIX_VERIFIED_CLAIMS: VerifiedClaim[] = [
  {
    id: "claim-cve",
    type: "cve_id",
    statement: `${CVE_ID} is recorded in the NIST National Vulnerability Database.`,
    sources: [{ url: NVD_URL, title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-cvss",
    type: "cvss",
    statement: `NVD records a CVSS base score of 9.4 (Critical) for ${CVE_ID}.`,
    sources: [{ url: NVD_URL, title: "NVD" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-kev",
    type: "exploitation_status",
    statement: `${CVE_ID} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: KEV_URL, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-acsc",
    type: "mitigation",
    statement:
      "ACSC recommends prioritising patching for affected Citrix NetScaler appliances.",
    sources: [{ url: ACSC_URL, title: "ACSC Alert" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

function buildCitrixArticleDraft(
  overrides: Partial<ArticleGeneratedDraft> = {},
): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: "Citrix NetScaler CVE-2026-88771 Security Analysis",
    slug: "citrix-netscaler-cve-2026-88771-security-analysis",
    excerpt:
      "Grounded security analysis of Citrix NetScaler CVE-2026-88771 with verified NVD, CISA KEV, and ACSC guidance.",
    content: [
      "<p>",
      `${CVE_ID} has a CVSS base score of 9.4 with severity critical.`,
      `${CVE_ID} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
      "ACSC recommends prioritising patching for affected Citrix NetScaler appliances.",
      "</p>",
    ].join(" "),
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: "CVE-2026-88771",
    secondaryKeywords: ["Citrix", "NetScaler", "KEV"],
    keyTakeaways: [
      `${CVE_ID} is listed in CISA KEV and requires urgent remediation.`,
    ],
    seo: {
      seoTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
      seoDescription:
        "Verified Citrix NetScaler CVE-2026-88771 analysis with NVD severity, CISA KEV status, and ACSC mitigation guidance.",
      seoKeywords: ["CVE-2026-88771", "Citrix", "NetScaler"],
      ogTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
      ogDescription:
        "Verified Citrix NetScaler CVE-2026-88771 analysis with NVD severity, CISA KEV status, and ACSC mitigation guidance.",
    },
    generationPlan: {
      contentAngle: "Defender-focused CVE analysis",
      audience: "Security and infrastructure teams",
      intent: "Explain verified Citrix NetScaler evidence",
      sectionPlan: ["Overview", "Severity", "KEV", "Mitigation"],
    },
    sourceMappings: [
      {
        sectionKey: "severity",
        claim: `NVD records a CVSS base score of 9.4 (Critical) for ${CVE_ID}.`,
        sourceUrls: [NVD_URL],
      },
      {
        sectionKey: "kev",
        claim: `${CVE_ID} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
        sourceUrls: [KEV_URL],
      },
    ],
    internalLinks: [],
    warnings: [],
    ...overrides,
  };
}

describe("Phase 4 Citrix CVE-2026-88771 generation validation regression", () => {
  it("accepts grounded Citrix draft output aligned with verified research", () => {
    const audit = auditGrounding({
      draft: buildCitrixArticleDraft(),
      verifiedClaims: CITRIX_VERIFIED_CLAIMS,
      allowedSourceUrls: [NVD_URL, KEV_URL, ACSC_URL],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, true, audit.unsupportedClaims.join(", "));
    assert.equal(
      schemas.parseArticleDraftOutput(buildCitrixArticleDraft())?.contentType,
      "article",
    );
  });

  it("returns a precise admin reason when model output invents unsupported CVSS", () => {
    const audit = auditGrounding({
      draft: buildCitrixArticleDraft({
        content: `<p>${CVE_ID} has a CVSS base score of 9.9 (Critical).</p>`,
      }),
      verifiedClaims: CITRIX_VERIFIED_CLAIMS,
      allowedSourceUrls: [NVD_URL, KEV_URL, ACSC_URL],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, false);

    const reason = validationLog.formatGroundingAuditFailureReason(audit);
    assert.match(reason, /CVSS score 9\.9 for CVE-2026-88771/);

    const log = validationLog.buildGroundingValidationLog({
      agentRunId: "run-citrix",
      contentType: "article",
      audit,
    });
    assert.equal(log.validationStage, "grounding_audit");
    assert.match(log.reason ?? "", /CVSS score 9\.9/);
  });

  it("surfaces schema parse failures with field-level admin reasons", () => {
    const reason = schemas.formatContentTypeDraftParseFailureReason("article", {
      contentType: "article",
      title: "short",
    });

    assert.match(reason, /Draft validation failed:/);
    assert.match(reason, /too short|missing required field/i);
  });
});
