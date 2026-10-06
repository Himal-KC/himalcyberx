import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const searchQueries = (await import(
  pathToFileURL(join(testDir, "search-queries-core.ts")).href
)) as typeof import("./search-queries-core");

const sufficiency = (await import(
  pathToFileURL(join(testDir, "research-sufficiency-core.ts")).href
)) as typeof import("./research-sufficiency-core");

const resumeCore = (await import(
  pathToFileURL(join(testDir, "../resume/resume-core.ts")).href
)) as typeof import("../resume/resume-core");

const CITRIX_TOPIC =
  "Citrix NetScaler CVE-2026-88771: Security Analysis and Mitigation Guidance";

describe("Improve research query derivation", () => {
  it("derives follow-up queries when needs_more_research has no missing intent areas", () => {
    const assessment = {
      status: "needs_more_research" as const,
      missingIntentAreas: [],
      reasons: ["Research confidence is too low for grounded draft generation."],
      topicRelevantClaimCount: 12,
      authoritativeSourceCount: 2,
    };

    const queries = searchQueries.buildImproveResearchQueries(
      CITRIX_TOPIC,
      assessment,
    );

    assert.ok(queries.length > 0);
    assert.ok(
      queries.some((query) => /88771|Citrix|NetScaler/i.test(query)),
    );
  });

  it("returns no queries for sufficient research", () => {
    const queries = searchQueries.buildImproveResearchQueries(CITRIX_TOPIC, {
      status: "sufficient",
      missingIntentAreas: [],
      reasons: [],
      topicRelevantClaimCount: 12,
      authoritativeSourceCount: 2,
    });

    assert.deepEqual(queries, []);
  });

  it("keeps draft generation blocked while enabling bounded improve queries", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: CITRIX_TOPIC,
      contentType: "article",
      recommendedAngle: "Security analysis",
      verifiedClaims: Array.from({ length: 12 }, (_, index) => ({
        id: `claim-${index}`,
        type: "mitigation" as const,
        statement: `Citrix NetScaler CVE-2026-88771 mitigation detail ${index}.`,
        sources: [
          {
            url: "https://www.cisa.gov/advisory",
            title: "CISA Advisory",
            publisher: "CISA",
          },
        ],
        confidence: "medium" as const,
        relevanceLevel: "high" as const,
      })),
      uncertainClaims: [],
      sources: [
        {
          url: "https://www.cisa.gov/advisory",
          title: "CISA Advisory",
          publisher: "CISA",
          sourceType: "official" as const,
        },
      ],
      researchConfidence: "low",
      researchQuality: "needs_review",
      researchImprovementCount: 0,
    });

    assert.equal(assessment.status, "needs_more_research");
    assert.equal(assessment.missingIntentAreas.length, 0);

    const queries = searchQueries.buildImproveResearchQueries(
      CITRIX_TOPIC,
      assessment,
    );
    assert.ok(queries.length > 0);
    assert.notEqual(assessment.status, "sufficient");
  });

  it("recomputes sufficiency after research-stage hydration with executable improve queries", () => {
    const run = {
      id: "00000000-0000-4000-8000-000000000099",
      topic: CITRIX_TOPIC,
      content_type: "article" as const,
      status: "ready" as const,
      stage: "planning" as const,
      article_id: null,
      tutorial_id: null,
      lab_id: null,
      research_summary: "Summary",
      recommended_angle: "Angle",
      primary_keyword: "CVE-2026-88771",
      secondary_keywords: [],
      research_payload: {
        keyFindings: ["Finding"],
        verifiedClaims: [],
        uncertainClaims: [],
        discoveryContexts: [],
        relatedHCXContent: [],
        researchConfidence: "low",
        researchQuality: "needs_review",
        canGenerateDraft: false,
        researchSufficiency: {
          status: "needs_more_research",
          score: 50,
          reasons: ["Research confidence is too low for grounded draft generation."],
          supportedIntentAreas: ["Topic-specific subject coverage"],
          missingIntentAreas: [],
          verifiedClaimCount: 12,
          authoritativeSourceCount: 1,
          topicRelevantClaimCount: 12,
        },
        researchImprovementCount: 0,
      },
      generation_metadata: null,
      quality_score: null,
      fact_check_status: "pending" as const,
      error_message: null,
      started_at: "2026-09-15T00:00:00.000Z",
      completed_at: null,
      created_at: "2026-09-15T00:00:00.000Z",
      updated_at: "2026-09-15T00:00:00.000Z",
    };

    assert.equal(resumeCore.resolveAgentRunHydrationPhase(run), "research");

    const research = resumeCore.buildResearchResultFromPersistedRun({
      run,
      payload: run.research_payload as never,
      sources: [
        {
          url: "https://www.cisa.gov/advisory",
          title: "CISA Advisory",
          publisher: "CISA",
          sourceType: "official",
        },
      ],
    });

    assert.equal(research.researchSufficiency?.status, "needs_more_research");
    const queries = searchQueries.buildImproveResearchQueries(
      research.topic,
      research.researchSufficiency!,
    );
    assert.ok(queries.length > 0);
  });
});
