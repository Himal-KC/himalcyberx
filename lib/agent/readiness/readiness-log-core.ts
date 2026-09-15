export type ReadinessTraceCheckpoint =
  | "readiness_start"
  | "readiness_context_ready"
  | "readiness_review_checked"
  | "readiness_cms_checked"
  | "readiness_sources_checked"
  | "readiness_seo_checked"
  | "readiness_image_checked"
  | "readiness_complete";

export interface ReadinessTraceContext {
  agentRunId?: string | null;
  contentType?: string | null;
  status?: string | null;
  readinessScore?: number | null;
  issueCodes?: string[] | null;
  blockingIssueCount?: number | null;
  warningIssueCount?: number | null;
}

export function logReadinessTrace(
  checkpoint: ReadinessTraceCheckpoint,
  context: ReadinessTraceContext,
): void {
  console.log("[agent-readiness:trace]", {
    checkpoint,
    agentRunId: context.agentRunId ?? null,
    contentType: context.contentType ?? null,
    status: context.status ?? null,
    readinessScore: context.readinessScore ?? null,
    issueCodes: context.issueCodes ?? null,
    blockingIssueCount: context.blockingIssueCount ?? null,
    warningIssueCount: context.warningIssueCount ?? null,
  });
}

export function diagnosticsContainSecrets(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return (
    /sk-[A-Za-z0-9]{10,}/.test(serialized) ||
    serialized.includes("data:image/") ||
    serialized.includes("service_role") ||
    serialized.includes("eyJhbGciOi")
  );
}
