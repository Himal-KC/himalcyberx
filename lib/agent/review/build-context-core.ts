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
import type { EvidenceCatalogEntry } from "./validate-review-core";
import { buildEvidenceClassificationIndex } from "./validate-review-core";

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

export function buildEvidenceCatalogForPrompt(input: {
  verifiedClaims: ReviewContextPayload["verifiedClaims"];
  authoritativeSources: AuthoritativeSourceRecord[];
  approvedInternalContent: ReviewContextPayload["approvedInternalContent"];
  discoveryContexts: ReviewContextPayload["discoveryContexts"];
}): EvidenceCatalogEntry[] {
  return buildEvidenceClassificationIndex({
    verifiedClaims: input.verifiedClaims,
    authoritativeSources: input.authoritativeSources,
    approvedInternalContent: input.approvedInternalContent,
    discoveryContexts: input.discoveryContexts,
  }).catalog;
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
      verifiedResearchFacts: context.verifiedClaims.map((claim) => ({
        id: claim.id,
        type: claim.type,
        confidence: claim.confidence,
        relevanceLevel: claim.relevanceLevel ?? null,
      })),
      evidenceCatalog: buildEvidenceCatalogForPrompt({
        verifiedClaims: context.verifiedClaims,
        authoritativeSources: context.authoritativeSources,
        approvedInternalContent: context.approvedInternalContent,
        discoveryContexts: context.discoveryContexts,
      }),
      uncertainClaims: context.uncertainClaims,
      discoveryOnlyContexts: context.discoveryContexts.map((item) => ({
        url: item.url,
        title: item.title,
        publisher: item.publisher ?? null,
        note: "Discovery-only context. Do not cite in evidenceSourceIds.",
      })),
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
