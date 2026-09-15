import type { ReadinessStatus } from "../readiness/types";
import type { RunPublishResult } from "../publish/types";
import type { ReviewOverallStatus } from "../review/types";
import type {
  AgentContentType,
  AgentRun,
  AgentRunStage,
  AgentRunStatus,
} from "../../supabase/types";
import type {
  ResearchConfidence,
  ResearchQuality,
} from "../types";

export type StatusPresentationTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface AgentStatusSummaryLine {
  domain:
    | "workflow"
    | "research"
    | "factCheck"
    | "publicationReadiness"
    | "publication";
  label: string;
  value: string;
  tone: StatusPresentationTone;
}

export interface AgentRunAdminPresentation {
  summaryLines: AgentStatusSummaryLine[];
  switchRunCardLabel: string;
  researchAssessmentLabel: string;
  factCheckLabel: string | null;
  publicationReadinessLabel: string;
  publicationLabel: string;
}

export interface BuildAgentRunAdminPresentationInput {
  contentType: AgentContentType;
  contentId: string;
  contentStatus: string | null;
  workflow: {
    status: AgentRunStatus;
    stage: AgentRunStage;
  };
  research: {
    researchQuality: ResearchQuality;
    researchConfidence: ResearchConfidence;
  } | null;
  review: {
    status: ReviewOverallStatus;
    qualityScore: number;
    stale: boolean;
  } | null;
  readiness: {
    status: ReadinessStatus;
    readinessScore: number;
    stale: boolean;
    reviewStale: boolean;
  } | null;
  publish: Pick<RunPublishResult, "code" | "success" | "alreadyPublished"> | null;
  runMetadata?: Record<string, unknown> | null;
}

export function contentTypeAdminLabel(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}

export function formatResearchQualityLabel(quality: ResearchQuality): string {
  switch (quality) {
    case "passed":
      return "Passed";
    case "needs_review":
      return "Needs review";
    default:
      return "Failed";
  }
}

export function formatResearchConfidenceLabel(
  confidence: ResearchConfidence,
): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    default:
      return "Low confidence";
  }
}

export function formatResearchAssessmentLabel(input: {
  researchQuality: ResearchQuality;
  researchConfidence: ResearchConfidence;
}): string {
  return `${formatResearchQualityLabel(input.researchQuality)} · ${formatResearchConfidenceLabel(input.researchConfidence)}`;
}

export function formatFactCheckStatusLabel(status: ReviewOverallStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "needs_review":
      return "Needs review";
    default:
      return "Fail";
  }
}

export function formatFactCheckLabel(input: {
  status: ReviewOverallStatus;
  qualityScore: number;
  stale?: boolean;
}): string {
  const base = `${formatFactCheckStatusLabel(input.status)} · ${input.qualityScore}`;
  return input.stale ? `${base} (outdated)` : base;
}

export function formatPublicationReadinessStatusLabel(
  status: ReadinessStatus,
): string {
  switch (status) {
    case "READY_TO_PUBLISH":
      return "READY TO PUBLISH";
    case "NEEDS_REVIEW":
      return "NEEDS REVIEW";
    default:
      return "BLOCKED";
  }
}

export function formatPublicationReadinessLabel(input: {
  status: ReadinessStatus;
  readinessScore: number;
  stale?: boolean;
  reviewStale?: boolean;
}): string {
  const base = `${formatPublicationReadinessStatusLabel(input.status)} · ${input.readinessScore}`;
  if (input.stale || input.reviewStale) {
    return `${base} (outdated)`;
  }
  return base;
}

export function formatPublicationLabel(input: {
  publish: Pick<RunPublishResult, "code" | "success" | "alreadyPublished"> | null;
  contentStatus: string | null;
  hasPhase8Proof: boolean;
}): string {
  if (input.publish?.code === "OUT_OF_BAND_PUBLISHED") {
    return "PUBLISHED OUTSIDE HCX AGENT";
  }

  if (
    input.publish?.success &&
    (input.publish.code === "PUBLISHED" || input.publish.code === "ALREADY_PUBLISHED")
  ) {
    return input.publish.code === "ALREADY_PUBLISHED"
      ? "Already published"
      : "PUBLISHED";
  }

  if (input.hasPhase8Proof) {
    return "PUBLISHED";
  }

  if (input.contentStatus === "published") {
    return "PUBLISHED OUTSIDE HCX AGENT";
  }

  return "Not published";
}

