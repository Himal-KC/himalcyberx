import "server-only";

import { tokenizeAwarenessText } from "@/lib/agent/content-awareness";
import type { AgentContentType } from "@/lib/supabase/types";
import type {
  ContentAwarenessResult,
  ResearchConfidence,
  ResearchQuality,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
  VerifiedClaimType,
} from "@/lib/agent/types";
import { deduplicateStatements } from "@/lib/agent/research/source-text";

export interface ResearchSynthesisInput {
  topic: string;
  contentType: AgentContentType;
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  awareness: ContentAwarenessResult;
  unpromotedDiscoveryCount: number;
  pageBackedClaimCount: number;
  highRelevanceClaimCount: number;
  researchQuality?: ResearchQuality;
}

export interface ResearchSynthesisOutput {
  summary: string;
  recommendedAngle: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  keyFindings: string[];
  researchConfidence: ResearchConfidence;
}

function uniqueKeywords(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(value.trim());
  }

  return result;
}

function countClaimsByOrigin(verifiedClaims: VerifiedClaim[]): {
  structured: number;
  pageBacked: number;
} {
  const structuredTypes = new Set<VerifiedClaimType>([
    "cve_id",
    "cvss",
    "affected_product",
    "affected_versions",
    "exploitation_status",
    "mitigation",
    "disclosure_date",
    "patch_information",
  ]);

  const pageBackedTypes = new Set<VerifiedClaimType>([
    "official_guidance",
    "preparedness",
    "response",
    "recovery",
    "backup",
    "authentication",
    "network_security",
    "guidance",
    "general",
    "mitigation",
  ]);

  let structured = 0;
  let pageBacked = 0;

  for (const claim of verifiedClaims) {
    if (structuredTypes.has(claim.type)) {
      structured += 1;
    } else if (pageBackedTypes.has(claim.type)) {
      pageBacked += 1;
    }
  }

  return { structured, pageBacked };
}

function buildKeywords(topic: string, verifiedClaims: VerifiedClaim[]): {
  primaryKeyword: string;
  secondaryKeywords: string[];
} {
  const topicTokens = tokenizeAwarenessText(topic);
  const cveClaim = verifiedClaims.find((claim) => claim.type === "cve_id");
  const primaryKeyword = cveClaim
    ? topic.match(/\bCVE-\d{4}-\d+\b/i)?.[0]?.toUpperCase() ??
      topicTokens.slice(0, 4).join(" ")
    : topicTokens.slice(0, 4).join(" ");

  const secondary = [
    ...topicTokens.slice(0, 8),
    ...verifiedClaims
      .filter((claim) => claim.type === "affected_product")
      .flatMap((claim) => tokenizeAwarenessText(claim.statement)),
  ];

  return {
    primaryKeyword,
    secondaryKeywords: uniqueKeywords(secondary).slice(0, 8),
  };
}

function relevanceRank(claim: VerifiedClaim): number {
  if (claim.relevanceLevel === "high") {
    return 3;
  }

  if (claim.relevanceLevel === "medium") {
    return 2;
  }

  return 1;
}

function buildKeyFindings(verifiedClaims: VerifiedClaim[]): string[] {
  const priority: VerifiedClaimType[] = [
    "cve_id",
    "exploitation_status",
    "cvss",
    "affected_product",
    "mitigation",
    "official_guidance",
    "preparedness",
    "backup",
    "authentication",
    "network_security",
    "response",
    "recovery",
    "guidance",
    "general",
    "disclosure_date",
  ];

  const highRelevance = verifiedClaims.filter(
    (claim) => claim.relevanceLevel === "high",
  );
  const mediumRelevance = verifiedClaims.filter(
    (claim) => claim.relevanceLevel === "medium",
  );
  const candidateClaims =
    highRelevance.length > 0
      ? [...highRelevance, ...mediumRelevance]
      : verifiedClaims;

  const ordered = [...candidateClaims].sort((left, right) => {
    const relevanceDelta = relevanceRank(right) - relevanceRank(left);
    if (relevanceDelta !== 0) {
      return relevanceDelta;
    }

    const leftIndex = priority.indexOf(left.type);
    const rightIndex = priority.indexOf(right.type);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });

  return deduplicateStatements(ordered.map((claim) => claim.statement)).slice(
    0,
    7,
  );
}

