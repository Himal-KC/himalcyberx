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

const CVE_A = "CVE-2026-88771";
const CVE_B = "CVE-2024-21412";
const RELATED_B_ID = "00000000-0000-4000-8000-000000000002";

const RELATED_B = {
  id: RELATED_B_ID,
  contentType: "article" as const,
  title: "CVE-2024-21412 Security Analysis and Mitigation Guidance",
  slug: "cve-2024-21412-security-analysis",
};

const VERIFIED_CVE_A_KEV: VerifiedClaim[] = [
  {
    id: "claim-kev-a",
    type: "exploitation_status",
    statement: `${CVE_A} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    sources: [{ url: "https://www.cisa.gov/kev", title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

function buildDraft(content: string, internalLinks: ArticleGeneratedDraft["internalLinks"] = []): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: "Citrix NetScaler CVE-2026-88771 Security Analysis",
    slug: "citrix-netscaler-cve-2026-88771-security-analysis",
    excerpt:
      "Grounded security analysis of Citrix NetScaler CVE-2026-88771 with verified evidence.",
    content: `<p>${content}</p>`,
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: CVE_A,
    secondaryKeywords: ["Citrix", "NetScaler"],
    keyTakeaways: ["Apply verified Citrix NetScaler remediation guidance."],
    seo: {
      seoTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
      seoDescription:
        "Verified Citrix NetScaler CVE-2026-88771 analysis with grounded NVD and CISA KEV evidence.",
      seoKeywords: [CVE_A, "Citrix", "NetScaler"],
      ogTitle: "Citrix NetScaler CVE-2026-88771 Security Analysis",
      ogDescription:
        "Verified Citrix NetScaler CVE-2026-88771 analysis with grounded NVD and CISA KEV evidence.",
    },
    generationPlan: {
      contentAngle: "Defender-focused CVE analysis",
      audience: "Security teams",
      intent: "Explain verified evidence",
      sectionPlan: ["Overview", "KEV", "Mitigation", "Related"],
    },
    sourceMappings: [],
    internalLinks,
    warnings: [],
  };
}

function audit(content: string, internalLinks: ArticleGeneratedDraft["internalLinks"] = []) {
  return auditGrounding({
    draft: buildDraft(content, internalLinks),
    verifiedClaims: VERIFIED_CVE_A_KEV,
    allowedSourceUrls: ["https://www.cisa.gov/kev"],
    allowedContentIds: new Set([RELATED_B_ID]),
    approvedInternalContent: [RELATED_B],
  });
}

describe("Related HCX content vs factual secondary-CVE grounding", () => {
  it("passes when draft only references related HCX title for CVE-B", () => {
    const result = audit(
      `See our ${RELATED_B.title} for additional context on prior NetScaler coverage.`,
      [
        {
          contentId: RELATED_B_ID,
          contentType: "article",
          anchorText: RELATED_B.title,
          suggestedSection: "related",
        },
      ],
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("fails when draft claims CVE-B is in CISA KEV without verification", () => {
    const result = audit(
      `${CVE_B} is listed in the CISA Known Exploited Vulnerabilities catalog.`,
    );

    assert.equal(result.passed, false);
    assert.ok(
      result.unsupportedClaims.some((claim) => claim.startsWith("kev_status:CVE-2024-21412")),
    );
  });

  it("fails when draft gives CVSS for CVE-B without verification", () => {
    const result = audit(`${CVE_B} has a CVSS base score of 9.8.`);

    assert.equal(result.passed, false);
    assert.ok(
      result.unsupportedClaims.some((claim) => claim.includes("cvss_score:CVE-2024-21412")),
    );
  });

  it("passes when CVE-A KEV is stated correctly and CVE-B is linked separately", () => {
    const result = audit(
      `${CVE_A} is listed in the CISA KEV catalog. See our ${RELATED_B.title}.`,
      [
        {
          contentId: RELATED_B_ID,
          contentType: "article",
          anchorText: RELATED_B.title,
          suggestedSection: "related",
        },
      ],
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("passes mixed sentence when KEV applies only to verified CVE-A and CVE-B is title reference", () => {
    const result = audit(
      `While ${CVE_A} is listed in the CISA KEV catalog, readers may also review ${RELATED_B.title}.`,
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("does not treat related HCX title text as verified vulnerability evidence", () => {
    const result = audit(
      `For broader context, read ${RELATED_B.title}, which covers security analysis and mitigation guidance.`,
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("fails unrelated secondary CVE factual exploitation claim", () => {
    const result = audit(
      `${CVE_B} is actively exploited in enterprise NetScaler environments.`,
    );

    assert.equal(result.passed, false);
    assert.ok(result.unsupportedClaims.some((claim) => claim.includes(CVE_B)));
  });
});
