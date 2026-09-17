import type { GroundingAuditResult } from "../generation/types";
import type { GeneratedDraft } from "../generation/types";
import type { AgentReviewRecord, ReviewFinding, ReviewDraftSnapshot } from "./types";

export const PHASE5_AUTOMATIC_REVISION_VERSION = "phase5-auto-revision-v1";
export const MAX_AUTOMATIC_REVISION_ATTEMPTS = 2;

const CRITICAL_SEVERITIES = new Set(["critical", "major"]);
const CRITICAL_CLAIM_TYPES = new Set([
  "cve_id",
  "cvss",
  "kev_status",
  "patch_id",
  "exploitation",
  "security_impact",
]);

function hasMaterialUnsupportedFinding(
  review: Pick<AgentReviewRecord, "findings">,
): boolean {
  return review.findings.some(
    (finding) =>
      finding.status === "unsupported" &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

function hasMaterialConflictingFinding(
  review: Pick<AgentReviewRecord, "findings">,
): boolean {
  return review.findings.some(
    (finding) =>
      finding.status === "conflicting" &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

export type AutomaticRevisionEligibilityStatus =
  | "eligible"
  | "not_needed"
  | "blocked";

export type RevisionActionIssueType =
  | "editorial_scope"
  | "unsupported_explanation"
  | "seo_alignment"
  | "readability"
  | "source_label"
  | "internal_link"
  | "alt_text"
  | "keyword_wording";

export interface RevisionPlanAction {
  field: string;
  issueType: RevisionActionIssueType;
  instruction: string;
  evidenceClaimIds: string[];
  sourceIds: string[];
  findingId: string | null;
}

export interface RevisionPlan {
  version: typeof PHASE5_AUTOMATIC_REVISION_VERSION;
  agentRunId: string;
  agentReviewId: string;
  sourceDraftFingerprint: string;
  eligible: true;
  actions: RevisionPlanAction[];
}

export interface Phase5AutomaticRevisionRecord {
  version: typeof PHASE5_AUTOMATIC_REVISION_VERSION;
  attempts: number;
  lastCompletedKey: string | null;
  lastStatus: "completed" | "failed" | "blocked" | null;
  previousReviewId: string | null;
  previousFingerprint: string | null;
  revisedFingerprint: string | null;
  revisedAt: string | null;
  actions: RevisionPlanAction[];
  changeSummary: string[];
  failureReason: string | null;
}

const EDITORIAL_CLAIM_TYPES = new Set([
  "general",
  "recommendation",
  "readability",
  "statistics",
]);

const NEW_EVIDENCE_PATTERN =
  /additional research|not established|phase 3 does not|requires new evidence|not supported by verified/i;

export function buildRevisionIdempotencyKey(
  agentReviewId: string,
  sourceDraftFingerprint: string,
): string {
  return `${agentReviewId}:${sourceDraftFingerprint}`;
}

export function readPhase5AutomaticRevisionFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Phase5AutomaticRevisionRecord | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const raw = metadata.phase5AutomaticRevision;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Phase5AutomaticRevisionRecord;
  if (record.version !== PHASE5_AUTOMATIC_REVISION_VERSION) {
    return null;
  }

  if (typeof record.attempts !== "number") {
    return null;
  }

  return record;
}

export function countAutomaticRevisionAttempts(
  metadata: Record<string, unknown> | null | undefined,
): number {
  return readPhase5AutomaticRevisionFromMetadata(metadata)?.attempts ?? 0;
}

export function revisionAlreadyCompletedForReview(input: {
  metadata: Record<string, unknown> | null | undefined;
  agentReviewId: string;
  sourceDraftFingerprint: string;
}): boolean {
  const record = readPhase5AutomaticRevisionFromMetadata(input.metadata);
  if (!record?.lastCompletedKey) {
    return false;
  }

  return (
    record.lastCompletedKey ===
    buildRevisionIdempotencyKey(input.agentReviewId, input.sourceDraftFingerprint)
  );
}

function findingRequiresNewEvidence(finding: ReviewFinding): boolean {
  if (NEW_EVIDENCE_PATTERN.test(finding.explanation)) {
    return true;
  }

  if (NEW_EVIDENCE_PATTERN.test(finding.suggestedCorrection ?? "")) {
    return true;
  }

  return (
    finding.status === "unsupported" &&
    !EDITORIAL_CLAIM_TYPES.has(finding.claimType) &&
    finding.severity !== "informational" &&
    finding.severity !== "minor" &&
    finding.evidenceSourceIds.length === 0
  );
}

function isSafelyRepairableFinding(finding: ReviewFinding): boolean {
  if (findingRequiresNewEvidence(finding)) {
    return false;
  }

  if (finding.status === "conflicting") {
    return false;
  }

  if (finding.status === "supported") {
    return false;
  }

  if (
    finding.status === "unsupported" &&
    !EDITORIAL_CLAIM_TYPES.has(finding.claimType) &&
    (finding.severity === "critical" || finding.severity === "major")
  ) {
    return false;
  }

  const instruction = finding.suggestedCorrection?.trim();
  if (!instruction && finding.status !== "partially_supported") {
    return false;
  }

  return Boolean(instruction || finding.explanation.trim());
}

function classifyFindingIssueType(finding: ReviewFinding): RevisionActionIssueType {
  if (/title|scope|framing|headline/i.test(finding.claimText)) {
    return "editorial_scope";
  }

  if (finding.claimType === "recommendation") {
    return "unsupported_explanation";
  }

  if (/seo|meta title|meta description|keyword/i.test(finding.claimText)) {
    return "seo_alignment";
  }

  if (/internal link|related content|hcx content/i.test(finding.claimText)) {
    return "internal_link";
  }

  if (/source label|attribution|catalog source/i.test(finding.claimText)) {
    return "source_label";
  }

  return "unsupported_explanation";
}

function mapFindingToAction(finding: ReviewFinding): RevisionPlanAction | null {
  if (!isSafelyRepairableFinding(finding)) {
    return null;
  }

  const instruction =
    finding.suggestedCorrection?.trim() ||
    `Qualify or remove unsupported wording: ${finding.claimText.trim()}`;

  return {
    field: "draft",
    issueType: classifyFindingIssueType(finding),
    instruction,
    evidenceClaimIds: [],
    sourceIds: finding.evidenceSourceIds,
    findingId: finding.findingId,
  };
}

function buildSeoRevisionActions(review: AgentReviewRecord): RevisionPlanAction[] {
  if (!review.seoReview || review.seoReview.issues.length === 0) {
    return [];
  }

  return review.seoReview.issues.slice(0, 3).map((issue, index) => ({
    field: "seo",
    issueType: "seo_alignment" as const,
    instruction: `Align SEO fields with verified evidence scope: ${issue}`,
    evidenceClaimIds: [],
    sourceIds: [],
    findingId: `seo-${index + 1}`,
  }));
}

export function buildAutomaticRevisionPlan(input: {
  agentRunId: string;
  review: AgentReviewRecord;
  sourceDraftFingerprint: string;
}): RevisionPlan | null {
  const actions: RevisionPlanAction[] = [];

  for (const finding of input.review.findings) {
    const action = mapFindingToAction(finding);
    if (action) {
      actions.push(action);
    }
  }

  actions.push(...buildSeoRevisionActions(input.review));

  if (actions.length === 0) {
    return null;
  }

  return {
    version: PHASE5_AUTOMATIC_REVISION_VERSION,
    agentRunId: input.agentRunId,
    agentReviewId: input.review.id,
    sourceDraftFingerprint: input.sourceDraftFingerprint,
    eligible: true,
    actions: actions.slice(0, 12),
  };
}

export function assessAutomaticRevisionEligibility(input: {
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
  groundingAudit: GroundingAuditResult;
  metadata: Record<string, unknown> | null | undefined;
  snapshot: ReviewDraftSnapshot | null;
}): {
  status: AutomaticRevisionEligibilityStatus;
  reason: string;
  plan: RevisionPlan | null;
} {
  if (!input.review) {
    return {
      status: "blocked",
      reason: "No Phase 5 review exists for this run.",
      plan: null,
    };
  }

  if (input.review.agentRunId !== input.agentRunId) {
    return {
      status: "blocked",
      reason: "Review does not belong to this run.",
      plan: null,
    };
  }

  if (!input.snapshot) {
    return {
      status: "blocked",
      reason: "Current draft could not be loaded.",
      plan: null,
    };
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    return {
      status: "blocked",
      reason: "The Phase 5 review is stale for the current draft.",
      plan: null,
    };
  }

  if (countAutomaticRevisionAttempts(input.metadata) >= MAX_AUTOMATIC_REVISION_ATTEMPTS) {
    return {
      status: "blocked",
      reason: "Maximum automatic revision attempts reached for this run.",
      plan: null,
    };
  }

  if (
    revisionAlreadyCompletedForReview({
      metadata: input.metadata,
      agentReviewId: input.review.id,
      sourceDraftFingerprint: input.currentDraftFingerprint,
    })
  ) {
    return {
      status: "blocked",
      reason: "Safe revisions were already applied for this review and draft.",
      plan: null,
    };
  }

  if (!input.groundingAudit.passed) {
    return {
      status: "blocked",
      reason: "Deterministic grounding failures must be resolved manually.",
      plan: null,
    };
  }

  if (!input.review.sourceIntegrity.passed) {
    return {
      status: "blocked",
      reason: "Source integrity failures must be resolved manually.",
      plan: null,
    };
  }

  if (hasMaterialConflictingFinding(input.review)) {
    return {
      status: "blocked",
      reason: "Material conflicting findings require human review.",
      plan: null,
    };
  }

  if (hasMaterialUnsupportedFinding(input.review)) {
    return {
      status: "blocked",
      reason: "Material unsupported findings require new evidence or human review.",
      plan: null,
    };
  }

  if (input.review.findings.some((finding) => findingRequiresNewEvidence(finding))) {
    return {
      status: "blocked",
      reason:
        "Some findings require expanded Phase 3 research before the draft can be revised safely.",
      plan: null,
    };
  }

  if (input.review.status === "pass") {
    return {
      status: "not_needed",
      reason: "Phase 5 pass reviews do not require automatic revision.",
      plan: null,
    };
  }

  if (input.review.status === "fail") {
    const onlyEditorialScope =
      input.review.findings.length > 0 &&
      input.review.findings.every(
        (finding) =>
          finding.status !== "conflicting" &&
          !findingRequiresNewEvidence(finding) &&
          (finding.claimType === "general" ||
            classifyFindingIssueType(finding) === "editorial_scope" ||
            /scope|title|framing/i.test(finding.claimText)),
      );
    if (!onlyEditorialScope) {
      return {
        status: "blocked",
        reason: "Phase 5 FAIL reviews cannot be automatically revised.",
        plan: null,
      };
    }
  }

  if (input.review.status !== "needs_review" && input.review.status !== "fail") {
    return {
      status: "blocked",
      reason: "Automatic revision is not available for this review status.",
      plan: null,
    };
  }

  const plan = buildAutomaticRevisionPlan({
    agentRunId: input.agentRunId,
    review: input.review,
    sourceDraftFingerprint: input.currentDraftFingerprint,
  });

  if (!plan) {
    return {
      status: "not_needed",
      reason: "No safely repairable Phase 5 issues were found.",
      plan: null,
    };
  }

  return {
    status: "eligible",
    reason: "Safe revisions are available for this review.",
    plan,
  };
}

export function buildRevisionChangeSummary(
  actions: RevisionPlanAction[],
): string[] {
  const summaries = new Set<string>();

  for (const action of actions) {
    switch (action.issueType) {
      case "editorial_scope":
        summaries.add("Title or framing narrowed to match verified evidence");
        break;
      case "unsupported_explanation":
        summaries.add("Unsupported explanatory statement removed or qualified");
        break;
      case "seo_alignment":
        summaries.add("SEO fields aligned with revised scope");
        break;
      case "internal_link":
        summaries.add("Approved internal link added or corrected");
        break;
      case "source_label":
        summaries.add("Source label repaired using verified catalog metadata");
        break;
      case "alt_text":
        summaries.add("Featured image alt text repaired");
        break;
      case "readability":
        summaries.add("Readability improved without changing evidence");
        break;
      case "keyword_wording":
        summaries.add("Misleading keyword wording removed");
        break;
      default:
        break;
    }
  }

  return [...summaries];
}

export { repairFeaturedImageAltText } from "../content/featured-image-alt-core.ts";

export function mergeRevisedDraftWithSnapshot(input: {
  snapshot: ReviewDraftSnapshot;
  revisedDraft: GeneratedDraft;
}): GeneratedDraft {
  const current = input.snapshot.draft;

  return {
    ...current,
    ...input.revisedDraft,
    contentType: current.contentType,
    slug: current.slug,
    sourceMappings: current.sourceMappings,
    internalLinks: current.internalLinks,
    warnings: current.warnings,
  } as GeneratedDraft;
}

export function buildPhase5AutomaticRevisionMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  record: Phase5AutomaticRevisionRecord;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};

  return {
    ...existing,
    phase5AutomaticRevision: input.record,
  };
}

export interface AutomaticRevisionUiState {
  status: AutomaticRevisionEligibilityStatus;
  reason: string;
  canApply: boolean;
  attempts: number;
  maxAttempts: number;
  changeSummaryPreview: string[];
  lastRevisedAt: string | null;
  previousFingerprint: string | null;
  revisedFingerprint: string | null;
}

export function buildAutomaticRevisionUiState(input: {
  eligibility: ReturnType<typeof assessAutomaticRevisionEligibility>;
  metadata: Record<string, unknown> | null | undefined;
}): AutomaticRevisionUiState {
  const record = readPhase5AutomaticRevisionFromMetadata(input.metadata);

  return {
    status: input.eligibility.status,
    reason: input.eligibility.reason,
    canApply: input.eligibility.status === "eligible",
    attempts: record?.attempts ?? 0,
    maxAttempts: MAX_AUTOMATIC_REVISION_ATTEMPTS,
    changeSummaryPreview: input.eligibility.plan
      ? buildRevisionChangeSummary(input.eligibility.plan.actions)
      : record?.changeSummary ?? [],
    lastRevisedAt: record?.revisedAt ?? null,
    previousFingerprint: record?.previousFingerprint ?? null,
    revisedFingerprint: record?.revisedFingerprint ?? null,
  };
}
