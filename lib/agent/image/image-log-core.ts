export type ImageTraceCheckpoint =
  | "image_start"
  | "image_context_ready"
  | "image_model_start"
  | "image_model_success"
  | "image_processing_start"
  | "image_processing_success"
  | "image_validation_success"
  | "image_upload_start"
  | "image_upload_success"
  | "image_attach_start"
  | "image_attach_success"
  | "image_complete";

export interface ImageTraceContext {
  agentRunId?: string | null;
  contentType?: string | null;
  model?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  byteSize?: number | null;
}

export interface ImageErrorLog extends ImageTraceContext {
  checkpoint: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export function sanitizeImageErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 200);
}

export function sanitizePromptForLogging(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function logImageTrace(
  checkpoint: ImageTraceCheckpoint,
  context: ImageTraceContext,
): void {
  console.log("[agent-image:trace]", {
    checkpoint,
    agentRunId: context.agentRunId ?? null,
    contentType: context.contentType ?? null,
    model: context.model ?? null,
    width: context.width ?? null,
    height: context.height ?? null,
    mime: context.mime ?? null,
    byteSize: context.byteSize ?? null,
  });
}

export function logImageError(log: ImageErrorLog): void {
  console.error("[agent-image:error]", {
    checkpoint: log.checkpoint,
    agentRunId: log.agentRunId ?? null,
    contentType: log.contentType ?? null,
    model: log.model ?? null,
    errorCode: log.errorCode ?? null,
    errorMessage: sanitizeImageErrorMessage(log.errorMessage ?? "unknown error"),
    width: log.width ?? null,
    height: log.height ?? null,
    mime: log.mime ?? null,
    byteSize: log.byteSize ?? null,
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
