import { buildAdminUrls } from "../generation/save-draft-core";
import type { AgentReviewRow } from "../../supabase/types";
import type {
  AgentReviewRecord,
  ReviewAssessmentSection,
  ReviewFinding,
  ReviewIntegritySection,
  ReviewQualityBreakdown,
} from "./types";

function asFindings(value: unknown): ReviewFinding[] {
  return Array.isArray(value) ? (value as ReviewFinding[]) : [];
}

function asIntegrity(value: unknown): ReviewIntegritySection {
  if (!value || typeof value !== "object") {
    return { passed: true, issues: [] };
  }

  const record = value as ReviewIntegritySection;
  return {
    passed: Boolean(record.passed),
    issues: Array.isArray(record.issues) ? record.issues : [],
  };
}

function asAssessment(value: unknown): ReviewAssessmentSection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as ReviewAssessmentSection;
  return {
    score: Number(record.score ?? 0),
    summary: String(record.summary ?? ""),
    issues: Array.isArray(record.issues) ? record.issues : [],
  };
}

function asQualityBreakdown(value: unknown): ReviewQualityBreakdown {
  const record = (value ?? {}) as ReviewQualityBreakdown;
  return {
    factualGrounding: Number(record.factualGrounding ?? 0),
    sourceIntegrity: Number(record.sourceIntegrity ?? 0),
    technicalAccuracy: Number(record.technicalAccuracy ?? 0),
    seoStructure: Number(record.seoStructure ?? 0),
    readability: Number(record.readability ?? 0),
    originality: Number(record.originality ?? 0),
    internalLinkIntegrity: Number(record.internalLinkIntegrity ?? 0),
  };
}

export function mapAgentReviewRowToRecord(
  row: AgentReviewRow,
  reusedFromCache = false,
): AgentReviewRecord {
  return {
    id: row.id,
    agentRunId: row.agent_run_id,
    contentType: row.content_type,
    contentId: row.content_id,
    status: row.status,
    factCheckStatus: row.fact_check_status,
    reviewModel: row.review_model,
    reviewVersion: row.review_version,
    draftFingerprint: row.draft_fingerprint,
    qualityScore: row.quality_score,
    summary: row.summary,
    findings: asFindings(row.findings),
    qualityBreakdown: asQualityBreakdown(row.quality_breakdown),
    unsupportedClaims: row.unsupported_claims ?? [],
    conflictingClaims: row.conflicting_claims ?? [],
    sourceIntegrity: asIntegrity(row.source_integrity),
    internalLinkIntegrity: asIntegrity(row.internal_link_integrity),
    seoReview: asAssessment(row.seo_review),
    readabilityReview: asAssessment(row.readability_review),
    originalityReview: asAssessment(row.originality_review),
    safetyReview: asAssessment(row.safety_review),
    publicationRecommendation: row.publication_recommendation,
    warnings: row.warnings ?? [],
    reusedFromCache,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildRunReviewResult(
  review: AgentReviewRecord,
): {
  review: AgentReviewRecord;
  editUrl: string;
  previewUrl: string | null;
} {
  const urls = buildAdminUrls(review.contentType, review.contentId);
  return {
    review,
    editUrl: urls.editUrl,
    previewUrl: urls.previewUrl,
  };
}
