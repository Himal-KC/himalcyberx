import type { AgentContentType } from "../../supabase/types";

export const PHASE8_PUBLICATION_VERSION = 1;

export type Phase8NotificationOutcome =
  | "sent"
  | "partial"
  | "failed"
  | "skipped";

export interface Phase8PublicationAudit {
  version: typeof PHASE8_PUBLICATION_VERSION;
  attemptedAt: string;
  publishedAt: string | null;
  contentType: AgentContentType;
  contentId: string;
  readinessFingerprint: string | null;
  result: string;
  notificationOutcome: Phase8NotificationOutcome | null;
  publicUrl: string | null;
  alreadyPublished?: boolean;
  errorMessage?: string | null;
}

export function buildPhase8PublicationAudit(
  input: Omit<Phase8PublicationAudit, "version">,
): Phase8PublicationAudit {
  return {
    version: PHASE8_PUBLICATION_VERSION,
    ...input,
  };
}

const VALID_AGENT_CONTENT_TYPES = new Set<AgentContentType>([
  "article",
  "tutorial",
  "lab",
]);

export function isAgentContentType(value: string): value is AgentContentType {
  return VALID_AGENT_CONTENT_TYPES.has(value as AgentContentType);
}

export function parsePhase8PublicationAudit(
  value: unknown,
): Phase8PublicationAudit | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Phase8PublicationAudit;
  if (
    record.version !== PHASE8_PUBLICATION_VERSION ||
    typeof record.attemptedAt !== "string" ||
    typeof record.contentType !== "string" ||
    typeof record.contentId !== "string" ||
    typeof record.result !== "string" ||
    !isAgentContentType(record.contentType)
  ) {
    return null;
  }

  return record;
}

export interface Phase8PublicationProofContext {
  contentId: string;
  contentType: AgentContentType;
}

export function validatePhase8PublicationProof(
  audit: Phase8PublicationAudit | null,
  context: Phase8PublicationProofContext,
): audit is Phase8PublicationAudit & { result: "PUBLISHED" } {
  if (!audit) {
    return false;
  }

  if (audit.result !== "PUBLISHED") {
    return false;
  }

  if (audit.contentId !== context.contentId) {
    return false;
  }

  if (audit.contentType !== context.contentType) {
    return false;
  }

  return true;
}

export function getPhase8PublicationProofFromMetadata(
  metadata: Record<string, unknown> | null,
  context: Phase8PublicationProofContext,
): (Phase8PublicationAudit & { result: "PUBLISHED" }) | null {
  const audit = parsePhase8PublicationAudit(metadata?.phase8Publication);
  return validatePhase8PublicationProof(audit, context) ? audit : null;
}

export function resolvePublishedContentFromMetadata(input: {
  metadata: Record<string, unknown> | null;
  context: {
    contentId: string;
    contentType: AgentContentType;
  };
}):
  | { kind: "proven_phase8"; proof: Phase8PublicationAudit & { result: "PUBLISHED" } }
  | { kind: "out_of_band" } {
  const proof = getPhase8PublicationProofFromMetadata(input.metadata, {
    contentId: input.context.contentId,
    contentType: input.context.contentType,
  });

  if (proof) {
    return { kind: "proven_phase8", proof };
  }

  return { kind: "out_of_band" };
}

export const PHASE8_PUBLICATION_RECONCILIATION_VERSION = 1;

export interface Phase8PublicationReconciliation {
  version: typeof PHASE8_PUBLICATION_RECONCILIATION_VERSION;
  reconciledAt: string;
  result: "ALREADY_PUBLISHED";
}

export function buildAgentRunReconciliationMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  proof: Phase8PublicationAudit & { result: "PUBLISHED" };
  reconciledAt: string;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};

  const reconciliation: Phase8PublicationReconciliation = {
    version: PHASE8_PUBLICATION_RECONCILIATION_VERSION,
    reconciledAt: input.reconciledAt,
    result: "ALREADY_PUBLISHED",
  };

  return {
    ...existing,
    phase8Publication: input.proof,
    phase8PublicationReconciliation: reconciliation,
  };
}

export function buildAgentRunPublicationMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  audit: Phase8PublicationAudit;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};

  return {
    ...existing,
    phase8Publication: input.audit,
  };
}

export function buildPublicationAuditFromAttempt(input: {
  contentType: AgentContentType;
  contentId: string;
  readinessFingerprint: string | null;
  result: string;
  publishedAt?: string | null;
  publicUrl?: string | null;
  notificationOutcome?: Phase8NotificationOutcome | null;
  alreadyPublished?: boolean;
  errorMessage?: string | null;
  attemptedAt?: string;
}): Phase8PublicationAudit {
  return buildPhase8PublicationAudit({
    attemptedAt: input.attemptedAt ?? new Date().toISOString(),
    publishedAt: input.publishedAt ?? null,
    contentType: input.contentType,
    contentId: input.contentId,
    readinessFingerprint: input.readinessFingerprint,
    result: input.result,
    notificationOutcome: input.notificationOutcome ?? null,
    publicUrl: input.publicUrl ?? null,
    alreadyPublished: input.alreadyPublished,
    errorMessage: input.errorMessage ?? null,
  });
}
