import { auditGrounding } from "@/lib/agent/generation/grounding-audit";
import type { GeneratedDraft } from "@/lib/agent/generation/types";
import type { PersistedResearchPayload } from "@/lib/agent/generation/types";
import {
  filterSourceMappings,
  sanitizeGeneratedRichFields,
  validateDraftReferencesDetailed,
  validateGeneratedDraftStructureDetailed,
} from "@/lib/agent/generation/validate-output";
import type { AgentContentType } from "@/lib/supabase/types";

export type RevisedDraftValidationResult =
  | {
      ok: true;
      draft: GeneratedDraft;
    }
  | {
      ok: false;
      reason: string;
    };

export function validateRevisedDraftBeforeSave(input: {
  draft: GeneratedDraft;
  contentType: AgentContentType;
  allowedSourceUrls: readonly string[];
  allowedContentIds: readonly string[];
  researchPayload: PersistedResearchPayload;
}): RevisedDraftValidationResult {
  const filtered = filterSourceMappings(
    input.draft,
    [...input.allowedSourceUrls],
  ) as GeneratedDraft;

  const sanitized = sanitizeGeneratedRichFields(
    filtered,
    [...input.allowedSourceUrls],
  );

  const referenceFailure = validateDraftReferencesDetailed(
    sanitized,
    [...input.allowedSourceUrls],
    new Set(input.allowedContentIds),
  );
  if (referenceFailure) {
    return { ok: false, reason: referenceFailure.reason };
  }

  const structureFailure = validateGeneratedDraftStructureDetailed(
    sanitized,
    input.contentType,
    input.allowedSourceUrls,
  );
  if (structureFailure) {
    return { ok: false, reason: structureFailure.message };
  }

  const groundingAudit = auditGrounding({
    draft: sanitized,
    verifiedClaims: input.researchPayload.verifiedClaims,
    allowedSourceUrls: [...input.allowedSourceUrls],
    allowedContentIds: new Set(input.allowedContentIds),
    approvedInternalContent: input.researchPayload.relatedHCXContent,
  });

  if (!groundingAudit.passed) {
    return {
      ok: false,
      reason: "Revised draft failed deterministic grounding validation.",
    };
  }

  return { ok: true, draft: sanitized };
}
