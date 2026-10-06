import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const core = (await import(
  pathToFileURL(join(testDir, "capabilities-core.ts")).href
)) as typeof import("./capabilities-core");

const readyInput = {
  tavilyConfigured: true,
  openAiConfigured: true,
  nvdConfigured: true,
  phase4Database: "ready" as const,
  phase5Database: "ready" as const,
};

describe("agent capabilities status core", () => {
  it("marks required env keys as not configured when absent", () => {
    assert.equal(
      core.resolveEnvApiKeyCapabilityState({ configured: false }),
      "not_configured",
    );
    assert.equal(
      core.resolveEnvApiKeyCapabilityState({ configured: true }),
      "ready",
    );
  });

  it("marks NVD as optional when absent", () => {
    assert.equal(
      core.resolveEnvApiKeyCapabilityState({
        configured: false,
        optionalWhenAbsent: true,
      }),
      "optional",
    );
  });

  it("classifies schema probe errors as not configured", () => {
    assert.equal(
      core.resolveDatabaseProbeCapabilityState({
        code: "PGRST204",
        message: "Could not find the 'research_payload' column",
      }),
      "not_configured",
    );
    assert.equal(
      core.resolveDatabaseProbeCapabilityState({
        code: "PGRST205",
        message: "Could not find the table 'public.agent_reviews'",
      }),
      "not_configured",
    );
  });

  it("classifies non-schema probe errors as unavailable", () => {
    assert.equal(
      core.resolveDatabaseProbeCapabilityState({
        code: "08006",
        message: "connection failure",
      }),
      "unavailable",
    );
    assert.equal(core.resolveDatabaseProbeCapabilityState(null), "ready");
  });

  it("returns READY when all required capabilities are ready", () => {
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus(readyInput),
      "READY",
    );
  });

  it("returns LIMITED when only NVD is optional", () => {
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus({
        ...readyInput,
        nvdConfigured: false,
      }),
      "LIMITED",
    );
  });

  it("returns NOT READY when Tavily or OpenAI is missing", () => {
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus({
        ...readyInput,
        tavilyConfigured: false,
      }),
      "NOT READY",
    );
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus({
        ...readyInput,
        openAiConfigured: false,
      }),
      "NOT READY",
    );
  });

  it("returns NOT READY when Phase 4 or Phase 5 database is not ready", () => {
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus({
        ...readyInput,
        phase4Database: "not_configured",
      }),
      "NOT READY",
    );
    assert.equal(
      core.resolveAgentCapabilitiesOverallStatus({
        ...readyInput,
        phase5Database: "unavailable",
      }),
      "NOT READY",
    );
  });

  it("builds a snapshot without exposing secret values", () => {
    const snapshot = core.buildAgentCapabilitiesStatusSnapshot({
      tavilyConfigured: false,
      openAiConfigured: true,
      nvdConfigured: false,
      phase4Database: "ready",
      phase5Database: "ready",
    });

    assert.equal(snapshot.overall, "NOT READY");
    assert.equal(snapshot.items.length, 5);
    assert.ok(
      snapshot.items.every(
        (item) =>
          !JSON.stringify(item).match(/sk-[A-Za-z0-9]/),
      ),
    );
    const nvd = snapshot.items.find((item) => item.id === "nvd");
    assert.equal(nvd?.state, "optional");
  });
});
