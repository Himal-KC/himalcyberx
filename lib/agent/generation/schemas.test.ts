import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const richHtmlFixture =
  "<p>Maintain offline backups of data and test restoration procedures regularly in authorized environments.</p>";

const schemas = (await import(
  pathToFileURL(join(testDir, "schemas.ts")).href
)) as typeof import("./schemas");
const validateOutputCore = (await import(
  pathToFileURL(join(testDir, "validate-output-core.ts")).href
)) as typeof import("./validate-output-core");
const { auditGrounding } = (await import(
  pathToFileURL(join(testDir, "grounding-audit.ts")).href
)) as typeof import("./grounding-audit");

function buildArticleDraft(overrides: Partial<ReturnType<typeof buildArticleDraftBase>> = {}) {
  return {
    ...buildArticleDraftBase(),
    ...overrides,
  };
}

function buildArticleDraftBase() {
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
  };
}

function buildTutorialDraft() {
  const article = buildArticleDraft();
  return {
    contentType: "tutorial" as const,
    title: article.title,
    slug: article.slug,
    description: article.excerpt,
    category: "Ransomware",
    difficulty: "Intermediate" as const,
    estimatedTime: "45 minutes",
    requirements: richHtmlFixture,
    introduction: richHtmlFixture,
    instructions: richHtmlFixture,
    keyTakeaways: richHtmlFixture,
    securityNotes: richHtmlFixture,
    primaryKeyword: article.primaryKeyword,
    secondaryKeywords: article.secondaryKeywords,
    seo: article.seo,
    generationPlan: article.generationPlan,
    sourceMappings: article.sourceMappings,
    internalLinks: article.internalLinks,
    warnings: article.warnings,
  };
}

function buildLabDraft() {
  const tutorial = buildTutorialDraft();
  return {
    contentType: "lab" as const,
    title: tutorial.title,
    slug: tutorial.slug,
    description: tutorial.description,
    category: tutorial.category,
    difficulty: tutorial.difficulty,
    estimatedTime: tutorial.estimatedTime,
    learningObjectives: richHtmlFixture,
    requirementsTools: richHtmlFixture,
    introduction: tutorial.introduction,
    instructions: tutorial.instructions,
    expectedResult: richHtmlFixture,
    securityNotes: tutorial.securityNotes,
    primaryKeyword: tutorial.primaryKeyword,
    secondaryKeywords: tutorial.secondaryKeywords,
    seo: tutorial.seo,
    generationPlan: tutorial.generationPlan,
    sourceMappings: tutorial.sourceMappings,
    internalLinks: tutorial.internalLinks,
    warnings: tutorial.warnings,
  };
}

