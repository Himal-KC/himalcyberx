import type { SolReviewOutput } from "./types";

export const CORRECTABLE_REVIEW_VALIDATION_ERRORS = [
  "supported_finding_missing_evidence",
  "partially_supported_finding_missing_evidence",
  "finding_id_used_as_evidence",
] as const;

export function isCorrectableReviewValidationError(error: string): boolean {
  const code = error.split(":")[0] ?? error;
  return CORRECTABLE_REVIEW_VALIDATION_ERRORS.includes(
    code as (typeof CORRECTABLE_REVIEW_VALIDATION_ERRORS)[number],
  );
}

export function isCorrectableValidationFailure(errors: string[]): boolean {
  return errors.length > 0 && errors.every(isCorrectableReviewValidationError);
}

export function shouldAttemptReviewRepair(input: {
  validationErrors: string[];
  repairAttempted: boolean;
}): boolean {
  return !input.repairAttempted && isCorrectableValidationFailure(input.validationErrors);
}

export function buildReviewRepairUserPrompt(input: {
  validationErrors: string[];
  allowedEvidenceIds: string[];
  originalReview: SolReviewOutput;
}): string {
  return JSON.stringify(
    {
      task: "Repair the structured review JSON only. Do not change factual conclusions unless required to fix invalid evidence citations.",
      rules: [
        "Use only allowedEvidenceIds for evidenceSourceIds.",
        "findingId values identify findings and must never appear in evidenceSourceIds.",
        "supported and partially_supported findings must include at least one allowed verified evidenceSourceId.",
        "unsupported and not_verifiable findings may keep empty evidenceSourceIds.",
        "Do not introduce new facts, sources, URLs, or evidence IDs.",
        "Do not use web search.",
      ],
      validationErrors: input.validationErrors,
      allowedEvidenceIds: input.allowedEvidenceIds,
      originalReview: input.originalReview,
    },
    null,
    2,
  );
}

export const REVIEW_REPAIR_SYSTEM_INSTRUCTIONS = `You repair HimalCyberX Phase 5 structured review JSON.

Fix only structural review-contract problems such as missing evidenceSourceIds on supported or partially_supported findings, or finding IDs incorrectly placed in evidenceSourceIds.

Do not change the draft, add facts, add sources, or bypass evidence rules.
Return only the repaired structured review object.`;
