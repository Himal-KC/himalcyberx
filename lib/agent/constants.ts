export const AGENT_CONTENT_TYPES = ["article", "tutorial", "lab"] as const;

export const AGENT_RUN_STATUSES = [
  "queued",
  "running",
  "ready",
  "completed",
  "failed",
  "cancelled",
] as const;

export const AGENT_RUN_STAGES = [
  "queued",
  "research",
  "planning",
  "writing",
  "seo",
  "fact_check",
  "quality",
  "image",
  "saving",
  "ready",
  "publishing",
  "completed",
  "failed",
] as const;

export const AGENT_FACT_CHECK_STATUSES = [
  "pending",
  "passed",
  "failed",
  "needs_review",
] as const;

export const AGENT_SOURCE_TYPES = [
  "primary",
  "secondary",
  "official",
  "research",
] as const;
