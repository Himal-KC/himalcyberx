import type { AgentContentType } from "../../supabase/types";
import type { Phase8NotificationOutcome } from "./metadata-core";

export type {
  Phase8NotificationOutcome,
  Phase8PublicationAudit,
} from "./metadata-core";
export { PHASE8_PUBLICATION_VERSION } from "./metadata-core";

export type PublishEligibilityCode =
  | "READY"
  | "READINESS_MISSING"
  | "READINESS_NOT_READY"
  | "READINESS_STALE"
  | "REVIEW_MISSING"
  | "REVIEW_STALE"
  | "REVIEW_FAILED"
  | "CONTENT_MISSING"
  | "CONTENT_MISMATCH"
  | "CONTENT_NOT_DRAFT"
  | "CONTENT_INVALID"
  | "IMAGE_MISSING"
  | "ALREADY_PUBLISHED"
  | "PUBLISH_IN_PROGRESS";

export type PublishResultCode =
  | PublishEligibilityCode
  | "PUBLISHED"
  | "OUT_OF_BAND_PUBLISHED"
  | "PUBLISH_FAILED";

export interface PublishEligibilityResult {
  eligible: boolean;
  code: PublishEligibilityCode;
  message: string;
}

export interface RunPublishResult {
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  code: PublishResultCode;
  message: string;
  success: boolean;
  alreadyPublished: boolean;
  publishedAt: string | null;
  publicUrl: string | null;
  slug: string | null;
  notificationOutcome: Phase8NotificationOutcome | null;
}

export interface PublishAgentContentState {
  success?: boolean;
  error?: string;
  publish?: RunPublishResult;
}
