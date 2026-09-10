import "server-only";

import { tokenizeAwarenessText } from "@/lib/agent/content-awareness";
import type { AgentContentType } from "@/lib/supabase/types";
import type {
  ContentAwarenessResult,
  ResearchConfidence,
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
  guidance: number;
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

  let structured = 0;
  let guidance = 0;

  for (const claim of verifiedClaims) {
    if (structuredTypes.has(claim.type)) {
      structured += 1;
    } else if (claim.type === "guidance" || claim.type === "general") {
      guidance += 1;
    }
  }

  return { structured, guidance };
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

function buildKeyFindings(verifiedClaims: VerifiedClaim[]): string[] {
  const priority: VerifiedClaimType[] = [
    "cve_id",
    "exploitation_status",
    "cvss",
    "affected_product",
    "mitigation",
    "guidance",
    "general",
    "disclosure_date",
  ];

  const ordered = [...verifiedClaims].sort((left, right) => {
    const leftIndex = priority.indexOf(left.type);
    const rightIndex = priority.indexOf(right.type);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });

  const findings = deduplicateStatements(
    ordered.map((claim) => claim.statement),
  ).slice(0, 7);

  return findings;
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
): string {
  const publishers = topPublishers(sources);
  const findings = buildKeyFindings(verifiedClaims);
  const { structured, guidance } = countClaimsByOrigin(verifiedClaims);

  if (verifiedClaims.length === 0) {
    return `Research on "${topic}" identified ${sources.length} authoritative source${sources.length === 1 ? "" : "s"}, but no clean verified claims could be extracted without inference.`;
  }

  const publisherText =
    publishers.length > 0
      ? `Evidence was drawn from ${publishers.join(", ")}.`
      : "Evidence was drawn from authoritative cybersecurity sources.";

  const evidenceText =
    structured > 0
      ? `${structured} structured verification item${structured === 1 ? "" : "s"} were confirmed from official vulnerability data.`
      : `${guidance} clean guidance statement${guidance === 1 ? "" : "s"} were verified from authoritative sources.`;

  const leadFinding = findings[0];
  const parts = [
    `Research on "${topic}" produced ${verifiedClaims.length} verified factual claim${verifiedClaims.length === 1 ? "" : "s"}.`,
    publisherText,
    evidenceText,
  ];

  if (leadFinding) {
    parts.push(leadFinding);
  }

  if (uncertainClaims.length > 0) {
    parts.push(
      `${uncertainClaims.length} item${uncertainClaims.length === 1 ? "" : "s"} remain uncertain and should be reviewed before content generation.`,
    );
  } else if (unpromotedDiscoveryCount > 0) {
    parts.push(
      "Some discovery excerpts were retained as source context but were not promoted to verified claims.",
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
  const cveClaim = verifiedClaims.find((claim) => claim.type === "cve_id");
  const kevClaim = verifiedClaims.find(
    (claim) => claim.type === "exploitation_status",
  );
  const mitigationClaim = verifiedClaims.find(
    (claim) => claim.type === "mitigation",
  );
  const guidanceClaims = verifiedClaims.filter(
    (claim) => claim.type === "guidance",
  );

  if (contentType === "article") {
    if (cveClaim && kevClaim && mitigationClaim) {
      return `Write a defender-focused article on ${topic}, leading with verified KEV exploitation status, NVD vulnerability details, and CISA-required mitigation actions.`;
    }
    if (cveClaim) {
      return `Write a defender-focused article on ${topic}, centering NVD-verified vulnerability details and clearly separating confirmed facts from unverified exploitation or patch assumptions.`;
    }
    if (guidanceClaims.length > 0) {
      return `Write a practical article on ${topic} that translates verified official guidance into clear defensive priorities for network defenders and security teams.`;
    }
    return `Write an evidence-led article on ${topic} using only verified claims and clearly flagging any areas that still need manual review.`;
  }

  if (contentType === "tutorial") {
    if (guidanceClaims.length > 0) {
      return `Build a step-by-step tutorial on ${topic} that operationalizes the verified guidance already identified, with each major step tied to an authoritative source.`;
    }
    return awareness.contentGapSummary
      ? `${awareness.contentGapSummary} Build a tutorial that turns the verified evidence for "${topic}" into actionable defensive steps.`
      : `Build a tutorial that applies the verified evidence for "${topic}" in a practical, source-backed workflow.`;
  }

  if (guidanceClaims.length > 0) {
    return `Design a hands-on cyber lab for ${topic} that practices the verified defensive guidance already identified, without extending beyond the confirmed evidence.`;
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
}: {
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  unpromotedDiscoveryCount: number;
}): ResearchConfidence {
  const officialCount = sources.filter(
    (source) => source.sourceType === "official",
  ).length;
  const highConfidenceClaims = verifiedClaims.filter(
    (claim) => claim.confidence === "high",
  ).length;
  const { structured, guidance } = countClaimsByOrigin(verifiedClaims);

  if (
    uncertainClaims.length > 0 ||
    unpromotedDiscoveryCount >= 3 ||
    verifiedClaims.length === 0
  ) {
    return "low";
  }

  if (
    structured >= 2 ||
    (officialCount >= 2 && guidance >= 2 && highConfidenceClaims >= 3)
  ) {
    return "high";
  }

  if (verifiedClaims.length >= 2 && officialCount >= 1) {
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
  });

  return {
    summary: buildSummary(
      topic,
      verifiedClaims,
      sources,
      uncertainClaims,
      unpromotedDiscoveryCount,
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
