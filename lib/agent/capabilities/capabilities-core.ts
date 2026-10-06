export type AgentCapabilityState =
  | "ready"
  | "not_configured"
  | "optional"
  | "unavailable";

export type AgentCapabilitiesOverallStatus = "READY" | "LIMITED" | "NOT READY";

export interface AgentCapabilitiesStatusInput {
  tavilyConfigured: boolean;
  openAiConfigured: boolean;
  nvdConfigured: boolean;
  phase4Database: AgentCapabilityState;
  phase5Database: AgentCapabilityState;
}

export interface AgentCapabilityStatusItem {
  id:
    | "tavily"
    | "openai"
    | "nvd"
    | "phase4_database"
    | "phase5_database";
  label: string;
  state: AgentCapabilityState;
  detail?: string;
}

export interface AgentCapabilitiesStatusSnapshot {
  overall: AgentCapabilitiesOverallStatus;
  items: AgentCapabilityStatusItem[];
}

export function formatAgentCapabilityStateLabel(
  state: AgentCapabilityState,
): string {
  switch (state) {
    case "ready":
      return "Ready";
    case "not_configured":
      return "Not configured";
    case "optional":
      return "Optional";
    case "unavailable":
      return "Unavailable";
  }
}

export function resolveEnvApiKeyCapabilityState(input: {
  configured: boolean;
  optionalWhenAbsent?: boolean;
}): AgentCapabilityState {
  if (input.configured) {
    return "ready";
  }

  if (input.optionalWhenAbsent) {
    return "optional";
  }

  return "not_configured";
}

export function isSchemaAvailabilityProbeError(error: {
  code?: string;
  message: string;
}): boolean {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42703" ||
    message.includes("could not find") ||
    message.includes("does not exist") ||
    (message.includes("column") && message.includes("schema cache")) ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

export function resolveDatabaseProbeCapabilityState(error: {
  code?: string;
  message: string;
} | null): AgentCapabilityState {
  if (!error) {
    return "ready";
  }

  if (isSchemaAvailabilityProbeError(error)) {
    return "not_configured";
  }

  return "unavailable";
}

function isBlockingCapabilityState(state: AgentCapabilityState): boolean {
  return state === "not_configured" || state === "unavailable";
}

export function resolveAgentCapabilitiesOverallStatus(
  input: AgentCapabilitiesStatusInput,
): AgentCapabilitiesOverallStatus {
  const tavily = resolveEnvApiKeyCapabilityState({
    configured: input.tavilyConfigured,
  });
  const openAi = resolveEnvApiKeyCapabilityState({
    configured: input.openAiConfigured,
  });
  const nvd = resolveEnvApiKeyCapabilityState({
    configured: input.nvdConfigured,
    optionalWhenAbsent: true,
  });

  const blocking =
    isBlockingCapabilityState(tavily) ||
    isBlockingCapabilityState(openAi) ||
    isBlockingCapabilityState(input.phase4Database) ||
    isBlockingCapabilityState(input.phase5Database);

  if (blocking) {
    return "NOT READY";
  }

  if (nvd === "optional") {
    return "LIMITED";
  }

  return "READY";
}

export function buildAgentCapabilitiesStatusSnapshot(
  input: AgentCapabilitiesStatusInput,
): AgentCapabilitiesStatusSnapshot {
  const tavily = resolveEnvApiKeyCapabilityState({
    configured: input.tavilyConfigured,
  });
  const openAi = resolveEnvApiKeyCapabilityState({
    configured: input.openAiConfigured,
  });
  const nvd = resolveEnvApiKeyCapabilityState({
    configured: input.nvdConfigured,
    optionalWhenAbsent: true,
  });

  return {
    overall: resolveAgentCapabilitiesOverallStatus(input),
    items: [
      {
        id: "tavily",
        label: "Tavily research",
        state: tavily,
        detail:
          tavily === "not_configured"
            ? "TAVILY_API_KEY is not set."
            : undefined,
      },
      {
        id: "openai",
        label: "OpenAI",
        state: openAi,
        detail:
          openAi === "not_configured"
            ? "OPENAI_API_KEY is not set."
            : undefined,
      },
      {
        id: "nvd",
        label: "NVD API key",
        state: nvd,
        detail:
          nvd === "optional"
            ? "Optional — CVE lookups use the public NVD API with lower rate limits."
            : undefined,
      },
      {
        id: "phase4_database",
        label: "Agent database (Phase 4)",
        state: input.phase4Database,
        detail:
          input.phase4Database === "not_configured"
            ? "research_payload and generation_metadata columns are missing on agent_runs."
            : input.phase4Database === "unavailable"
              ? "Unable to verify Phase 4 schema readiness."
              : undefined,
      },
      {
        id: "phase5_database",
        label: "Agent database (Phase 5)",
        state: input.phase5Database,
        detail:
          input.phase5Database === "not_configured"
            ? "agent_reviews table is not available."
            : input.phase5Database === "unavailable"
              ? "Unable to verify Phase 5 schema readiness."
              : undefined,
      },
    ],
  };
}
