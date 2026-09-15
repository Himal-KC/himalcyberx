import { auditGrounding } from "../generation/grounding-audit-core";
import type { GroundingAuditResult } from "../generation/types";
import type { AgentSource } from "../../supabase/types";
import type {
  AuthoritativeSourceRecord,
  ReviewContextPayload,
  ReviewDraftSnapshot,
} from "./types";
import type { PersistedResearchPayload } from "../generation/types";
import type { AgentRun } from "../../supabase/types";

export { buildAllowedEvidenceIds } from "./validate-review-core";

export function buildAuthoritativeSourceRecords(
  sources: AgentSource[],
): AuthoritativeSourceRecord[] {
  return sources.map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceType: source.source_type,
  }));
}

export function buildReviewContextPayload(input: {
  run: AgentRun;
  researchPayload: PersistedResearchPayload;
  draftSnapshot: ReviewDraftSnapshot;
  sources: AgentSource[];
  groundingAudit: GroundingAuditResult;
}): ReviewContextPayload {
  return {
    agentRunId: input.run.id,
    contentType: input.run.content_type,
    topic: input.run.topic,
    draftSnapshot: input.draftSnapshot,
    verifiedClaims: input.researchPayload.verifiedClaims,
    uncertainClaims: input.researchPayload.uncertainClaims.map((claim) => ({
      label: claim.label,
      reason: claim.reason,
    })),
    discoveryContexts: input.researchPayload.discoveryContexts.map((item) => ({
      url: item.url,
      title: item.title,
      publisher: item.publisher ?? null,
      excerpt: item.excerpt ?? null,
    })),
    authoritativeSources: buildAuthoritativeSourceRecords(input.sources),
    approvedInternalContent: input.researchPayload.relatedHCXContent.map(
      (item) => ({
        id: item.id,
        contentType: item.contentType,
        title: item.title,
        slug: item.slug,
      }),
    ),
    groundingAudit: input.groundingAudit,
    generationMetadata: null,
    researchPayload: input.researchPayload,
  };
}

export function serializeReviewContextForPrompt(
  context: ReviewContextPayload,
): string {
  return JSON.stringify(
    {
      agentRunId: context.agentRunId,
      contentType: context.contentType,
      topic: context.topic,
      draft: {
        title: context.draftSnapshot.title,
        slug: context.draftSnapshot.slug,
        status: context.draftSnapshot.status,
        contentType: context.draftSnapshot.contentType,
        body: context.draftSnapshot.draft,
        sourceMappings: context.draftSnapshot.sourceMappings,
        internalLinks: context.draftSnapshot.internalLinks,
        warnings: context.draftSnapshot.generationWarnings,
      },
      verifiedResearchFacts: context.verifiedClaims,
      uncertainClaims: context.uncertainClaims,
      discoveryOnlyContexts: context.discoveryContexts,
      authoritativeSources: context.authoritativeSources,
      approvedInternalContent: context.approvedInternalContent,
      deterministicGroundingAudit: context.groundingAudit,
    },
    null,
    2,
  );
}

export function runDeterministicPreCheck(input: {
  draftSnapshot: ReviewDraftSnapshot;
  verifiedClaims: ReviewContextPayload["verifiedClaims"];
  allowedSourceUrls: string[];
  approvedInternalContent: ReviewContextPayload["approvedInternalContent"];
}): GroundingAuditResult {
  return auditGrounding({
    draft: input.draftSnapshot.draft,
    verifiedClaims: input.verifiedClaims,
    allowedSourceUrls: input.allowedSourceUrls,
    allowedContentIds: new Set(
      input.approvedInternalContent.map((item) => item.id),
    ),
    approvedInternalContent: input.approvedInternalContent,
  });
}
