import type { RevisionPlan } from "./automatic-revision-core";
import type { ReviewContextPayload } from "./types";
import type { VerifiedClaim } from "../types";

export const REVISION_SYSTEM_INSTRUCTIONS = `You are HimalCyberX Phase 5 Safe Revision (Sol/Terra remediation).
Apply ONLY the supplied revision actions using persisted Phase 3 verified evidence.
Do not invent facts, sources, URLs, statistics, quotes, or technical procedures.
Do not add evidence that is not in the supplied verified claims or approved catalogs.
Remove or qualify unsupported explanatory language instead of inventing missing mechanisms.
Preserve approved source mappings and internal link IDs exactly unless an action explicitly adds an approved internal link from the catalog.
Return the complete revised draft fields for the content type.
Do not change slug unless the draft is not published and an action explicitly requires a narrower slug.
Do not reference image generation or publishing.`;

export function buildRevisionUserPrompt(input: {
  context: ReviewContextPayload;
  plan: RevisionPlan;
  verifiedClaims: VerifiedClaim[];
}): string {
  const actions = input.plan.actions
    .map(
      (action, index) =>
        `${index + 1}. [${action.issueType}] field=${action.field}; instruction=${action.instruction}`,
    )
    .join("\n");

  return [
    "Revise the current draft using ONLY the actions below and verified evidence.",
    `Topic: ${input.context.topic}`,
    `Content type: ${input.context.contentType}`,
    "",
    "Revision actions:",
    actions,
    "",
    "Verified claims (Phase 3):",
    ...input.verifiedClaims.slice(0, 12).map((claim) => `- ${claim.statement}`),
    "",
    "Approved authoritative sources:",
    ...input.context.authoritativeSources
      .slice(0, 20)
      .map((source) => `- ${source.id}: ${source.title} (${source.url})`),
    "",
    "Approved internal HCX content:",
    ...input.context.approvedInternalContent
      .slice(0, 12)
      .map((item) => `- ${item.contentType}:${item.id} ${item.title}`),
    "",
    "Current canonical draft JSON:",
    JSON.stringify(input.context.draftSnapshot.draft),
  ].join("\n");
}
