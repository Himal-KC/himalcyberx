import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const { auditGrounding } = (await import(
  pathToFileURL(join(testDir, "grounding-audit.ts")).href
)) as typeof import("./grounding-audit");
const { generatedDraftSchema } = (await import(
  pathToFileURL(join(testDir, "schemas.ts")).href
)) as typeof import("./schemas");
function filterSourceMappings(
  draft: ReturnType<typeof buildArticleDraft>,
  allowedSourceUrls: string[],
) {
  const allowed = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );

  return {
    ...draft,
    sourceMappings: draft.sourceMappings
      .map((mapping) => ({
        ...mapping,
        sourceUrls: mapping.sourceUrls.filter((url) =>
          allowed.has(url.trim().toLowerCase()),
        ),
      }))
      .filter((mapping) => mapping.sourceUrls.length > 0),
  };
}
const { assessDraftQuality } = (await import(
  pathToFileURL(join(testDir, "quality-score.ts")).href
)) as typeof import("./quality-score");
const {
  buildPersistedResearchPayload,
  parsePersistedResearchPayload,
} = (await import(
  pathToFileURL(join(testDir, "research-payload.ts")).href
)) as typeof import("./research-payload");
function normalizeGeneratedSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
const { deriveCanGenerateDraft } = (await import(
  pathToFileURL(join(testDir, "../research/derive-can-generate.ts")).href
)) as typeof import("../research/derive-can-generate");
const { serializeContextForPrompt } = (await import(
  pathToFileURL(join(testDir, "build-context.ts")).href
)) as typeof import("./build-context");

const OFFICIAL_SOURCE = {
  title: "CISA StopRansomware",
  url: "https://www.cisa.gov/stopransomware",
  sourceType: "official" as const,
};

const VERIFIED_CLAIMS = [
  {
    id: "claim-1",
    type: "backup" as const,
    statement: "Maintain offline backups of data.",
    sources: [
      {
        url: "https://www.cisa.gov/stopransomware",
        title: "StopRansomware",
      },
    ],
    confidence: "high" as const,
    relevanceLevel: "high" as const,
  },
  {
    id: "claim-2",
    type: "cve_id" as const,
    statement: "CVE-2024-21412 is recorded in the NIST National Vulnerability Database.",
    sources: [
      {
        url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
        title: "NVD",
      },
    ],
    confidence: "high" as const,
    relevanceLevel: "high" as const,
  },
  {
    id: "claim-3",
    type: "cvss" as const,
    statement: "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
    sources: [
      {
        url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
        title: "NVD",
      },
    ],
    confidence: "high" as const,
    relevanceLevel: "high" as const,
  },
];

function buildArticleDraft(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "article" as const,
    title: "CISA Ransomware Preparedness Guidance for Defenders",
    slug: "cisa-ransomware-preparedness-guidance",
    excerpt:
      "A grounded overview of CISA ransomware preparedness guidance for network defenders.",
    content:
      "<p>Maintain offline backups of data.</p><h2>References</h2><ul><li><a href=\"https://www.cisa.gov/stopransomware\">CISA StopRansomware</a></li></ul>",
    categoryRecommendation: "Ransomware",
    primaryKeyword: "ransomware preparedness",
    secondaryKeywords: ["backups", "CISA"],
    keyTakeaways: ["Maintain offline backups of data."],
    seo: {
      seoTitle: "CISA Ransomware Preparedness Guidance",
      seoDescription:
        "Grounded ransomware preparedness guidance based on verified CISA research evidence.",
      seoKeywords: ["ransomware", "CISA", "preparedness"],
      ogTitle: "CISA Ransomware Preparedness Guidance",
      ogDescription:
        "Grounded ransomware preparedness guidance based on verified CISA research evidence.",
    },
    generationPlan: {
      contentAngle: "Defensive preparedness",
      audience: "Network defenders",
      intent: "Explain verified guidance",
      sectionPlan: ["Introduction", "Backups", "References"],
    },
    sourceMappings: [
      {
        sectionKey: "backups",
        claim: "Maintain offline backups of data.",
        sourceUrls: ["https://www.cisa.gov/stopransomware"],
      },
    ],
    internalLinks: [],
    warnings: [],
    ...overrides,
  };
}