function topPublishers(sources: ResearchSource[]): string[] {
  const publishers = sources
    .map((source) => source.publisher?.trim())
    .filter((publisher): publisher is string => Boolean(publisher));

  return [...new Set(publishers)].slice(0, 3);
}

function buildSummary(
  topic: string,
  verifiedClaims: VerifiedClaim[],
  sources: ResearchSource[],
  uncertainClaims: UncertainClaim[],
  unpromotedDiscoveryCount: number,
  pageBackedClaimCount: number,
  highRelevanceClaimCount: number,
  researchQuality?: ResearchQuality,
): string {
  const publishers = topPublishers(sources);
  const findings = buildKeyFindings(verifiedClaims);
  const { structured, pageBacked } = countClaimsByOrigin(verifiedClaims);
  const relevantClaims = verifiedClaims.filter(
    (claim) =>
      claim.relevanceLevel === "high" || claim.relevanceLevel === "medium",
  );
  const hasOfficialSource = sources.some(
    (source) =>
      source.sourceType === "official" || source.sourceType === "primary",
  );

  if (verifiedClaims.length === 0) {
    if (hasOfficialSource && sources.length > 0) {
      return `Research on "${topic}" found ${sources.length} authoritative source${sources.length === 1 ? "" : "s"}, but insufficient page-verifiable topic-specific evidence was extracted. Authoritative sources were found, but deterministic claim extraction could not recover enough strong verified statements.`;
    }

    return `Research on "${topic}" did not identify credible authoritative evidence for this topic.`;
  }

  const publisherText =
    publishers.length > 0
      ? `Evidence was drawn from ${publishers.join(", ")}.`
      : "Evidence was drawn from authoritative cybersecurity sources.";

  const evidenceText =
    structured > 0
      ? `${structured} structured verification item${structured === 1 ? "" : "s"} were confirmed from official vulnerability data.`
      : `${pageBacked} topic-relevant verified statement${pageBacked === 1 ? "" : "s"} were extracted from fetched authoritative page content.`;

  const parts = [
    `Research on "${topic}" produced ${relevantClaims.length} topic-relevant verified claim${relevantClaims.length === 1 ? "" : "s"}.`,
    publisherText,
    evidenceText,
  ];

  if (findings.length >= 1) {
    parts.push(findings[0]);
  } else if (
    researchQuality === "needs_review" ||
    pageBackedClaimCount < 2 ||
    highRelevanceClaimCount < 2
  ) {
    parts.push(
      "Authoritative sources were found, but some evidence could not be fully verified automatically and the brief should be reviewed before content generation.",
    );
  }

  if (uncertainClaims.length > 0) {
    parts.push(
      `${uncertainClaims.length} item${uncertainClaims.length === 1 ? "" : "s"} remain uncertain and should be reviewed before content generation.`,
    );
  } else if (unpromotedDiscoveryCount > 0) {
    parts.push(
      "Tavily search excerpts were retained as discovery context but were not promoted to verified claims.",
    );
  }

  return parts.join(" ");
}

