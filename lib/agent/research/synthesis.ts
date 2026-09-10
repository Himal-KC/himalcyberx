import "server-only";

import { tokenizeAwarenessText } from "@/lib/agent/content-awareness";
import type { AgentContentType } from "@/lib/supabase/types";
import type {
  ContentAwarenessResult,
  ResearchConfidence,
  ResearchSource,
  UncertainClaim,
  VerifiedClaim,
} from "@/lib/agent/types";

export interface ResearchSynthesisInput {
  topic: string;
  contentType: AgentContentType;
  sources: ResearchSource[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  awareness: ContentAwarenessResult;
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

function buildKeywords(topic: string, verifiedClaims: VerifiedClaim[]): {
  primaryKeyword: string;
  secondaryKeywords: string[];
} {
  const topicTokens = tokenizeAwarenessText(topic);
  const cveClaim = verifiedClaims.find((claim) => claim.field === "cve_id");
  const primaryKeyword = cveClaim?.value ?? topicTokens.slice(0, 4).join(" ");

  const secondary = [
    ...topicTokens.slice(0, 8),
    ...verifiedClaims
      .filter((claim) => claim.field === "affected_product")
      .flatMap((claim) => tokenizeAwarenessText(claim.value)),
    ...verifiedClaims
      .filter((claim) => claim.field === "exploitation_status")
      .flatMap((claim) => tokenizeAwarenessText(claim.value)),
  ];

  return {
    primaryKeyword,
    secondaryKeywords: uniqueKeywords(secondary).slice(0, 8),
  };
}

function buildKeyFindings(
  verifiedClaims: VerifiedClaim[],
  uncertainClaims: UncertainClaim[],
  sources: ResearchSource[],
): string[] {
  const findings: string[] = [];

  for (const claim of verifiedClaims.slice(0, 6)) {
    findings.push(`${claim.label}: ${claim.value}`);
  }

  if (sources.length > 0) {
    findings.push(
      `${sources.length} authoritative source${sources.length === 1 ? "" : "s"} accepted for this research brief.`,
    );
  }

  if (uncertainClaims.length > 0) {
    findings.push(
      `${uncertainClaims.length} item${uncertainClaims.length === 1 ? "" : "s"} require review before content generation.`,
    );
  }

  return findings.slice(0, 8);
}

function buildSummary(
  topic: string,
  verifiedClaims: VerifiedClaim[],
  sources: ResearchSource[],
): string {
  const descriptionClaim = verifiedClaims.find(
    (claim) => claim.label === "Vulnerability description",
  );
  const exploitationClaim = verifiedClaims.find(
    (claim) => claim.field === "exploitation_status",
  );

  const parts: string[] = [
    `Research brief prepared for "${topic}".`,
  ];

  if (descriptionClaim) {
    parts.push(descriptionClaim.value);
  } else if (verifiedClaims.length > 0) {
    parts.push(
      `Verified evidence was collected for ${verifiedClaims.length} factual item${verifiedClaims.length === 1 ? "" : "s"}.`,
    );
  } else if (sources.length > 0) {
    parts.push(
      "Authoritative sources were identified, but only limited structured evidence could be verified without inference.",
    );
  } else {
    parts.push("No authoritative sources were accepted for this topic.");
  }

  if (exploitationClaim) {
    parts.push(exploitationClaim.value);
  }

  return parts.join(" ");
}

function buildRecommendedAngle(
  topic: string,
  contentType: AgentContentType,
  awareness: ContentAwarenessResult,
  verifiedClaims: VerifiedClaim[],
): string {
  const cveClaim = verifiedClaims.find((claim) => claim.field === "cve_id");
  const kevClaim = verifiedClaims.find(
    (claim) => claim.field === "exploitation_status",
  );

  if (contentType === "article") {
    if (cveClaim && kevClaim) {
      return `Explain ${cveClaim.value} for defenders, emphasizing verified exploitation status, affected products, and mitigation guidance from authoritative sources.`;
    }
    if (cveClaim) {
      return `Provide a defender-focused article on ${cveClaim.value}, grounded in NVD-verified vulnerability details and official guidance.`;
    }
    return `Cover "${topic}" with a threat-intelligence angle that highlights verified facts and avoids unsupported speculation.`;
  }

  if (contentType === "tutorial") {
    return awareness.contentGapSummary
      ? `${awareness.contentGapSummary} Build a step-by-step tutorial that helps defenders apply the verified guidance for "${topic}".`
      : `Create a practical tutorial that translates verified research on "${topic}" into actionable defensive steps.`;
  }

  return awareness.contentGapSummary
    ? `${awareness.contentGapSummary} Design a hands-on cyber lab that practices the verified defensive concepts for "${topic}".`
    : `Design a hands-on cyber lab grounded in verified research about "${topic}".`;
}

function deriveConfidence(
  sources: ResearchSource[],
  verifiedClaims: VerifiedClaim[],
  uncertainClaims: UncertainClaim[],
): ResearchConfidence {
  const officialCount = sources.filter(
    (source) => source.sourceType === "official",
  ).length;

  if (officialCount >= 2 && verifiedClaims.length >= 3 && uncertainClaims.length === 0) {
    return "high";
  }

  if (sources.length >= 1 && verifiedClaims.length >= 1) {
    return "medium";
  }

  return "low";
}

export function synthesizeResearchBrief(
  input: ResearchSynthesisInput,
): ResearchSynthesisOutput {
  const { topic, contentType, sources, verifiedClaims, uncertainClaims, awareness } =
    input;

  const { primaryKeyword, secondaryKeywords } = buildKeywords(
    topic,
    verifiedClaims,
  );

  return {
    summary: buildSummary(topic, verifiedClaims, sources),
    recommendedAngle: buildRecommendedAngle(
      topic,
      contentType,
      awareness,
      verifiedClaims,
    ),
    primaryKeyword,
    secondaryKeywords,
    keyFindings: buildKeyFindings(verifiedClaims, uncertainClaims, sources),
    researchConfidence: deriveConfidence(
      sources,
      verifiedClaims,
      uncertainClaims,
    ),
  };
}
