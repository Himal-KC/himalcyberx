import "server-only";

import { APIError, OpenAIError } from "openai";
import { HCX_DRAFT_MODEL } from "@/lib/agent/openai/config";

export type OpenAiGenerationStage =
  | "client_init"
  | "responses_parse"
  | "response_validation";

export interface SafeOpenAiGenerationDiagnostics {
  stage: OpenAiGenerationStage;
  model: string;
  errorName: string;
  statusCode: number | null;
  openAiCode: string | null;
  errorType: string | null;
  requestId: string | null;
  message: string;
  contentType?: string | null;
  agentRunId?: string | null;
}

const SECRET_PATTERNS = [
  /\bsk-[a-z0-9_-]{10,}\b/gi,
  /\bBearer\s+[a-z0-9._-]+\b/gi,
  /\bOPENAI_API_KEY\b/gi,
];

function sanitizeLogMessage(message: string): string {
  let sanitized = message;

  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  return sanitized.replace(/\s+/g, " ").trim().slice(0, 300);
}

export function extractSafeOpenAiDiagnostics(
  error: unknown,
  context: {
    stage: OpenAiGenerationStage;
    model?: string;
    contentType?: string | null;
    agentRunId?: string | null;
  },
): SafeOpenAiGenerationDiagnostics {
  const base = {
    stage: context.stage,
    model: context.model ?? HCX_DRAFT_MODEL,
    contentType: context.contentType ?? null,
    agentRunId: context.agentRunId ?? null,
  };

  if (error instanceof APIError) {
    return {
      ...base,
      errorName: error.constructor.name,
      statusCode: typeof error.status === "number" ? error.status : null,
      openAiCode: error.code ?? null,
      errorType: error.type ?? null,
      requestId: error.requestID ?? null,
      message: sanitizeLogMessage(error.message),
    };
  }

  if (error instanceof OpenAIError || error instanceof Error) {
    return {
      ...base,
      errorName: error.name || error.constructor.name,
      statusCode: null,
      openAiCode: null,
      errorType: null,
      requestId: null,
      message: sanitizeLogMessage(error.message),
    };
  }

  return {
    ...base,
    errorName: "UnknownError",
    statusCode: null,
    openAiCode: null,
    errorType: null,
    requestId: null,
    message: "Unknown generation error",
  };
}

export function logOpenAiGenerationFailure(
  diagnostics: SafeOpenAiGenerationDiagnostics,
): void {
  console.error("[agent-generation:openai]", diagnostics);
}
