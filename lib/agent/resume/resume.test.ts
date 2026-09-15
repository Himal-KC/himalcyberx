import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import type { AgentRun, AgentContentType } from "../../supabase/types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildResumableAgentRunSummary,
  buildResearchResultFromPersistedRun,
  buildResumedAgentRunResult,
  getRunLinkedContentId,
  isResumableAgentRun,
  isValidAgentRunId,
  parseAgentRunPageQuery,
  selectAutoRestoreAgentRunId,
  validateContentBelongsToRun,
  validateResumeAgentRunInput,
} = (await import(pathToFileURL(join(testDir, "resume-core.ts")).href)) as typeof import("./resume-core");

const VALID_RUN_ID = "00000000-0000-4000-8000-000000000001";
const VALID_ARTICLE_ID = "00000000-0000-4000-8000-000000000010";
const VALID_TUTORIAL_ID = "00000000-0000-4000-8000-000000000020";
const VALID_LAB_ID = "00000000-0000-4000-8000-000000000030";

const RESEARCH_PAYLOAD = {
  keyFindings: ["Verified finding."],
  verifiedClaims: [
    {
      id: "claim-1",
      type: "general",
      statement: "Verified statement.",
      sources: [{ url: "https://example.com", title: "Example" }],
      confidence: "high",
    },
  ],
  uncertainClaims: [],
  discoveryContexts: [],
  relatedHCXContent: [],
  researchConfidence: "high",
  researchQuality: "passed",
  canGenerateDraft: true,
};

function buildRun(
  overrides: Partial<AgentRun> & { content_type: AgentContentType },
): AgentRun {
  const { content_type, ...rest } = overrides;

  return {
    id: VALID_RUN_ID,
    topic: "CVE-2024-21412 guidance",
    content_type,
    status: "ready",
    stage: "ready",
    article_id: null,
    tutorial_id: null,
    lab_id: null,
    research_summary: "Summary",
    recommended_angle: "Angle",
    primary_keyword: "CVE-2024-21412",
    secondary_keywords: [],
    research_payload: RESEARCH_PAYLOAD,
    generation_metadata: null,
    quality_score: 88,
    fact_check_status: "pending",
    error_message: null,
    started_at: "2026-09-15T00:00:00.000Z",
    completed_at: "2026-09-15T00:10:00.000Z",
    created_at: "2026-09-15T00:00:00.000Z",
    updated_at: "2026-09-15T00:10:00.000Z",
    ...rest,
  };
}