export function deriveWorkflowLabel(input: {
  status: AgentRunStatus;
  stage: AgentRunStage;
  hasReview: boolean;
}): string {
  if (input.status === "completed" && input.stage === "completed") {
    return "Completed";
  }

  if (input.status === "failed" || input.stage === "failed") {
    return "Failed";
  }

  if (input.status === "cancelled") {
    return "Cancelled";
  }

  if (input.stage === "publishing" && input.status === "running") {
    return "Publishing in progress";
  }

  if (
    input.stage === "research" ||
    input.stage === "planning" ||
    input.stage === "writing" ||
    input.stage === "seo" ||
    input.stage === "saving"
  ) {
    return "Draft generation in progress";
  }

  if (input.stage === "image") {
    return "Featured image step";
  }

  if (input.stage === "quality") {
    return "Quality check in progress";
  }

  if (
    (input.stage === "fact_check" || input.stage === "ready") &&
    input.status === "ready"
  ) {
    return input.hasReview
      ? "Draft saved · review completed"
      : "Draft saved · awaiting review";
  }

  if (input.status === "running") {
    return "Processing";
  }

  if (input.status === "queued" || input.stage === "queued") {
    return "Queued";
  }

  return "In progress";
}

export function buildSwitchRunCardLabel(input: {
  contentType: AgentContentType;
  contentId: string;
  contentStatus: string | null;
  runMetadata: Record<string, unknown> | null;
  contentTypeOfRun: AgentContentType;
}): string {
  const typeLabel = contentTypeAdminLabel(input.contentType);
  const proof = hasPhase8PublicationProof(input.runMetadata, {
    contentId: input.contentId,
    contentType: input.contentTypeOfRun,
  });

  if (proof) {
    return `${typeLabel} · PUBLISHED`;
  }

  if (input.contentStatus === "published") {
    return `${typeLabel} · PUBLISHED OUTSIDE HCX AGENT`;
  }

  const persistedStatus = parseFinalReadinessStatusFromMetadata(input.runMetadata);
  if (persistedStatus) {
    return `${typeLabel} · ${formatPublicationReadinessStatusLabel(persistedStatus)}`;
  }

  return `${typeLabel} · Readiness not checked`;
}

export function buildAgentRunAdminPresentation(
  input: BuildAgentRunAdminPresentationInput,
): AgentRunAdminPresentation {
  const metadata = input.runMetadata ?? null;
  const hasPhase8Proof = Boolean(
    hasPhase8PublicationProof(metadata, {
      contentId: input.contentId,
      contentType: input.contentType,
    }),
  );

  const workflowValue = deriveWorkflowLabel({
    status: input.workflow.status,
    stage: input.workflow.stage,
    hasReview: Boolean(input.review),
  });

  const researchAssessmentLabel = input.research
    ? formatResearchAssessmentLabel(input.research)
    : "Not available";

  const factCheckLabel = input.review
    ? formatFactCheckLabel(input.review)
    : null;

  const publicationReadinessLabel = input.readiness
    ? formatPublicationReadinessLabel(input.readiness)
    : "Readiness not checked";

  const publicationLabel = formatPublicationLabel({
    publish: input.publish,
    contentStatus: input.contentStatus,
    hasPhase8Proof,
  });

  const summaryLines: AgentStatusSummaryLine[] = [
    {
      domain: "workflow",
      label: "Workflow",
      value: workflowValue,
      tone: "neutral",
    },
    {
      domain: "research",
      label: "Research",
      value: researchAssessmentLabel,
      tone: researchTone(input.research),
    },
  ];

  if (factCheckLabel) {
    summaryLines.push({
      domain: "factCheck",
      label: "Fact-check",
      value: factCheckLabel,
      tone: factCheckTone(input.review),
    });
  } else {
    summaryLines.push({
      domain: "factCheck",
      label: "Fact-check",
      value: "Not run",
      tone: "neutral",
    });
  }

  summaryLines.push({
    domain: "publicationReadiness",
    label: "Publication readiness",
    value: publicationReadinessLabel,
    tone: readinessTone(input.readiness),
  });

  summaryLines.push({
    domain: "publication",
    label: "Publication",
    value: publicationLabel,
    tone: publicationTone({
      publish: input.publish,
      contentStatus: input.contentStatus,
      hasPhase8Proof,
    }),
  });

  return {
    summaryLines,
    switchRunCardLabel: buildSwitchRunCardLabel({
      contentType: input.contentType,
      contentId: input.contentId,
      contentStatus: input.contentStatus,
      runMetadata: metadata,
      contentTypeOfRun: input.contentType,
    }),
    researchAssessmentLabel,
    factCheckLabel,
    publicationReadinessLabel,
    publicationLabel,
  };
}

