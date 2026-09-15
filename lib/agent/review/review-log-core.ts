export type ReviewTraceCheckpoint =
  | "review_start"
  | "context_ready"
  | "cache_check"
  | "cache_hit"
  | "openai_start"
  | "openai_success"
  | "validation_start"
  | "validation_success"
  | "quality_gate_start"
  | "quality_gate_success"
  | "save_start"
  | "save_success"
  | "review_complete";

export interface ReviewTraceContext {
  agentRunId?: string | null;
  contentType?: string | null;
  model?: string | null;
}

export interface ReviewErrorLog extends ReviewTraceContext {
  checkpoint: string;
  errorName?: string | null;
  statusCode?: number | null;
  openAiCode?: string | null;
  openAiType?: string | null;
  requestId?: string | null;
  errorMessage?: string | null;
  findingCount?: number | null;
  qualityScore?: number | null;
  finalStatus?: string | null;
  evidenceClassificationDiagnostics?: Array<{
    evidenceId: string;
    effectiveClassification: string;
    isVerifiedClaim: boolean;
    isVerifiedSource: boolean;
    isDiscoveryOnly: boolean;
    isInternalHcx: boolean;
  }> | null;
}

export function sanitizeReviewErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 200);
}

export function logReviewTrace(
  checkpoint: ReviewTraceCheckpoint,
  context: ReviewTraceContext,
): void {
  console.log("[agent-review:trace]", {
    checkpoint,
    agentRunId: context.agentRunId ?? null,
    contentType: context.contentType ?? null,
    model: context.model ?? null,
  });
}

export function logReviewError(log: ReviewErrorLog): void {
  console.error("[agent-review:error]", {
    checkpoint: log.checkpoint,
    agentRunId: log.agentRunId ?? null,
    contentType: log.contentType ?? null,
    model: log.model ?? null,
    errorName: log.errorName ?? null,
    statusCode: log.statusCode ?? null,
    openAiCode: log.openAiCode ?? null,
    openAiType: log.openAiType ?? null,
    requestId: log.requestId ?? null,
    errorMessage: sanitizeReviewErrorMessage(log.errorMessage ?? "unknown error"),
    findingCount: log.findingCount ?? null,
    qualityScore: log.qualityScore ?? null,
    finalStatus: log.finalStatus ?? null,
    evidenceClassificationDiagnostics:
      log.evidenceClassificationDiagnostics ?? null,
  });
}
