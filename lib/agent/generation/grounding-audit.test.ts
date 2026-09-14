import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ArticleGeneratedDraft } from "./types";
import type { VerifiedClaim } from "../types";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding, buildVerifiedFactIndex, normalizeCvssVector, scoresEquivalent } = (await import(
  pathToFileURL(join(testDir, "grounding-audit-core.ts")).href
)) as typeof import("./grounding-audit-core");

const NVD_URL = "https://nvd.nist.gov/vuln/detail/CVE-2024-21412";
const KEV_URL =
  "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search=CVE-2024-21412";
const RELATED_ARTICLE_ID = "00000000-0000-4000-8000-000000000002";
const APPROVED_RELATED_CONTENT = [
  {
    id: RELATED_ARTICLE_ID,
    contentType: "article" as const,
    title:
      "CVE-2026-33824: Critical Windows IKE Remote Code Execution Vulnerability",
    slug: "cve-2026-33824-critical-windows-ike-rce",
  },
];

export const CVE_2024_21412_VERIFIED_CLAIMS: VerifiedClaim[] = [
  {
    id: "claim-cve",
    type: "cve_id",
    statement:
      "CVE-2024-21412 is recorded in the NIST National Vulnerability Database.",
    sources: [{ url: NVD_URL, title: "NVD — CVE-2024-21412" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-cvss-score",
    type: "cvss",
    statement:
      "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
    sources: [{ url: NVD_URL, title: "NVD — CVE-2024-21412" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-cvss-vector",
    type: "cvss",
    statement:
      "NVD records CVSS vector CVSS:3.1/AV\\:N/AC\\:L/PR\\:N/UI\\:R/S\\:U/C\\:H/I\\:H/A\\:N for CVE-2024-21412.",
    sources: [{ url: NVD_URL, title: "NVD — CVE-2024-21412" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-kev",
    type: "exploitation_status",
    statement:
      "CVE-2024-21412 is listed in the CISA Known Exploited Vulnerabilities catalog.",
    sources: [{ url: KEV_URL, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-kev-date",
    type: "disclosure_date",
    statement:
      "CISA added CVE-2024-21412 to the Known Exploited Vulnerabilities catalog on 2024-02-13.",
    sources: [{ url: KEV_URL, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
  {
    id: "claim-product",
    type: "affected_product",
    statement:
      "CISA KEV identifies the affected product as Microsoft — Windows.",
    sources: [{ url: KEV_URL, title: "CISA KEV" }],
    confidence: "high",
    relevanceLevel: "high",
  },
];

function buildArticleDraft(
  overrides: Partial<ArticleGeneratedDraft> = {},
): ArticleGeneratedDraft {
  return {
    contentType: "article",
    title: "CVE-2024-21412 Exploitation and Remediation Guidance",
    slug: "cve-2024-21412-exploitation-remediation-guidance",
    excerpt:
      "Grounded analysis of CVE-2024-21412 severity, KEV status, and remediation guidance for defenders.",
    content:
      "<p>CVE-2024-21412 has a CVSS 3.1 base score of 8.1 with severity high.</p>",
    categoryRecommendation: "Vulnerabilities",
    primaryKeyword: "CVE-2024-21412",
    secondaryKeywords: ["CVSS", "KEV"],
    keyTakeaways: ["CVE-2024-21412 is listed in CISA KEV."],
    seo: {
      seoTitle: "CVE-2024-21412 Exploitation and Remediation Guidance",
      seoDescription:
        "Grounded CVE-2024-21412 analysis covering CVSS 8.1, KEV listing, and remediation guidance.",
      seoKeywords: ["CVE-2024-21412", "CVSS", "KEV"],
      ogTitle: "CVE-2024-21412 Exploitation and Remediation Guidance",
      ogDescription:
        "Grounded CVE-2024-21412 analysis covering CVSS 8.1, KEV listing, and remediation guidance.",
    },
    generationPlan: {
      contentAngle: "Defensive remediation",
      audience: "Security teams",
      intent: "Explain verified CVE evidence",
      sectionPlan: ["Overview", "Severity", "KEV", "References"],
    },
    sourceMappings: [
      {
        sectionKey: "severity",
        claim: "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
        sourceUrls: [NVD_URL],
      },
    ],
    internalLinks: [],
    warnings: [],
    ...overrides,
  };
}

function audit(
  content: string,
  extra?: Partial<ArticleGeneratedDraft>,
  options?: {
    approvedInternalContent?: typeof APPROVED_RELATED_CONTENT;
    allowedContentIds?: Set<string>;
  },
) {
  const approvedInternalContent =
    options?.approvedInternalContent ?? APPROVED_RELATED_CONTENT;
  const allowedContentIds =
    options?.allowedContentIds ??
    new Set(approvedInternalContent.map((item) => item.id));

  return auditGrounding({
    draft: buildArticleDraft({
      content: `<p>${content}</p>`,
      ...extra,
    }),
    verifiedClaims: CVE_2024_21412_VERIFIED_CLAIMS,
    allowedSourceUrls: [NVD_URL, KEV_URL],
    allowedContentIds,
    approvedInternalContent,
  });
}

describe("grounding context separation", () => {
  it("passes topic CVE-2024-21412 in factual prose", () => {
    const result = audit(
      "CVE-2024-21412 is listed in the CISA Known Exploited Vulnerabilities catalog.",
      undefined,
      { approvedInternalContent: [] },
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("passes related approved HCX link mention of CVE-2026-33824 in reference prose", () => {
    const result = audit(
      "See our analysis of CVE-2026-33824: Critical Windows IKE Remote Code Execution Vulnerability.",
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("fails body claim about CVE-2026-33824 without research evidence", () => {
    const result = audit(
      "CVE-2026-33824 is also actively exploited in enterprise environments.",
    );

    assert.equal(result.passed, false);
    assert.ok(
      result.unsupportedClaims.some((claim) =>
        claim.includes("CVE-2026-33824"),
      ),
    );
  });

  it("fails invented CVE-2099-99999 in factual prose", () => {
    const result = audit(
      "CVE-2099-99999 is actively exploited in production environments.",
      undefined,
      { approvedInternalContent: [] },
    );

    assert.equal(result.passed, false);
    assert.ok(
      result.unsupportedClaims.some((claim) =>
        claim.includes("CVE-2099-99999"),
      ),
    );
  });

  it("fails internal link with unknown content ID", () => {
    const result = audit(
      "CVE-2024-21412 is listed in the CISA Known Exploited Vulnerabilities catalog.",
      {
        internalLinks: [
          {
            contentId: "00000000-0000-4000-8000-000000009999",
            contentType: "article",
            anchorText: "See our analysis of CVE-2026-33824",
            suggestedSection: "related",
          },
        ],
      },
    );

    assert.equal(result.passed, false);
    assert.ok(result.invalidInternalLinks.length > 0);
  });

  it("passes valid internal link with stored matching CVE/title", () => {
    const result = audit(
      "CVE-2024-21412 is listed in the CISA Known Exploited Vulnerabilities catalog.",
      {
        internalLinks: [
          {
            contentId: RELATED_ARTICLE_ID,
            contentType: "article",
            anchorText:
              "See our analysis of CVE-2026-33824: Critical Windows IKE Remote Code Execution Vulnerability",
            suggestedSection: "related",
          },
        ],
      },
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });
});

describe("CVE-2024-21412 grounding audit regression", () => {
  it("passes when generated content uses the same verified CVSS, vector, and KEV facts", () => {
    const result = audit(
      [
        "CVE-2024-21412 has a CVSS 3.1 base score of 8.1 with severity HIGH.",
        "The CVSS vector is CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N.",
        "CISA lists CVE-2024-21412 in its Known Exploited Vulnerabilities catalog.",
      ].join(" "),
    );

    assert.equal(result.passed, true, result.unsupportedClaims.join(", "));
  });

  it("accepts CVSS 8.1", () => {
    assert.equal(
      audit("CVE-2024-21412 has a CVSS base score of 8.1.").passed,
      true,
    );
  });

  it("rejects CVSS 9.8", () => {
    const result = audit("CVE-2024-21412 has a CVSS base score of 9.8.");
    assert.equal(result.passed, false);
    assert.ok(result.unsupportedClaims.some((claim) => claim.includes("9.8")));
  });

  it("accepts HIGH vs high severity", () => {
    assert.equal(
      audit("CVE-2024-21412 has severity high with a CVSS base score of 8.1.")
        .passed,
      true,
    );
  });

  it("accepts escaped vs unescaped CVSS vectors", () => {
    assert.equal(
      scoresEquivalent("8.1", "8.10"),
      true,
    );
    assert.equal(
      normalizeCvssVector("CVSS:3.1/AV\\:N/AC\\:L/PR\\:N/UI\\:R/S\\:U/C\\:H/I\\:H/A\\:N"),
      normalizeCvssVector(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N",
      ),
    );
    assert.equal(
      audit(
        "CVE-2024-21412 uses CVSS vector CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N.",
      ).passed,
      true,
    );
  });

  it("accepts correct CVE KEV listing phrasing", () => {
    assert.equal(
      audit(
        "CISA lists CVE-2024-21412 in its Known Exploited Vulnerabilities catalog.",
      ).passed,
      true,
    );
    assert.equal(
      audit("CVE-2024-21412 appears in the CISA KEV catalog.").passed,
      true,
    );
  });

  it("rejects wrong CVE KEV listing", () => {
    const result = audit(
      "CVE-2024-99999 is listed in the CISA Known Exploited Vulnerabilities catalog.",
    );
    assert.equal(result.passed, false);
  });

  it("rejects claiming not in KEV when verified listed", () => {
    const result = audit(
      "CVE-2024-21412 is not in the CISA Known Exploited Vulnerabilities catalog.",
    );
    assert.equal(result.passed, false);
  });

  it("rejects unsupported affected versions", () => {
    const unsupported = audit(
      "CVE-2024-21412 affects Windows Server 2022.",
    );
    assert.equal(unsupported.passed, false);
    assert.ok(
      unsupported.unsupportedClaims.some((claim) =>
        claim.includes("affected_product"),
      ),
    );

    assert.equal(
      audit("CVE-2024-21412 affects Microsoft Windows.").passed,
      true,
    );
  });

  it("rejects unsupported patch IDs", () => {
    const result = auditGrounding({
      draft: buildArticleDraft({
        content:
          "<p>Apply vendor patch KB9999999 to remediate CVE-2024-21412.</p>",
      }),
      verifiedClaims: [
        ...CVE_2024_21412_VERIFIED_CLAIMS,
        {
          id: "claim-patch",
          type: "patch_information",
          statement: "Apply vendor patch KB5034123 to address CVE-2024-21412.",
          sources: [{ url: NVD_URL, title: "NVD — CVE-2024-21412" }],
          confidence: "high",
          relevanceLevel: "high",
        },
      ],
      allowedSourceUrls: [NVD_URL, KEV_URL],
      allowedContentIds: new Set(),
    });

    assert.equal(result.passed, false);
    assert.ok(result.unsupportedClaims.some((claim) => claim.includes("KB9999999")));
  });

  it("keeps source allowlist validation working", () => {
    const result = auditGrounding({
      draft: buildArticleDraft({
        sourceMappings: [
          {
            sectionKey: "severity",
            claim: "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
            sourceUrls: ["https://evil.example/not-allowed"],
          },
        ],
      }),
      verifiedClaims: CVE_2024_21412_VERIFIED_CLAIMS,
      allowedSourceUrls: [NVD_URL, KEV_URL],
      allowedContentIds: new Set(),
    });

    assert.equal(result.passed, false);
    assert.ok(result.invalidSourceUrls.length > 0);
  });
});

describe("verified fact index normalization", () => {
  it("builds CVE, CVSS, KEV, and patch indexes from verified claims", () => {
    const index = buildVerifiedFactIndex([
      ...CVE_2024_21412_VERIFIED_CLAIMS,
      {
        id: "claim-patch",
        type: "patch_information",
        statement: "Apply vendor patch KB5034123 to address CVE-2024-21412.",
        sources: [{ url: NVD_URL, title: "NVD — CVE-2024-21412" }],
        confidence: "high",
        relevanceLevel: "high",
      },
    ]);

    assert.ok(index.cveIds.has("CVE-2024-21412"));
    assert.ok(index.cvssScores.get("CVE-2024-21412")?.has("8.1"));
    assert.ok(index.cvssSeverities.get("CVE-2024-21412")?.has("HIGH"));
    assert.ok(
      index.cvssVectors
        .get("CVE-2024-21412")
        ?.has(
          normalizeCvssVector(
            "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N",
          ),
        ),
    );
    assert.ok(index.kevListedCves.has("CVE-2024-21412"));
    assert.equal(index.kevAddedDates.get("CVE-2024-21412"), "2024-02-13");
    assert.ok(index.patchIds.has("KB5034123"));
  });
});
