import {
  deriveContentIntentProfile,
  extractTopicAnchors,
  extractTopicPhrases,
  statementMatchesAudienceLabel,
  statementMatchesTopicAnchors,
  type ContentIntentArea,
  type ContentIntentAreaId,
  type ContentIntentProfile,
} from "./research-content-intent-core.ts";
import type {
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
  VerifiedClaimType,
} from "../types.ts";
import type { AgentContentType } from "../../supabase/types.ts";
import type { PersistedResearchPayload } from "../generation/types.ts";

export type ResearchSufficiencyStatus =
  | "sufficient"
  | "needs_more_research"
  | "blocked";

export interface ResearchSufficiencyAssessment {
  status: ResearchSufficiencyStatus;
  score: number;
  reasons: string[];
  supportedIntentAreas: string[];
  missingIntentAreas: string[];
  verifiedClaimCount: number;
  authoritativeSourceCount: number;
  topicRelevantClaimCount: number;
}

export const MAX_RESEARCH_IMPROVEMENTS = 3;

const INSTRUCTIONAL_CLAIM_TYPES = new Set<VerifiedClaimType>([
  "mitigation",
  "guidance",
  "official_guidance",
  "preparedness",
  "response",
  "recovery",
  "backup",
  "authentication",
  "network_security",
  "techniques",
  "patch_information",
]);

const ACTIONABLE_CLAIM_TYPES = new Set<VerifiedClaimType>([
  ...INSTRUCTIONAL_CLAIM_TYPES,
  "indicators",
]);

export interface AssessResearchSufficiencyInput {
  topic: string;
  contentType: AgentContentType;
  recommendedAngle?: string | null;
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  sources: ResearchSource[];
  researchConfidence: ResearchConfidence;
  researchQuality: ResearchQuality;
  researchImprovementCount?: number;
  intentProfile?: ContentIntentProfile | PersistedResearchPayload["contentIntentProfile"];
}

function countAuthoritativeSources(sources: ResearchSource[]): number {
  return sources.filter(
    (source) =>
      source.sourceType === "official" || source.sourceType === "primary",
  ).length;
}

function isTopicRelevantVerifiedClaim(
  topic: string,
  claim: VerifiedClaim,
): boolean {
  if (claim.relevanceLevel === "high" || claim.relevanceLevel === "medium") {
    return true;
  }

  if (typeof claim.relevanceScore === "number" && claim.relevanceScore >= 0.45) {
    return true;
  }

  const anchors = extractTopicAnchors(topic);
  const phrases = extractTopicPhrases(topic);
  return statementMatchesTopicAnchors(claim.statement, anchors, phrases);
}

function isHighRelevanceVerifiedClaim(topic: string, claim: VerifiedClaim): boolean {
  if (claim.relevanceLevel === "high") {
    return true;
  }

  if (typeof claim.relevanceScore === "number" && claim.relevanceScore >= 0.62) {
    return true;
  }

  if (claim.relevanceLevel === "medium") {
    return statementMatchesTopicAnchors(
      claim.statement,
      extractTopicAnchors(topic),
      extractTopicPhrases(topic),
    );
  }

  return false;
}

function hasActionableClaimStatement(statement: string): boolean {
  return (
    /\bshould\b/i.test(statement) ||
    /\brecommend/i.test(statement) ||
    /\bimplement/i.test(statement) ||
    /\bmaintain\b/i.test(statement) ||
    /\bconfigure/i.test(statement) ||
    /\benable\b/i.test(statement) ||
    /\bapply\b/i.test(statement)
  );
}

function isCriticalUncertainClaim(claim: UncertainClaim): boolean {
  const label = claim.label.toLowerCase();
  const reason = claim.reason.toLowerCase();
  return (
    label.includes("critical") ||
    reason.includes("critical") ||
    label.includes("unresolved evidence gap")
  );
}

function minimumTopicRelevantClaims(contentType: AgentContentType): number {
  switch (contentType) {
    case "tutorial":
      return 4;
    case "lab":
      return 4;
    default:
      return 3;
  }
}

function minimumHighRelevanceClaims(
  contentType: AgentContentType,
  profile: ContentIntentProfile,
): number {
  if (contentType === "lab") {
    return 2;
  }
  if (contentType === "tutorial") {
    return 2;
  }
  return profile.expectsExplanation ? 2 : 1;
}

function minimumInstructionalClaims(contentType: AgentContentType): number {
  return contentType === "article" ? 1 : 2;
}

