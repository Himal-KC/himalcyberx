import type { AgentContentType } from "../../supabase/types.ts";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "what",
  "when",
  "where",
  "why",
  "your",
  "this",
  "that",
  "about",
  "using",
  "use",
  "can",
  "their",
  "they",
  "them",
  "will",
  "should",
  "improve",
  "using",
]);

const GENERIC_TOPIC_TOKENS = new Set([
  "cybersecurity",
  "security",
  "cyber",
  "business",
  "businesses",
  "small",
  "guide",
  "guidance",
  "best",
  "practices",
  "tips",
  "overview",
  "introduction",
]);

const AUDIENCE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bsmall business(es)?\b/i, label: "Small business applicability" },
  { pattern: /\bsmb(s)?\b/i, label: "Small business applicability" },
  { pattern: /\benterprise(s)?\b/i, label: "Enterprise applicability" },
  { pattern: /\bbeginner(s)?\b/i, label: "Beginner audience applicability" },
  { pattern: /\bhome user(s)?\b/i, label: "Home user applicability" },
];

export type ContentIntentAreaId =
  | "topic_subject_depth"
  | "explanatory_coverage"
  | "audience_application"
  | "instructional_evidence"
  | "practical_workflow"
  | "defensive_guidance";

export interface ContentIntentArea {
  id: ContentIntentAreaId;
  label: string;
}

export interface ContentIntentProfile {
  areas: ContentIntentArea[];
  topicAnchors: string[];
  topicPhrases: string[];
  audienceLabels: string[];
  expectsExplanation: boolean;
  expectsDefensiveGuidance: boolean;
}

function normalizeIntentText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeIntentText(value: string): string[] {
  const normalized = normalizeIntentText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(key);
  }

  return result;
}

export function extractTopicAnchors(topic: string): string[] {
  const tokens = tokenizeIntentText(topic);
  const anchors = tokens.filter(
    (token) => token.length >= 3 && !GENERIC_TOPIC_TOKENS.has(token),
  );

  return uniqueStrings(anchors.length > 0 ? anchors : tokens.slice(0, 4));
}

export function extractTopicPhrases(topic: string): string[] {
  const tokens = tokenizeIntentText(topic);
  const phrases: string[] = [];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index];
    const right = tokens[index + 1];
    if (left.length >= 3 && right.length >= 3) {
      phrases.push(`${left} ${right}`);
    }
  }

  return uniqueStrings(phrases);
}

function topicExpectsExplanation(topic: string, recommendedAngle?: string | null): boolean {
  const combined = `${topic} ${recommendedAngle ?? ""}`.trim();
  return (
    /\bhow\b.+\bworks?\b/i.test(combined) ||
    /\bwhat is\b/i.test(combined) ||
    /\bwhy\b/i.test(combined) ||
    /\bunderstand(ing)?\b/i.test(combined) ||
    /\bexplain(ing)?\b/i.test(combined) ||
    /\bframework\b/i.test(combined) ||
    /\bessential\b/i.test(combined) ||
    /\barchitecture\b/i.test(combined)
  );
}

function topicExpectsDefensiveGuidance(topic: string): boolean {
  return (
    /\bhow to\b/i.test(topic) ||
    /\bprotect(ion)?\b/i.test(topic) ||
    /\bdefend(ing)?\b/i.test(topic) ||
    /\bmitigat/i.test(topic) ||
    /\bprevent(ion)?\b/i.test(topic) ||
    /\bharden(ing)?\b/i.test(topic) ||
    /\bimprove\b.+\bsecurity\b/i.test(topic)
  );
}

export function deriveContentIntentProfile(input: {
  topic: string;
  contentType: AgentContentType;
  recommendedAngle?: string | null;
}): ContentIntentProfile {
  const topicAnchors = extractTopicAnchors(input.topic);
  const topicPhrases = extractTopicPhrases(input.topic);
  const audienceLabels = uniqueStrings(
    AUDIENCE_PATTERNS.filter((entry) => entry.pattern.test(input.topic)).map(
      (entry) => entry.label,
    ),
  );

  const expectsExplanation = topicExpectsExplanation(
    input.topic,
    input.recommendedAngle,
  );
  const expectsDefensiveGuidance = topicExpectsDefensiveGuidance(input.topic);

  const areas: ContentIntentArea[] = [
    {
      id: "topic_subject_depth",
      label: "Topic-specific subject coverage",
    },
  ];

  if (expectsExplanation) {
    areas.push({
      id: "explanatory_coverage",
      label: "Explanatory coverage of the requested subject",
    });
  }

  for (const label of audienceLabels) {
    areas.push({
      id: "audience_application",
      label,
    });
  }

  if (input.contentType === "tutorial" || input.contentType === "lab") {
    areas.push({
      id: "instructional_evidence",
      label: "Instructional workflow evidence",
    });
  }

  if (input.contentType === "lab") {
    areas.push({
      id: "practical_workflow",
      label: "Practical lab workflow evidence",
    });
  }

  if (
    expectsDefensiveGuidance ||
    input.contentType === "tutorial" ||
    input.contentType === "lab"
  ) {
    areas.push({
      id: "defensive_guidance",
      label: "Defensive or actionable guidance evidence",
    });
  }

  const dedupedAreas: ContentIntentArea[] = [];
  const seen = new Set<ContentIntentAreaId>();
  for (const area of areas) {
    if (seen.has(area.id)) {
      continue;
    }
    seen.add(area.id);
    dedupedAreas.push(area);
  }

  return {
    areas: dedupedAreas,
    topicAnchors,
    topicPhrases,
    audienceLabels,
    expectsExplanation,
    expectsDefensiveGuidance,
  };
}

export function statementMatchesTopicAnchors(
  statement: string,
  anchors: string[],
  phrases: string[],
): boolean {
  const normalized = normalizeIntentText(statement);
  if (!normalized) {
    return false;
  }

  if (phrases.some((phrase) => normalized.includes(phrase))) {
    return true;
  }

  let matched = 0;
  for (const anchor of anchors) {
    if (normalized.includes(anchor)) {
      matched += 1;
    }
  }

  if (anchors.length <= 2) {
    return matched >= anchors.length;
  }

  return matched >= Math.min(2, anchors.length);
}

export function statementMatchesAudienceLabel(
  statement: string,
  audienceLabel: string,
): boolean {
  const normalized = normalizeIntentText(statement);
  if (audienceLabel.toLowerCase().includes("small business")) {
    return (
      /\bsmall business(es)?\b/i.test(normalized) ||
      /\bsmb(s)?\b/i.test(normalized)
    );
  }
  if (audienceLabel.toLowerCase().includes("enterprise")) {
    return /\benterprise(s)?\b/i.test(normalized);
  }
  if (audienceLabel.toLowerCase().includes("beginner")) {
    return /\bbeginner(s)?\b/i.test(normalized);
  }
  if (audienceLabel.toLowerCase().includes("home user")) {
    return /\bhome user(s)?\b/i.test(normalized);
  }

  return false;
}
