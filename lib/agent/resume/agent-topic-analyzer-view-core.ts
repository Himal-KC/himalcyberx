export const AGENT_NEW_RUN_WORKFLOW_HEADING = "What do you want to create?";
export const AGENT_NEW_RUN_ANALYZE_ACTION = "Analyze Topic";

export interface AgentTopicAnalyzerViewState {
  showNewAgentRunButton: boolean;
  showActiveRunWorkflow: boolean;
  showNewTopicWorkflow: boolean;
  showResumeRunsPanel: boolean;
  /** New-run mode should surface the topic workflow above resume cards. */
  newTopicWorkflowFirst: boolean;
}

export function resolveAgentTopicAnalyzerView(input: {
  startNew: boolean;
  hasInitialHydration: boolean;
  resumableRunCount: number;
}): AgentTopicAnalyzerViewState {
  const showNewTopicWorkflow = input.startNew || !input.hasInitialHydration;
  const showActiveRunWorkflow = input.hasInitialHydration && !input.startNew;

  return {
    showNewAgentRunButton:
      input.hasInitialHydration || input.resumableRunCount > 0,
    showActiveRunWorkflow,
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