function evaluateIntentAreaSupport(input: {
  area: ContentIntentArea;
  profile: ContentIntentProfile;
  topic: string;
  contentType: AgentContentType;
  topicRelevantClaims: VerifiedClaim[];
  highRelevanceClaims: VerifiedClaim[];
}): boolean {
  const { area, profile, contentType, topicRelevantClaims, highRelevanceClaims } =
    input;

  switch (area.id) {
    case "topic_subject_depth": {
      const anchorMatches = topicRelevantClaims.filter((claim) =>
        statementMatchesTopicAnchors(
          claim.statement,
          profile.topicAnchors,
          profile.topicPhrases,
        ),
      );
      const distinctAnchors = new Set<string>();
      for (const claim of anchorMatches) {
        const normalized = claim.statement.toLowerCase();
        for (const anchor of profile.topicAnchors) {
          if (normalized.includes(anchor)) {
            distinctAnchors.add(anchor);
          }
        }
        for (const phrase of profile.topicPhrases) {
          if (normalized.includes(phrase)) {
            distinctAnchors.add(phrase);
          }
        }
      }

      const requiredDistinct =
        profile.topicAnchors.length <= 2
          ? profile.topicAnchors.length
          : Math.min(3, profile.topicAnchors.length);

      return (
        topicRelevantClaims.length >= minimumTopicRelevantClaims(contentType) &&
        anchorMatches.length >= Math.min(2, minimumTopicRelevantClaims(contentType)) &&
        distinctAnchors.size >= Math.max(1, requiredDistinct)
      );
    }
    case "explanatory_coverage":
      return (
        highRelevanceClaims.length >= minimumHighRelevanceClaims(contentType, profile) &&
        highRelevanceClaims.some((claim) =>
          statementMatchesTopicAnchors(
            claim.statement,
            profile.topicAnchors,
            profile.topicPhrases,
          ),
        )
      );
    case "audience_application":
      return topicRelevantClaims.some((claim) =>
        profile.audienceLabels.some((label) =>
          statementMatchesAudienceLabel(claim.statement, label),
        ),
      );
    case "instructional_evidence": {
      const instructional = topicRelevantClaims.filter(
        (claim) =>
          INSTRUCTIONAL_CLAIM_TYPES.has(claim.type) ||
          hasActionableClaimStatement(claim.statement),
      );
      return instructional.length >= minimumInstructionalClaims(contentType);
    }
    case "practical_workflow":
      return (
        highRelevanceClaims.length >= 2 &&
        topicRelevantClaims.some(
          (claim) =>
            INSTRUCTIONAL_CLAIM_TYPES.has(claim.type) ||
            hasActionableClaimStatement(claim.statement),
        )
      );
    case "defensive_guidance": {
      const defensive = topicRelevantClaims.filter(
        (claim) =>
          ACTIONABLE_CLAIM_TYPES.has(claim.type) ||
          hasActionableClaimStatement(claim.statement),
      );
      return defensive.length >= minimumInstructionalClaims(contentType);
    }
    default:
      return false;
  }
}

function areaLabelForUi(area: ContentIntentArea): string {
  return area.label;
}

function asContentIntentProfile(
  value: ContentIntentProfile | PersistedResearchPayload["contentIntentProfile"],
): ContentIntentProfile {
  if (!value) {
    throw new Error("Content intent profile is required.");
  }

  return {
    topicAnchors: value.topicAnchors,
    topicPhrases: value.topicPhrases,
    audienceLabels: value.audienceLabels,
    expectsExplanation: value.expectsExplanation,
    expectsDefensiveGuidance: value.expectsDefensiveGuidance,
    areas: value.areas.map((area) => ({
      id: area.id as ContentIntentAreaId,
      label: area.label,
    })),
  };
}