describe("Agent run resume core", () => {
  it("accepts article runs with linked draft and research payload", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
    });

    assert.equal(isResumableAgentRun(run), true);
    assert.equal(getRunLinkedContentId(run), VALID_ARTICLE_ID);

    const summary = buildResumableAgentRunSummary({
      run,
      draftTitle: "Article draft title",
    });
    assert.equal(summary?.agentRunId, VALID_RUN_ID);
    assert.equal(summary?.draftTitle, "Article draft title");
  });

  it("accepts tutorial and lab runs with linked drafts", () => {
    const tutorial = buildRun({
      content_type: "tutorial",
      tutorial_id: VALID_TUTORIAL_ID,
    });
    const lab = buildRun({
      content_type: "lab",
      lab_id: VALID_LAB_ID,
    });

    assert.equal(isResumableAgentRun(tutorial), true);
    assert.equal(isResumableAgentRun(lab), true);
  });

  it("rejects invalid run IDs", () => {
    assert.equal(isValidAgentRunId("not-a-uuid"), false);
    assert.equal(
      validateResumeAgentRunInput({
        agentRunId: "bad-id",
        run: null,
        content: null,
        hasResearchPayload: false,
        hasDraftSnapshot: false,
      }).valid,
      false,
    );
  });

  it("rejects runs with missing linked draft", () => {
    const run = buildRun({ content_type: "article", article_id: null });
    assert.equal(isResumableAgentRun(run), false);

    const validation = validateResumeAgentRunInput({
      agentRunId: VALID_RUN_ID,
      run,
      content: null,
      hasResearchPayload: true,
      hasDraftSnapshot: true,
    });

    assert.equal(validation.valid, false);
    if (!validation.valid) {
      assert.match(validation.error, /No draft exists/i);
    }
  });

  it("rejects mismatched content and run relationships", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
    });

    const validation = validateResumeAgentRunInput({
      agentRunId: VALID_RUN_ID,
      run,
      content: {
        id: VALID_ARTICLE_ID,
        title: "Draft",
        slug: "draft",
        status: "draft",
        agent_run_id: "00000000-0000-4000-8000-000000000099",
      },
      hasResearchPayload: true,
      hasDraftSnapshot: true,
    });

    assert.equal(validation.valid, false);
    if (!validation.valid) {
      assert.match(validation.error, /does not belong/i);
    }
  });

  it("validates matching content belongs to the run", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
    });

    assert.equal(
      validateContentBelongsToRun({
        run,
        content: {
          id: VALID_ARTICLE_ID,
          title: "Draft",
          slug: "draft",
          status: "draft",
          agent_run_id: VALID_RUN_ID,
        },
      }),
      true,
    );
  });

  it("preserves the original agent_run_id in resumed results", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
    });

    const resumed = buildResumedAgentRunResult({
      run,
      draft: {
        contentId: VALID_ARTICLE_ID,
        contentType: "article",
        editUrl: `/admin/articles/${VALID_ARTICLE_ID}/edit`,
        previewUrl: `/admin/articles/${VALID_ARTICLE_ID}/preview`,
        title: "Draft title",
        slug: "draft-title",
        factCheckStatus: "pending",
        qualityScore: 88,
        warnings: [],
        existingDraft: true,
      },
      latestReview: null,
      featuredImage: { url: null, alt: null },
      latestReadiness: null,
    });

    assert.equal(resumed.agentRunId, VALID_RUN_ID);
  });

  it("rejects runs without persisted research payload", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      research_payload: null,
    });

    const validation = validateResumeAgentRunInput({
      agentRunId: VALID_RUN_ID,
      run,
      content: {
        id: VALID_ARTICLE_ID,
        title: "Draft",
        slug: "draft",
        status: "draft",
        agent_run_id: VALID_RUN_ID,
      },
      hasResearchPayload: false,
      hasDraftSnapshot: true,
    });

    assert.equal(validation.valid, false);
  });
});

describe("Agent run resume server module boundaries", () => {
  it("does not import research or generation engines", () => {
    const source = readFileSync(join(testDir, "resume-run.ts"), "utf8");

    assert.equal(source.includes("runAgentResearch"), false);
    assert.equal(source.includes("runAgentGeneration"), false);
    assert.equal(source.includes("createAgentRun"), false);
    assert.equal(source.includes("reviewDraftWithOpenAi"), false);
  });

  it("uses existing persisted loaders for resume validation", () => {
    const source = readFileSync(join(testDir, "resume-run.ts"), "utf8");

    assert.match(source, /loadReviewRunContext/);
    assert.match(source, /getAgentRun/);
    assert.match(source, /getLatestAgentReviewForRun/);
    assert.match(source, /getExistingDraftFromRun/);
  });
});

