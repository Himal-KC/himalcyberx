import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const workflowUi = (await import(
  pathToFileURL(join(testDir, "research-workflow-ui-core.ts")).href
)) as typeof import("./research-workflow-ui-core");

type ResearchWorkflowUiInput =
  import("./research-workflow-ui-core").ResearchWorkflowUiInput;

const officialSource = {
  url: "https://www.cisa.gov/stopransomware",
  title: "StopRansomware",
  sourceType: "official" as const,
};

function baseInput(
  overrides: Partial<ResearchWorkflowUiInput> = {},
): ResearchWorkflowUiInput {
  return {
    researchQuality: "needs_review",
    researchConfidence: "low",
    sources: [officialSource],
    canGenerateDraft: false,
    researchSufficiency: {
      status: "needs_more_research",
      score: 40,
      reasons: [],
      supportedIntentAreas: [],
      missingIntentAreas: ["mitigation"],
      verifiedClaimCount: 1,
      authoritativeSourceCount: 1,
      topicRelevantClaimCount: 1,
    },
    hasLinkedDraft: false,
    researchImprovementCount: 0,
    ...overrides,
  };
}

describe("research workflow UI core", () => {
  it("shows improve-before-draft banner only before draft generation", () => {
    assert.equal(
      workflowUi.shouldShowImproveBeforeDraftBanner({
        hasLinkedDraft: false,
        researchSufficiency: { status: "needs_more_research" } as never,
      }),
      true,
    );
    assert.equal(
      workflowUi.shouldShowImproveBeforeDraftBanner({
        hasLinkedDraft: true,
        researchSufficiency: { status: "needs_more_research" } as never,
      }),
      false,
    );
  });

  it("never enables generate draft unless canGenerateDraft is true", () => {
    const blocked = workflowUi.resolveResearchGenerateDraftUi(
      baseInput({ canGenerateDraft: false }),
    );
    assert.equal(blocked.enabled, false);

    const allowed = workflowUi.resolveResearchGenerateDraftUi(
      baseInput({
        canGenerateDraft: true,
        researchSufficiency: {
          status: "sufficient",
          score: 90,
          reasons: [],
          supportedIntentAreas: ["mitigation"],
          missingIntentAreas: [],
          verifiedClaimCount: 4,
          authoritativeSourceCount: 2,
          topicRelevantClaimCount: 4,
        },
      }),
    );
    assert.equal(allowed.enabled, true);
    assert.equal(allowed.showNeedsReviewAllowedNotice, true);
  });

  it("uses the required headline when more research is needed", () => {
    const ui = workflowUi.resolveResearchGenerateDraftUi(baseInput());
    assert.equal(ui.blockedHeadline, workflowUi.IMPROVE_BEFORE_DRAFT_HEADLINE);
    assert.equal(ui.helperMessage, workflowUi.IMPROVE_BEFORE_DRAFT_HEADLINE);
  });

  it("hides improve research after a draft exists", () => {
    assert.equal(
      workflowUi.canShowImproveResearchAction(
        baseInput({ hasLinkedDraft: true }),
      ),
      false,
    );
    assert.equal(
      workflowUi.canShowImproveResearchAction(baseInput({ hasLinkedDraft: false })),
      true,
    );
  });

  it("shows post-draft insufficient evidence guidance with exact copy constant", () => {
    assert.equal(
      workflowUi.shouldShowPostDraftInsufficientEvidence(
        baseInput({ hasLinkedDraft: true }),
      ),
      true,
    );
    assert.equal(
      workflowUi.POST_DRAFT_INSUFFICIENT_EVIDENCE_MESSAGE,
      "Start a new research run to improve the evidence. This draft is tied to the original research evidence.",
    );
  });

  it("generate draft component gates on server canGenerateDraft only", () => {
    const source = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentGenerateDraft.tsx"),
      "utf8",
    );
    assert.match(source, /resolveResearchGenerateDraftUi/);
    assert.match(source, /research\.canGenerateDraft/);
    assert.doesNotMatch(source, /canGenerateDraft\s*=\s*true/);
  });
});