function buildRecommendedAngle(
  topic: string,
  contentType: AgentContentType,
  awareness: ContentAwarenessResult,
  verifiedClaims: VerifiedClaim[],
): string {
  const relevantClaims = verifiedClaims.filter(
    (claim) =>
      claim.relevanceLevel === "high" ||
      claim.relevanceLevel === "medium" ||
      claim.relevanceLevel === undefined,
  );
  const cveClaim = relevantClaims.find((claim) => claim.type === "cve_id");
  const kevClaim = relevantClaims.find(
    (claim) => claim.type === "exploitation_status",
  );
  const mitigationClaim = relevantClaims.find(
    (claim) => claim.type === "mitigation",
  );
  const guidanceClaims = relevantClaims.filter(
    (claim) =>
      claim.type === "guidance" ||
      claim.type === "official_guidance" ||
      claim.type === "preparedness" ||
      claim.type === "backup" ||
      claim.type === "authentication" ||
      claim.type === "network_security" ||
      claim.type === "response" ||
      claim.type === "recovery",
  );

  if (contentType === "article") {
    if (cveClaim && kevClaim && mitigationClaim) {
      return `Write a defender-focused article on ${topic}, leading with verified KEV exploitation status, NVD vulnerability details, and CISA-required mitigation actions.`;
    }
    if (cveClaim) {
      return `Write a defender-focused article on ${topic}, centering NVD-verified vulnerability details and clearly separating confirmed facts from unverified exploitation or patch assumptions.`;
    }
    if (guidanceClaims.length > 0) {
      return `Write a practical article on ${topic} that translates verified official guidance from fetched source pages into clear defensive priorities for network defenders and security teams.`;
    }
    return `Write an evidence-led article on ${topic} using only verified claims and clearly flagging any areas that still need manual review.`;
  }

  if (contentType === "tutorial") {
    if (guidanceClaims.length > 0) {
      return `Build a step-by-step tutorial on ${topic} that operationalizes the verified guidance already identified from authoritative source pages.`;
    }
    return awareness.contentGapSummary
      ? `${awareness.contentGapSummary} Build a tutorial that turns the verified evidence for "${topic}" into actionable defensive steps.`
      : `Build a tutorial that applies the verified evidence for "${topic}" in a practical, source-backed workflow.`;
  }

  if (guidanceClaims.length > 0) {
    return `Design a hands-on cyber lab for ${topic} that practices the verified defensive guidance already identified from authoritative source pages.`;
  }

  return awareness.contentGapSummary
    ? `${awareness.contentGapSummary} Design a cyber lab that practices the verified defensive concepts for "${topic}".`
    : `Design a cyber lab grounded in the verified evidence collected for "${topic}".`;
}

export function deriveResearchConfidence({
  sources,
  verifiedClaims,
  uncertainClaims,
  unpromotedDiscoveryCount,
  pageBackedClaimCount,
  highRelevanceClaimCount,
}: {
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  unpromotedDiscoveryCount: number;
  pageBackedClaimCount: number;
  highRelevanceClaimCount: number;
}): ResearchConfidence {
  const officialCount = sources.filter(
    (source) => source.sourceType === "official",
  ).length;
  const highConfidenceClaims = verifiedClaims.filter(
    (claim) => claim.confidence === "high",
  ).length;
  const { structured, pageBacked } = countClaimsByOrigin(verifiedClaims);

  if (
    uncertainClaims.length > 0 ||
    unpromotedDiscoveryCount >= 3 ||
    verifiedClaims.length === 0 ||
    pageBackedClaimCount < 2 ||
    highRelevanceClaimCount < 2
  ) {
    return "low";
  }

  if (
    structured >= 2 ||
    (officialCount >= 2 &&
      pageBacked >= 2 &&
      highConfidenceClaims >= 3 &&
      highRelevanceClaimCount >= 2)
  ) {
    return "high";
  }

  if (
    verifiedClaims.length >= 2 &&
    officialCount >= 1 &&
    pageBackedClaimCount >= 2 &&
    highRelevanceClaimCount >= 1
  ) {
    return "medium";
  }

  return "low";
}

export function synthesizeResearchBrief(
  input: ResearchSynthesisInput,
): ResearchSynthesisOutput {
  const {
    topic,
    contentType,
    sources,
    verifiedClaims,
    uncertainClaims,
    awareness,
    unpromotedDiscoveryCount,
    pageBackedClaimCount,
    highRelevanceClaimCount,
    researchQuality,
  } = input;

  const { primaryKeyword, secondaryKeywords } = buildKeywords(
    topic,
    verifiedClaims,
  );

  const researchConfidence = deriveResearchConfidence({
    sources,
    verifiedClaims,
    uncertainClaims,
    unpromotedDiscoveryCount,
    pageBackedClaimCount,
    highRelevanceClaimCount,
  });

  return {
    summary: buildSummary(
      topic,
      verifiedClaims,
      sources,
      uncertainClaims,
      unpromotedDiscoveryCount,
      pageBackedClaimCount,
      highRelevanceClaimCount,
      researchQuality,
    ),
    recommendedAngle: buildRecommendedAngle(
      topic,
      contentType,
      awareness,
      verifiedClaims,
    ),
    primaryKeyword,
    secondaryKeywords,
    keyFindings: buildKeyFindings(verifiedClaims),
    researchConfidence,
  };
}
