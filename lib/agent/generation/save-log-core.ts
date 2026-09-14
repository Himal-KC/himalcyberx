import type { AgentContentType } from "../../supabase/types";

export type SaveCheckpoint =
  | "draft_insert_start"
  | "draft_insert_success"
  | "draft_insert_failed"
  | "agent_run_update_start"
  | "agent_run_update_success"
  | "agent_run_update_failed"
  | "rollback_attempt"
  | "rollback_success"
  | "rollback_failed";

export interface SaveLogContext {
  agentRunId?: string | null;
  contentType?: AgentContentType | null;
  targetTable?: string | null;
  draftId?: string | null;
  stage?: string | null;
}

export interface SaveErrorDetails {
  errorCode?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  errorHint?: string | null;
}

export interface SaveLogEntry extends SaveLogContext, SaveErrorDetails {
  checkpoint: SaveCheckpoint;
}

export interface SupabaseErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

export function sanitizeSaveErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 200);
}

export function extractSupabaseErrorDetails(
  error: SupabaseErrorLike | null | undefined,
): SaveErrorDetails {
  if (!error) {
    return {
      errorCode: null,
      errorMessage: null,
      errorDetails: null,
      errorHint: null,
    };
  }

  return {
    errorCode: error.code ?? null,
    errorMessage: sanitizeSaveErrorMessage(error.message ?? "unknown error"),
    errorDetails: error.details ? sanitizeSaveErrorMessage(error.details) : null,
    errorHint: error.hint ? sanitizeSaveErrorMessage(error.hint) : null,
  };
}

export function isTransientSupabaseError(
  error: SupabaseErrorLike | null | undefined,
): boolean {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  return (
    message.includes("gateway timeout") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection reset") ||
    message.includes("service unavailable") ||
    code === "502" ||
    code === "503" ||
    code === "504" ||
    code === "57014"
  );
}

export function logGenerationSave(entry: SaveLogEntry): void {
  console.error("[agent-generation:save]", {
    checkpoint: entry.checkpoint,
    agentRunId: entry.agentRunId ?? null,
    contentType: entry.contentType ?? null,
    targetTable: entry.targetTable ?? null,
    draftId: entry.draftId ?? null,
    stage: entry.stage ?? null,
    errorCode: entry.errorCode ?? null,
    errorMessage: entry.errorMessage ?? null,
    errorDetails: entry.errorDetails ?? null,
    errorHint: entry.errorHint ?? null,
  });
}