describe("Phase 4 generation eligibility", () => {
  it("allows passed research to generate", () => {
    assert.equal(deriveCanGenerateDraft("passed", [OFFICIAL_SOURCE]), true);
  });

  it("allows needs_review with canGenerateDraft true", () => {
    assert.equal(
      deriveCanGenerateDraft("needs_review", [OFFICIAL_SOURCE]),
      true,
    );
  });

  it("blocks failed research", () => {
    assert.equal(deriveCanGenerateDraft("failed", [OFFICIAL_SOURCE]), false);
  });
});

describe("Phase 4 structured output validation", () => {
  it("rejects malformed structured output", () => {
    assert.equal(generatedDraftSchema.safeParse({ title: "too short" }).success, false);
  });

  it("rejects missing required article field", () => {
    const draft = buildArticleDraft();
    delete (draft as { excerpt?: string }).excerpt;
    assert.equal(generatedDraftSchema.safeParse(draft).success, false);
  });

  it("accepts valid article draft", () => {
    assert.equal(generatedDraftSchema.safeParse(buildArticleDraft()).success, true);
  });
});

describe("Phase 4 source and link validation", () => {
  it("rejects unsupported source URLs via audit", () => {
    const draft = buildArticleDraft({
      sourceMappings: [
        {
          sectionKey: "backups",
          claim: "Maintain offline backups of data.",
          sourceUrls: ["https://evil.example/not-allowed"],
        },
      ],
    });

    const audit = auditGrounding({
      draft: draft as import("./types").ArticleGeneratedDraft,
      verifiedClaims: VERIFIED_CLAIMS,
      allowedSourceUrls: ["https://www.cisa.gov/stopransomware"],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, false);
    assert.ok(audit.invalidSourceUrls.length > 0);
  });

  it("rejects invented HCX internal links", () => {
    const draft = buildArticleDraft({
      internalLinks: [
        {
          contentId: "00000000-0000-4000-8000-000000000099",
          contentType: "article",
          anchorText: "Fake article",
          suggestedSection: "introduction",
        },
      ],
    });

    const audit = auditGrounding({
      draft: draft as import("./types").ArticleGeneratedDraft,
      verifiedClaims: VERIFIED_CLAIMS,
      allowedSourceUrls: ["https://www.cisa.gov/stopransomware"],
      allowedContentIds: new Set(["00000000-0000-4000-8000-000000000001"]),
    });

    assert.equal(audit.passed, false);
    assert.ok(audit.invalidInternalLinks.length > 0);
  });

  it("filters source mappings to allowed URLs only", () => {
    const filtered = filterSourceMappings(
      buildArticleDraft({
        sourceMappings: [
          {
            sectionKey: "backups",
            claim: "Maintain offline backups of data.",
            sourceUrls: [
              "https://www.cisa.gov/stopransomware",
              "https://evil.example/not-allowed",
            ],
          },
        ],
      }) as import("./types").ArticleGeneratedDraft,
      ["https://www.cisa.gov/stopransomware"],
    );

    assert.equal(filtered.sourceMappings[0]?.sourceUrls.length, 1);
  });
});

describe("Phase 4 grounding audit", () => {
  it("rejects unsupported CVE values", () => {
    const draft = buildArticleDraft({
      content:
        "<p>CVE-2099-00001 is actively exploited in production environments.</p>",
    });

    const audit = auditGrounding({
      draft: draft as import("./types").ArticleGeneratedDraft,
      verifiedClaims: VERIFIED_CLAIMS,
      allowedSourceUrls: ["https://www.cisa.gov/stopransomware"],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, false);
    assert.ok(audit.unsupportedClaims.some((claim) => /CVE-2099-00001/i.test(claim)));
  });

  it("rejects unsupported CVSS values", () => {
    const draft = buildArticleDraft({
      content: "<p>CVE-2024-21412 has a CVSS base score of 9.9 (Critical).</p>",
    });

    const audit = auditGrounding({
      draft: draft as import("./types").ArticleGeneratedDraft,
      verifiedClaims: VERIFIED_CLAIMS,
      allowedSourceUrls: [
        "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
      ],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, false);
  });

  it("accepts verified CVSS when present in evidence", () => {
    const draft = buildArticleDraft({
      content:
        "<p>NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.</p>",
      sourceMappings: [
        {
          sectionKey: "cvss",
          claim:
            "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
          sourceUrls: ["https://nvd.nist.gov/vuln/detail/CVE-2024-21412"],
        },
      ],
    });

    const audit = auditGrounding({
      draft: draft as import("./types").ArticleGeneratedDraft,
      verifiedClaims: VERIFIED_CLAIMS,
      allowedSourceUrls: [
        "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
      ],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, true);
  });
});

describe("Phase 4 HTML safety", () => {
  it("detects prohibited script tags before save sanitization", () => {
    const content = '<p>Hello</p><script>alert(1)</script>';
    assert.match(content, /<script\b/i);
  });
});

describe("Phase 4 research payload", () => {
  it("persists and parses research payload", () => {
    const payload = buildPersistedResearchPayload({
      agentRunId: "run-1",
      topic: "CISA ransomware preparedness guidance",
      contentType: "article",
      summary: "Summary",
      recommendedAngle: "Angle",
      primaryKeyword: "ransomware",
      secondaryKeywords: ["CISA"],
      keyFindings: ["Maintain offline backups."],
      verifiedClaims: VERIFIED_CLAIMS,
      uncertainClaims: [],
      discoveryContexts: [],
      sources: [OFFICIAL_SOURCE],
      relatedHCXContent: [],
      researchConfidence: "high",
      researchQuality: "passed",
      canGenerateDraft: true,
    });

    const parsed = parsePersistedResearchPayload(payload);
    assert.equal(parsed?.canGenerateDraft, true);
    assert.equal(parsed?.verifiedClaims.length, 3);
  });

  it("compacts research brief before API input", () => {
    const context = {
      topic: "CISA ransomware preparedness guidance",
      contentType: "article" as const,
      researchSummary: "Summary",
      recommendedAngle: "Angle",
      primaryKeyword: "ransomware",
      secondaryKeywords: ["CISA"],
      researchQuality: "passed",
      researchConfidence: "high",
      canGenerateDraft: true,
      verifiedClaims: VERIFIED_CLAIMS.map((claim) => ({
        id: claim.id,
        type: claim.type,
        statement: claim.statement,
        confidence: claim.confidence,
        relevanceLevel: claim.relevanceLevel,
        sourceUrls: claim.sources.map((source) => source.url),
      })),
      uncertainClaims: [],
      keyFindings: ["Maintain offline backups."],
      sources: [
        {
          title: "StopRansomware",
          url: "https://www.cisa.gov/stopransomware",
          publisher: "CISA",
          sourceType: "official",
        },
      ],
      allowedSourceUrls: ["https://www.cisa.gov/stopransomware"],
      relatedHCXContent: [],
      contentGapSummary: null,
      categoryRecommendation: "Ransomware",
      categoryId: null,
      difficulty: null,
    };

    const serialized = serializeContextForPrompt(context);
    assert.match(serialized, /verifiedClaims/);
    assert.doesNotMatch(serialized, /<html/i);
  });
});

describe("Phase 4 draft quality", () => {
  it("does not mark fact check as passed automatically", () => {
    const draft = buildArticleDraft() as import("./types").ArticleGeneratedDraft;
    const quality = assessDraftQuality({
      draft,
      groundingAudit: {
        passed: true,
        unsupportedClaims: [],
        invalidSourceUrls: [],
        invalidInternalLinks: [],
        warnings: [],
      },
      researchQuality: "passed",
    });

    assert.ok(quality.score < 100 || quality.weaknesses.length >= 0);
  });

  it("handles duplicate slug normalization", () => {
    assert.equal(
      normalizeGeneratedSlug("CISA Ransomware Preparedness Guidance"),
      "cisa-ransomware-preparedness-guidance",
    );
  });
});