describe("Phase 4 OpenAI schema selection", () => {
  it("uses article object schema for article content type", () => {
    const schema = schemas.getContentTypeDraftSchema("article");
    assert.equal(schema, schemas.articleGeneratedDraftSchema);
    assert.equal(schemas.isRootObjectZodSchema(schema), true);
    assert.equal(
      schemas.getOpenAiDraftFormatName("article"),
      "hcx_article_draft",
    );
  });

  it("uses tutorial object schema for tutorial content type", () => {
    const schema = schemas.getContentTypeDraftSchema("tutorial");
    assert.equal(schema, schemas.tutorialGeneratedDraftSchema);
    assert.equal(schemas.isRootObjectZodSchema(schema), true);
    assert.equal(
      schemas.getOpenAiDraftFormatName("tutorial"),
      "hcx_tutorial_draft",
    );
  });

  it("uses lab object schema for lab content type", () => {
    const schema = schemas.getContentTypeDraftSchema("lab");
    assert.equal(schema, schemas.labGeneratedDraftSchema);
    assert.equal(schemas.isRootObjectZodSchema(schema), true);
    assert.equal(
      schemas.getOpenAiDraftFormatName("lab"),
      "hcx_lab_draft",
    );
  });

  it("does not pass the top-level discriminated union to OpenAI format", () => {
    assert.equal(
      schemas.isDiscriminatedUnionZodSchema(schemas.generatedDraftSchema),
      true,
    );

    for (const contentType of ["article", "tutorial", "lab"] as const) {
      const schema = schemas.getContentTypeDraftSchema(contentType);
      assert.notEqual(schema, schemas.generatedDraftSchema);
      assert.equal(schemas.isRootObjectZodSchema(schema), true);
      assert.equal(schemas.isDiscriminatedUnionZodSchema(schema), false);
    }
  });

  it("parses article output as ArticleGeneratedDraft", () => {
    const parsed = schemas.parseArticleDraftOutput(buildArticleDraft());
    assert.ok(parsed);
    assert.equal(parsed?.contentType, "article");
  });

  it("parses tutorial output as TutorialGeneratedDraft", () => {
    const parsed = schemas.parseTutorialDraftOutput(buildTutorialDraft());
    assert.ok(parsed);
    assert.equal(parsed?.contentType, "tutorial");
  });

  it("parses lab output as LabGeneratedDraft", () => {
    const parsed = schemas.parseLabDraftOutput(buildLabDraft());
    assert.ok(parsed);
    assert.equal(parsed?.contentType, "lab");
  });

  it("rejects malformed structured output", () => {
    assert.equal(
      schemas.parseArticleDraftOutput({ title: "too short" }),
      null,
    );
  });

  it("keeps grounding audit behavior unchanged", () => {
    const draft = buildArticleDraft();
    const audit = auditGrounding({
      draft,
      verifiedClaims: [
        {
          id: "claim-1",
          type: "backup",
          statement: "Maintain offline backups of data.",
          sources: [
            {
              url: "https://www.cisa.gov/stopransomware",
              title: "StopRansomware",
            },
          ],
          confidence: "high",
          relevanceLevel: "high",
        },
      ],
      allowedSourceUrls: ["https://www.cisa.gov/stopransomware"],
      allowedContentIds: new Set(),
    });

    assert.equal(audit.passed, true);
  });

  it("uses Structured Outputs-compatible plain strings for sourceUrls", () => {
    for (const contentType of ["article", "tutorial", "lab"] as const) {
      const schema = schemas.getContentTypeDraftSchema(contentType);
      assert.equal(schemas.hasOpenAiIncompatibleStringFormats(schema), false);
    }

    const draftWithMalformedUrl = buildArticleDraft({
      sourceMappings: [
        {
          sectionKey: "backups",
          claim: "Maintain offline backups of data.",
          sourceUrls: ["not-a-url"],
        },
      ],
    });
    assert.equal(
      schemas.articleGeneratedDraftSchema.safeParse(draftWithMalformedUrl).success,
      true,
    );
  });

  it("rejects malformed source URLs server-side", () => {
    const draft = buildArticleDraft({
      sourceMappings: [
        {
          sectionKey: "backups",
          claim: "Maintain offline backups of data.",
          sourceUrls: ["not-a-url"],
        },
      ],
    });

    const error = validateOutputCore.validateDraftReferences(
      draft,
      ["https://www.cisa.gov/stopransomware"],
      new Set(),
    );

    assert.equal(error, "Generated output contained a malformed source URL.");
  });

  it("rejects source URLs outside the research allowlist server-side", () => {
    const draft = buildArticleDraft({
      sourceMappings: [
        {
          sectionKey: "backups",
          claim: "Maintain offline backups of data.",
          sourceUrls: ["https://evil.example/not-allowed"],
        },
      ],
    });

    const error = validateOutputCore.validateDraftReferences(
      draft,
      ["https://www.cisa.gov/stopransomware"],
      new Set(),
    );

    assert.equal(
      error,
      "Generated output referenced a source URL outside the research allowlist.",
    );
  });

  it("accepts valid supplied source URLs server-side", () => {
    const error = validateOutputCore.validateDraftReferences(
      buildArticleDraft(),
      ["https://www.cisa.gov/stopransomware"],
      new Set(),
    );

    assert.equal(error, null);
  });
});
