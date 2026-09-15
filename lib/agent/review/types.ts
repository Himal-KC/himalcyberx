import type {
  AgentContentType,
  AgentFactCheckStatus,
} from "../../supabase/types";
import type {
  GeneratedDraft,
  GenerationMetadata,
  GroundingAuditResult,
  InternalLinkSuggestion,
  SourceMapping,
} from "../generation/types";
import type { PersistedResearchPayload } from "../generation/types";
import type { VerifiedClaim } from "../types";

export const REVIEW_VERSION = "phase5-v1";

export type ReviewOverallStatus = "pass" | "needs_review" | "fail";

export type ReviewFindingStatus =
  | "supported"
  | "partially_supported"
  | "unsupported"
  | "conflicting"
  | "not_verifiable";

export type ReviewFindingSeverity =
  | "critical"
  | "major"
  | "minor"
  | "informational";

export type ReviewClaimType =
  | "cve_id"
  | "cvss"
  | "kev_status"
  | "affected_product"
  | "affected_versions"
  | "patch_id"
  | "exploitation"
  | "threat_actor"
  | "statistics"
  | "vendor_statement"
  | "technical_behavior"
  | "security_impact"
  | "date"
  | "recommendation"
  | "general";

export interface ReviewFinding {
  findingId: string;
  severity: ReviewFindingSeverity;
  claimType: ReviewClaimType;
  claimText: string;
  status: ReviewFindingStatus;
  evidenceSourceIds: string[];
  explanation: string;
  suggestedCorrection: string | null;
}

export interface ReviewIntegritySection {
  passed: boolean;
  issues: string[];
}

export interface ReviewAssessmentSection {
  score: number;
  summary: string;
  issues: string[];
}

export interface ReviewQualityBreakdown {
  factualGrounding: number;
  sourceIntegrity: number;
  technicalAccuracy: number;
  seoStructure: number;
  readability: number;
  originality: number;
  internalLinkIntegrity: number;
}

export interface SolReviewOutput {
  reviewVersion: string;
  contentType: AgentContentType;
  summary: string;
  findings: ReviewFinding[];
  unsupportedClaims: string[];
  conflictingClaims: string[];
  sourceIntegrity: ReviewIntegritySection;
  internalLinkIntegrity: ReviewIntegritySection;
  seoReview: ReviewAssessmentSection;
  readabilityReview: ReviewAssessmentSection;
  originalityReview: ReviewAssessmentSection;
  safetyReview: ReviewAssessmentSection;
  qualityBreakdown: ReviewQualityBreakdown;
  publicationRecommendation: string;
  warnings: string[];
}

export interface ReviewGateResult {
  overallStatus: ReviewOverallStatus;
  factCheckStatus: AgentFactCheckStatus;
  overallQualityScore: number;
  qualityBreakdown: ReviewQualityBreakdown;
  hardGateFailures: string[];
}

export interface ReviewDraftSnapshot {
  contentId: string;
  contentType: AgentContentType;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  draft: GeneratedDraft;
  sourceMappings: SourceMapping[];
  internalLinks: InternalLinkSuggestion[];
  generationWarnings: string[];
}

export interface AuthoritativeSourceRecord {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  sourceType: string;
}

export interface ReviewContextPayload {
  agentRunId: string;
  contentType: AgentContentType;
  topic: string;
  draftSnapshot: ReviewDraftSnapshot;
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: Array<{ label: string; reason: string }>;
  discoveryContexts: Array<{
    url: string;
    title: string;
    publisher?: string | null;
    excerpt?: string | null;
  }>;
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: Array<{
    id: string;
    contentType: AgentContentType;
    title: string;
    slug: string;
  }>;
  groundingAudit: GroundingAuditResult | null;
  generationMetadata: GenerationMetadata | null;
  researchPayload: PersistedResearchPayload;
}

export interface AgentReviewRecord {
  id: string;
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  status: ReviewOverallStatus;
  factCheckStatus: AgentFactCheckStatus;
  reviewModel: string;
  reviewVersion: string;
  draftFingerprint: string;
  qualityScore: number;
  summary: string;
  findings: ReviewFinding[];
  qualityBreakdown: ReviewQualityBreakdown;
  unsupportedClaims: string[];
  conflictingClaims: string[];
  sourceIntegrity: ReviewIntegritySection;
  internalLinkIntegrity: ReviewIntegritySection;
  seoReview: ReviewAssessmentSection | null;
  readabilityReview: ReviewAssessmentSection | null;
  originalityReview: ReviewAssessmentSection | null;
  safetyReview: ReviewAssessmentSection | null;
  publicationRecommendation: string | null;
  warnings: string[];
  reusedFromCache: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RunReviewResult {
  review: AgentReviewRecord;
  editUrl: string;
  previewUrl: string | null;
}