describe("Agent run refresh restore", () => {
  it("parses stable page query params for run restore and new-topic mode", () => {
    assert.deepEqual(parseAgentRunPageQuery({ run: VALID_RUN_ID }), {
      startNew: false,
      requestedRunId: VALID_RUN_ID,
    });
    assert.deepEqual(parseAgentRunPageQuery({ new: "1", run: VALID_RUN_ID }), {
      startNew: true,
      requestedRunId: null,
    });
    assert.deepEqual(parseAgentRunPageQuery({}), {
      startNew: false,
      requestedRunId: null,
    });
  });

  it("auto-selects the most recent unfinished resumable run", () => {
    const olderUnfinished = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      id: "00000000-0000-4000-8000-000000000002",
      updated_at: "2026-09-14T00:00:00.000Z",
      status: "ready",
      stage: "fact_check",
    });
    const newerUnfinished = buildRun({
      content_type: "tutorial",
      tutorial_id: VALID_TUTORIAL_ID,
      id: "00000000-0000-4000-8000-000000000003",
      updated_at: "2026-09-15T00:00:00.000Z",
      status: "ready",
      stage: "ready",
    });
    const completed = buildRun({
      content_type: "lab",
      lab_id: VALID_LAB_ID,
      id: "00000000-0000-4000-8000-000000000004",
      updated_at: "2026-09-16T00:00:00.000Z",
      status: "completed",
      stage: "completed",
    });

    assert.equal(
      selectAutoRestoreAgentRunId([completed, newerUnfinished, olderUnfinished]),
      newerUnfinished.id,
    );
  });

  it("does not auto-select failed, cancelled, or completed-only runs", () => {
    const failed = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      status: "failed",
      stage: "failed",
    });
    const cancelled = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      status: "cancelled",
      stage: "ready",
    });
    const completed = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      status: "completed",
      stage: "completed",
    });

    assert.equal(selectAutoRestoreAgentRunId([failed]), null);
    assert.equal(selectAutoRestoreAgentRunId([cancelled]), null);
    assert.equal(selectAutoRestoreAgentRunId([completed]), null);
  });

  it("builds persisted research results without external calls", () => {
    const run = buildRun({
      content_type: "article",
      article_id: VALID_ARTICLE_ID,
      research_summary: "Summary",
      recommended_angle: "Angle",
      primary_keyword: "keyword",
      secondary_keywords: ["a", "b"],
    });

    const research = buildResearchResultFromPersistedRun({
      run,
      payload: RESEARCH_PAYLOAD as import("../generation/types").PersistedResearchPayload,
      sources: [
        {
          title: "Example",
          url: "https://example.com",
          publisher: "Example",
        },
      ],
    });

    assert.equal(research.agentRunId, VALID_RUN_ID);
    assert.equal(research.summary, "Summary");
    assert.equal(research.sources.length, 1);
    assert.equal(research.canGenerateDraft, true);
  });
});

describe("Agent run refresh server contracts", () => {
  it("resolves page hydration server-side from query params and shared loader", () => {
    const pageSource = readFileSync(
      join(testDir, "../../../app/admin/(dashboard)/agent/page.tsx"),
      "utf8",
    );
    assert.match(pageSource, /resolveAgentPageHydration/);
    assert.match(pageSource, /parseAgentRunPageQuery/);
    assert.match(pageSource, /searchParams/);

    const resumeSource = readFileSync(join(testDir, "resume-run.ts"), "utf8");
    assert.match(resumeSource, /resolveAgentPageHydration/);
    assert.match(resumeSource, /hydratePersistedAgentRun/);
    assert.match(resumeSource, /getAgentSources/);
    assert.match(resumeSource, /buildResearchResultFromPersistedRun/);
    assert.doesNotMatch(resumeSource, /runAgentResearch|runAgentReview|runAgentReadinessEvaluation|runAgentContentPublication/);
  });

  it("uses URL navigation for manual resume and new-topic reset", () => {
    const resumePanel = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentResumeRuns.tsx"),
      "utf8",
    );
    assert.match(resumePanel, /\/admin\/agent\?run=\$\{run\.agentRunId\}/);

    const analyzerSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentTopicAnalyzer.tsx"),
      "utf8",
    );
    assert.match(analyzerSource, /\/admin\/agent\?new=1/);
    assert.match(analyzerSource, /router\.replace\(`\/admin\/agent\?run=/);
    assert.match(analyzerSource, /AgentActiveRunWorkflow/);
    assert.match(analyzerSource, /initialHydration/);
  });

  it("restores phase panels read-only without mutating runs on page load", () => {
    const workflowSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentActiveRunWorkflow.tsx"),
      "utf8",
    );
    assert.match(workflowSource, /AgentReviewPanel/);
    assert.match(workflowSource, /initialReadiness/);
    assert.match(workflowSource, /initialPublish/);
    assert.match(workflowSource, /AgentResearchResults/);
    assert.doesNotMatch(workflowSource, /resumeAgentRun|runAgentResearch/);

    const resumeSource = readFileSync(join(testDir, "resume-run.ts"), "utf8");
    assert.doesNotMatch(
      resumeSource,
      /resolveAgentPageHydration[\s\S]{0,400}updateAgentRun/,
    );
  });
});

describe("Agent resume action auth boundary", () => {
  it("requires authenticated admin wrapper in resumeAgentRun action", () => {
    const source = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );

    assert.match(source, /resumeAgentRun/);
    assert.match(source, /getAuthenticatedServerClient\("resumeAgentRun"\)/);
    assert.match(source, /resumePersistedAgentRun/);
  });
});
