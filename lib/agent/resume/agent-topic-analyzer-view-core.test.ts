import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const viewCore = (await import(
  pathToFileURL(join(testDir, "agent-topic-analyzer-view-core.ts")).href
)) as typeof import("./agent-topic-analyzer-view-core");

describe("Agent topic analyzer view", () => {
  it("shows fresh topic workflow in explicit new-run mode with resume list still available", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: true,
      hydrationPhase: "none",
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, true);
    assert.equal(view.showActiveRunWorkflow, false);
    assert.equal(view.showRestoredResearchWorkflow, false);
    assert.equal(view.showResumeRunsPanel, true);
    assert.equal(view.newTopicWorkflowFirst, true);
  });

  it("hides topic workflow while a restored draft workflow run is on screen", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: false,
      hydrationPhase: "draft_workflow",
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, false);
    assert.equal(view.showActiveRunWorkflow, true);
    assert.equal(view.showRestoredResearchWorkflow, false);
    assert.equal(view.newTopicWorkflowFirst, false);
  });

  it("shows restored research workflow after reload of a research-stage run without a draft", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: false,
      hydrationPhase: "research",
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, false);
    assert.equal(view.showActiveRunWorkflow, false);
    assert.equal(view.showRestoredResearchWorkflow, true);
  });

  it("keeps new-run workflow visible while startNew is true", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: true,
      hydrationPhase: "draft_workflow",
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, true);
    assert.equal(view.showActiveRunWorkflow, false);
    assert.equal(view.showRestoredResearchWorkflow, false);
  });

  it("requires the topic analyzer to render restored research results for research hydration", () => {
    const analyzerSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentTopicAnalyzer.tsx"),
      "utf8",
    );

    assert.match(analyzerSource, /resolveAgentTopicAnalyzerView/);
    assert.match(analyzerSource, /view\.showRestoredResearchWorkflow/);
    assert.match(
      analyzerSource,
      /showRestoredResearchWorkflow[\s\S]{0,200}AgentResearchResults/,
    );
    assert.match(analyzerSource, /view\.showNewTopicWorkflow/);
    assert.match(analyzerSource, /view\.newTopicWorkflowFirst/);
    assert.ok(viewCore.newRunWorkflowMarkerPresent(analyzerSource));
    assert.doesNotMatch(
      analyzerSource,
      /hydrationError[\s\S]{0,120}No draft exists for this research run/,
    );
  });
});
