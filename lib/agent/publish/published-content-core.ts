import type { AgentContentType } from "../../supabase/types";
import type { Phase8PublicationAudit } from "./metadata-core";
import type { RunPublishResult } from "./types";

function buildPublicUrl(contentType: AgentContentType, slug: string): string {
  switch (contentType) {
    case "article":
      return `/articles/${slug}`;
    case "tutorial":
      return `/tutorials/${slug}`;
    case "lab":
      return `/cyber-lab/${slug}`;
  }
}

export interface PublishedContentContext {
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  slug: string;
  publishedAt?: string | null;
}

export function buildAlreadyPublishedResult(input: {
  context: PublishedContentContext;
  proof: Phase8PublicationAudit & { result: "PUBLISHED" };
}): RunPublishResult {
  const publicUrl =
    input.proof.publicUrl ??
    buildPublicUrl(input.context.contentType, input.context.slug);

  return {
    agentRunId: input.context.agentRunId,
    contentType: input.context.contentType,
    contentId: input.context.contentId,
    code: "ALREADY_PUBLISHED",
    message: "Content is already published.",
    success: true,
    alreadyPublished: true,
    publishedAt: input.proof.publishedAt ?? input.context.publishedAt ?? null,
    publicUrl,
    slug: input.context.slug,
    notificationOutcome: "skipped",
  };
}

export function buildProvenPhase8PublishedResult(input: {
  context: PublishedContentContext;
  proof: Phase8PublicationAudit & { result: "PUBLISHED" };
}): RunPublishResult {
  const publicUrl =
    input.proof.publicUrl ??
    buildPublicUrl(input.context.contentType, input.context.slug);

  return {
    agentRunId: input.context.agentRunId,
    contentType: input.context.contentType,
    contentId: input.context.contentId,
    code: "PUBLISHED",
    message: "Content published successfully.",
    success: true,
    alreadyPublished: false,
    publishedAt: input.proof.publishedAt ?? input.context.publishedAt ?? null,
    publicUrl,
    slug: input.context.slug,
    notificationOutcome: input.proof.notificationOutcome,
  };
}

export function buildOutOfBandPublishedResult(input: {
  context: PublishedContentContext;
}): RunPublishResult {
  return {
    agentRunId: input.context.agentRunId,
    contentType: input.context.contentType,
    contentId: input.context.contentId,
    code: "OUT_OF_BAND_PUBLISHED",
    message:
      "This content is already public, but it was not published through this HCX Agent Phase 8 run.",
    success: false,
    alreadyPublished: false,
    publishedAt: input.context.publishedAt ?? null,
    publicUrl: buildPublicUrl(
      input.context.contentType,
      input.context.slug,
    ),
    slug: input.context.slug,
    notificationOutcome: null,
  };
}