export function assessResearchSufficiency(
  input: AssessResearchSufficiencyInput,
): ResearchSufficiencyAssessment {
  const profile = input.intentProfile
    ? asContentIntentProfile(input.intentProfile)
    : deriveContentIntentProfile({
        topic: input.topic,
        contentType: input.contentType,
        recommendedAngle: input.recommendedAngle,
      });

  const verifiedClaimCount = input.verifiedClaims.length;
  const authoritativeSourceCount = countAuthoritativeSources(input.sources);
  const topicRelevantClaims = input.verifiedClaims.filter((claim) =>
    isTopicRelevantVerifiedClaim(input.topic, claim),
  );
  const highRelevanceClaims = input.verifiedClaims.filter((claim) =>
    isHighRelevanceVerifiedClaim(input.topic, claim),
  );
  const topicRelevantClaimCount = topicRelevantClaims.length;

  const supportedIntentAreas: string[] = [];
  const missingIntentAreas: string[] = [];
  const reasons: string[] = [];

  for (const area of profile.areas) {
    const supported = evaluateIntentAreaSupport({
      area,
      profile,
      topic: input.topic,
      contentType: input.contentType,
      topicRelevantClaims,
      highRelevanceClaims,
    });

    const label = areaLabelForUi(area);
    if (supported) {
      supportedIntentAreas.push(label);
    } else {
      missingIntentAreas.push(label);
    }
  }

  if (authoritativeSourceCount === 0) {
    reasons.push("No authoritative or primary sources were identified.");
  }

  if (topicRelevantClaimCount < minimumTopicRelevantClaims(input.contentType)) {
    reasons.push(
      "Too few topic-relevant verified claims to support the requested content.",
    );
  }

  if (
    authoritativeSourceCount > 0 &&
    topicRelevantClaimCount < minimumTopicRelevantClaims(input.contentType)
  ) {
    reasons.push(
      "An authoritative source alone does not provide enough topic-specific verified evidence.",
    );
  }

  if (input.researchQuality === "failed") {
    reasons.push("Research quality is failed.");
  }

  if (input.researchConfidence === "low") {
    reasons.push("Research confidence is too low for grounded draft generation.");
  }

  if (input.uncertainClaims.some(isCriticalUncertainClaim)) {
    reasons.push("A critical evidence gap remains unresolved.");
  }

  if (missingIntentAreas.length > 0) {
    reasons.push(
      "Verified evidence does not yet cover all areas implied by the topic and content type.",
    );
  }

  const improvementCount = input.researchImprovementCount ?? 0;
  const hasHardBlock =
    input.researchQuality === "failed" ||
    input.uncertainClaims.some(isCriticalUncertainClaim);

  let status: ResearchSufficiencyStatus = "sufficient";
  if (hasHardBlock) {
    status = "blocked";
  } else if (
    missingIntentAreas.length > 0 ||
    topicRelevantClaimCount < minimumTopicRelevantClaims(input.contentType) ||
    authoritativeSourceCount === 0 ||
    input.researchConfidence === "low"
  ) {
    status =
      improvementCount >= MAX_RESEARCH_IMPROVEMENTS
        ? "blocked"
        : "needs_more_research";
  }

  const totalAreas = Math.max(profile.areas.length, 1);
  const supportedRatio = supportedIntentAreas.length / totalAreas;
  let score = Math.round(
    supportedRatio * 60 +
      Math.min(
        topicRelevantClaimCount / minimumTopicRelevantClaims(input.contentType),
        1,
      ) *
        25 +
      (authoritativeSourceCount > 0 ? 10 : 0) +
      (input.researchConfidence === "high"
        ? 5
        : input.researchConfidence === "medium"
          ? 2
          : 0),
  );

  if (status !== "sufficient") {
    score = Math.min(score, status === "blocked" ? 35 : 55);
  } else {
    score = Math.max(score, 70);
  }

  return {
    status,
    score,
    reasons: uniqueReasons(reasons),
    supportedIntentAreas,
    missingIntentAreas,
    verifiedClaimCount,
    authoritativeSourceCount,
    topicRelevantClaimCount,
  };
}

function uniqueReasons(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildResearchCoverageLines(
  assessment: ResearchSufficiencyAssessment,
): Array<{ ok: boolean; label: string }> {
  const lines: Array<{ ok: boolean; label: string }> = [];

  if (assessment.authoritativeSourceCount > 0) {
    lines.push({
      ok: true,
      label: "Authoritative source identified",
    });
  } else {
    lines.push({
      ok: false,
      label: "No authoritative source identified",
    });
  }

  for (const label of assessment.supportedIntentAreas) {
    lines.push({ ok: true, label });
  }

  for (const label of assessment.missingIntentAreas) {
    lines.push({ ok: false, label: `${label} insufficiently supported` });
  }

  return lines;
}

export function intentAreaIdsFromProfile(
  profile: ContentIntentProfile,
): ContentIntentAreaId[] {
  return profile.areas.map((area) => area.id);
}
