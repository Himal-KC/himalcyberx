export const AGENT_NEW_RUN_WORKFLOW_HEADING = "What do you want to create?";
export const AGENT_NEW_RUN_ANALYZE_ACTION = "Analyze Topic";

export type AgentTopicAnalyzerHydrationPhase =
  | "none"
  | "research"
  | "draft_workflow";

export interface AgentTopicAnalyzerViewState {
  showNewAgentRunButton: boolean;
  showActiveRunWorkflow: boolean;
  showRestoredResearchWorkflow: boolean;
  showNewTopicWorkflow: boolean;
  showResumeRunsPanel: boolean;
  /** New-run mode should surface the topic workflow above resume cards. */
  newTopicWorkflowFirst: boolean;
}

export function resolveAgentTopicAnalyzerView(input: {
  startNew: boolean;
  hydrationPhase: AgentTopicAnalyzerHydrationPhase;
  resumableRunCount: number;
}): AgentTopicAnalyzerViewState {
  const hasHydration = input.hydrationPhase !== "none";
  const showNewTopicWorkflow = input.startNew || input.hydrationPhase === "none";
  const showActiveRunWorkflow =
    input.hydrationPhase === "draft_workflow" && !input.startNew;
  const showRestoredResearchWorkflow =
    input.hydrationPhase === "research" && !input.startNew;

  return {
    showNewAgentRunButton: hasHydration || input.resumableRunCount > 0,
    showActiveRunWorkflow,
    showRestoredResearchWorkflow,
    showNewTopicWorkflow,
    showResumeRunsPanel: input.resumableRunCount > 0,
    newTopicWorkflowFirst: input.startNew,
  };
}

export function newRunWorkflowMarkerPresent(source: string): boolean {
  return (
    source.includes(AGENT_NEW_RUN_WORKFLOW_HEADING) &&
    source.includes(AGENT_NEW_RUN_ANALYZE_ACTION)
  );
}