export function buildAgentRunAdminPresentationFromRun(input: {
  run: AgentRun;
  contentId: string;
  contentStatus: string | null;
  research: BuildAgentRunAdminPresentationInput["research"];
  review: BuildAgentRunAdminPresentationInput["review"];
  readiness: BuildAgentRunAdminPresentationInput["readiness"];
  publish: BuildAgentRunAdminPresentationInput["publish"];
}): AgentRunAdminPresentation {
  const metadata =
    input.run.generation_metadata && typeof input.run.generation_metadata === "object"
      ? (input.run.generation_metadata as Record<string, unknown>)
      : null;

  return buildAgentRunAdminPresentation({
    contentType: input.run.content_type,
    contentId: input.contentId,
    contentStatus: input.contentStatus,
    workflow: {
      status: input.run.status,
      stage: input.run.stage,
    },
    research: input.research,
    review: input.review,
    readiness: input.readiness,
    publish: input.publish,
    runMetadata: metadata,
  });
}

function researchTone(
  research: BuildAgentRunAdminPresentationInput["research"],
): StatusPresentationTone {
  if (!research) {
    return "neutral";
  }

  if (research.researchQuality === "failed") {
    return "danger";
  }

  if (
    research.researchQuality === "needs_review" ||
    research.researchConfidence === "low"
  ) {
    return "warning";
  }

  return "success";
}

function factCheckTone(
  review: BuildAgentRunAdminPresentationInput["review"],
): StatusPresentationTone {
  if (!review) {
    return "neutral";
  }

  if (review.stale) {
    return "warning";
  }

  if (review.status === "fail") {
    return "danger";
  }

  if (review.status === "needs_review") {
    return "warning";
  }

  return "success";
}

function readinessTone(
  readiness: BuildAgentRunAdminPresentationInput["readiness"],
): StatusPresentationTone {
  if (!readiness) {
    return "neutral";
  }

  if (readiness.stale || readiness.reviewStale) {
    return "warning";
  }

  if (readiness.status === "BLOCKED") {
    return "danger";
  }

  if (readiness.status === "NEEDS_REVIEW") {
    return "warning";
  }

  return "success";
}

function publicationTone(input: {
  publish: BuildAgentRunAdminPresentationInput["publish"];
  contentStatus: string | null;
  hasPhase8Proof: boolean;
}): StatusPresentationTone {
  const label = formatPublicationLabel(input);
  if (label === "PUBLISHED" || label === "Already published") {
    return "success";
  }

  if (label === "PUBLISHED OUTSIDE HCX AGENT") {
    return "warning";
  }

  return "neutral";
}

export function workflowLabelNeverClaimsReadyToPublish(label: string): boolean {
  return !/ready to publish/i.test(label);
}

function parseFinalReadinessStatusFromMetadata(
  metadata: Record<string, unknown> | null,
): ReadinessStatus | null {
  const value = metadata?.finalReadiness;
  if (!value || typeof value !== "object") {
    return null;
  }

  const status = (value as { status?: unknown }).status;
  if (
    status === "READY_TO_PUBLISH" ||
    status === "NEEDS_REVIEW" ||
    status === "BLOCKED"
  ) {
    return status;
  }

  return null;
}

function hasPhase8PublicationProof(
  metadata: Record<string, unknown> | null,
  context: {
    contentId: string;
    contentType: AgentContentType;
  },
): boolean {
  const audit = metadata?.phase8Publication;
  if (!audit || typeof audit !== "object") {
    return false;
  }

  const record = audit as {
    result?: unknown;
    contentId?: unknown;
    contentType?: unknown;
    version?: unknown;
  };

  return (
    record.version === 1 &&
    record.result === "PUBLISHED" &&
    record.contentId === context.contentId &&
    record.contentType === context.contentType
  );
}
