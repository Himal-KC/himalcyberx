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
      hasInitialHydration: false,
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, true);
    assert.equal(view.showActiveRunWorkflow, false);
    assert.equal(view.showResumeRunsPanel, true);
    assert.equal(view.newTopicWorkflowFirst, true);
  });

  it("hides topic workflow while a restored active run is on screen", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: false,
      hasInitialHydration: true,
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, false);
    assert.equal(view.showActiveRunWorkflow, true);
    assert.equal(view.newTopicWorkflowFirst, false);
  });

  it("keeps new-run workflow visible even if hydration were stale while startNew is true", () => {
    const view = viewCore.resolveAgentTopicAnalyzerView({
      startNew: true,
      hasInitialHydration: true,
      resumableRunCount: 2,
    });

    assert.equal(view.showNewTopicWorkflow, true);
    assert.equal(view.showActiveRunWorkflow, false);
  });

  it("requires the topic analyzer to gate the rendered new-run workflow on view state", () => {
    const analyzerSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentTopicAnalyzer.tsx"),
      "utf8",
    );

    assert.match(analyzerSource, /resolveAgentTopicAnalyzerView/);
    assert.match(analyzerSource, /view\.showNewTopicWorkflow/);
    assert.match(analyzerSource, /view\.newTopicWorkflowFirst/);
    assert.ok(viewCore.newRunWorkflowMarkerPresent(analyzerSource));

    assert.match(analyzerSource, /view\.showNewTopicWorkflow/);
    assert.match(analyzerSource, /view\.newTopicWorkflowFirst/);
  });
});
