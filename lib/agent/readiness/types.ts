import type { AgentContentType } from "@/lib/supabase/types";

export const READINESS_VERSION = "phase7-v1";

export type ReadinessStatus =
  | "READY_TO_PUBLISH"
  | "NEEDS_REVIEW"
  | "BLOCKED";

export type ReadinessIssueSeverity = "info" | "warning" | "blocking";

export type ReadinessIssueCategory =
  | "review"
  | "factual"
  | "source"
  | "cms"
  | "seo"
  | "image"
  | "alt_text"
  | "structure"
  | "internal_link"
  | "security";

export interface ReadinessIssue {
  code: string;
  severity: ReadinessIssueSeverity;
  category: ReadinessIssueCategory;
  message: string;
  recommendedAction: string;
}

export type ReadinessCheckStatus = "pass" | "warning" | "fail";

export interface ReadinessChecksSummary {
  review: ReadinessCheckStatus;
  factual: ReadinessCheckStatus;
  cms: ReadinessCheckStatus;
  source: ReadinessCheckStatus;
  seo: ReadinessCheckStatus;
  image: ReadinessCheckStatus;
  altText: ReadinessCheckStatus;
  structure: ReadinessCheckStatus;
  internalLinks: ReadinessCheckStatus;
}

export interface PersistedReadinessResult {
  version: string;
  evaluatedAt: string;
  status: ReadinessStatus;
  readinessScore: number;
  fingerprint: string;
  reviewFingerprint: string | null;
  stale: boolean;
  issues: ReadinessIssue[];
  checks: ReadinessChecksSummary;
}

export interface RunReadinessResult {
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  status: ReadinessStatus;
  readinessScore: number;
  fingerprint: string;
  stale: boolean;
  phase5Status: string | null;
  phase5QualityScore: number | null;
  issues: ReadinessIssue[];
  blockingIssues: ReadinessIssue[];
  warningIssues: ReadinessIssue[];
  passedChecks: string[];
  checks: ReadinessChecksSummary;
  editUrl: string;
  previewUrl: string | null;
}
