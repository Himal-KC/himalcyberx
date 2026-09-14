import "server-only";

export {
  buildGroundingValidationLog,
  buildValidationFailureLog,
  classifyUnsupportedClaimTypes,
  issueCodesForReferenceError,
  issueCodesForStructureError,
  issueCodesForUnsupportedClaims,
  logGenerationTrace,
  logGenerationValidationFailure,
  sanitizeValidationReason,
} from "@/lib/agent/generation/validation-log-core";

export type {
  GenerationTraceCheckpoint,
  GenerationValidationLog,
  ValidationIssueCode,
  ValidationStage,
} from "@/lib/agent/generation/validation-log-core";
