const NOISE_PATTERNS = [
  /^skip to (main )?content/i,
  /^home\s*[>|/]/i,
  /^breadcrumb/i,
  /^(menu|navigation|search|share|print|subscribe|sign in|log in)\b/i,
  /^#{1,6}\s/m,
  /\[.*?\]\(.*?\)/,
  /^read more$/i,
  /^click here/i,
  /^source-supported context/i,
  /^related (articles|links|content)/i,
];

const TRUNCATED_ENDINGS = [
  /\b(and|or|the|a|an|to|for|of|in|on|with|by|from|as|at|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|may|might|must|shall|can|need|including|such|that|this|these|those|their|our|your|its|into|through|during|before|after|above|below|between|under|over)$/i,
  /[,;:]\s*$/,
  /-\s*$/,
  /\.\.\.\s*$/,
  /…\s*$/,
];

const PROPOSITION_VERBS =
  /\b(is|are|was|were|has|have|had|provides|provide|includes|include|maintains|maintain|recommends|recommend|advises|advise|requires|require|supports|support|documents|document|lists|list|published|publish|identified|identify|enables|enable|helps|help|allows|allow|contains|contain|offers|offer|describes|describe|details|detail|demonstrates|demonstrate|empowers|empower|outlines|outline|explains|explain|addresses|address|protects|protect|defends|defend)\b/i;

const MIN_STATEMENT_LENGTH = 40;
const MAX_STATEMENT_LENGTH = 280;
const MIN_GUIDANCE_LENGTH = 25;
const MAX_GUIDANCE_LENGTH = 220;

const ACTIONABLE_GUIDANCE_VERBS =
  /\b(maintain|implement|patch|update|segment|enable|disable|monitor|test|backup|restore|encrypt|isolate|contain|deploy|configure|apply|use|avoid|limit|restrict|verify|review|document|train|ensure|create|develop|establish|remove|install|enforce|regularly|promptly)\b/i;

const IMPERATIVE_START =
  /^(Maintain|Implement|Patch|Update|Segment|Enable|Disable|Monitor|Test|Backup|Restore|Encrypt|Isolate|Contain|Apply|Use|Avoid|Limit|Restrict|Verify|Review|Document|Train|Ensure|Create|Develop|Establish|Deploy|Configure|Remove|Install|Enforce|Regularly|Promptly)\b/i;

export function normalizeSourceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasUnmatchedQuotation(text: string): boolean {
  let balance = 0;

  for (const char of text) {
    if (char === '"' || char === "\u201c") {
      balance += 1;
    }
    if (char === '"' || char === "\u201d") {
      balance -= 1;
    }
    if (balance < 0) {
      return true;
    }
  }

  return balance !== 0;
}

export function isPartialQuotation(text: string): boolean {
  const normalized = normalizeSourceText(text);
  const startsQuoted =
    normalized.startsWith('"') ||
    normalized.startsWith("\u201c") ||
    normalized.startsWith("“");
  const endsQuoted =
    normalized.endsWith('"') ||
    normalized.endsWith("\u201d") ||
    normalized.endsWith("”");

  if (startsQuoted && !endsQuoted) {
    return true;
  }

  if (!startsQuoted && endsQuoted) {
    return true;
  }

  return hasUnmatchedQuotation(normalized);
}

export function isEntityListFragment(text: string): boolean {
  const normalized = normalizeSourceText(text);
  const parenAcronyms = (normalized.match(/\([A-Z]{2,10}\)/g) ?? []).length;

  if (parenAcronyms >= 2 && !hasClearProposition(normalized)) {
    return true;
  }

  if (/,\s*U\.S\.\s*$/.test(normalized)) {
    return true;
  }

  if (
    /\([^)]+\)(?:,\s*[^(]+){1,}\s*,\s*(?:the\s+)?U\.S\.\s*$/i.test(normalized)
  ) {
    return true;
  }

  if (
    /(?:Agency|Administration|Center|Bureau|Department)\s*\([A-Z]{2,10}\)/i.test(
      normalized,
    ) &&
    /,\s*[A-Z][A-Za-z.\s]{0,12}\.\s*$/.test(normalized) &&
    !hasClearProposition(normalized)
  ) {
    return true;
  }

  return false;
}

export function hasClearProposition(text: string): boolean {
  const withoutParens = text.replace(/\([^)]*\)/g, " ");
  return PROPOSITION_VERBS.test(withoutParens);
}

export function isHeadingOrListFragment(text: string): boolean {
  const normalized = normalizeSourceText(text);
  if (/^[-*•]\s/.test(normalized)) {
    return true;
  }

  if (/^[A-Z0-9\s/&-]{3,60}:$/.test(normalized)) {
    return true;
  }

  const words = normalized.split(/\s+/);
  if (words.length <= 6 && !hasClearProposition(normalized)) {
    return true;
  }

  return false;
}

export function isNoiseFragment(text: string): boolean {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return true;
  }

  if (normalized.length < MIN_STATEMENT_LENGTH) {
    return true;
  }

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  const lower = normalized.toLowerCase();
  const noiseTokens = [
    "all topics",
    "sort by",
    "filter by",
    "last updated",
    "open menu",
    "close menu",
    "cookie policy",
    "privacy policy",
    "terms of use",
    "accept cookies",
    "we use cookies",
  ];

  if (noiseTokens.some((token) => lower.includes(token))) {
    return true;
  }

  return false;
}

export function isCompleteSentence(text: string): boolean {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return false;
  }

  if (!/^[A-Z0-9"“(]/.test(normalized)) {
    return false;
  }

  if (!/[.!?]["”']?$/.test(normalized)) {
    return false;
  }

  for (const pattern of TRUNCATED_ENDINGS) {
    if (pattern.test(normalized)) {
      return false;
    }
  }

  if (normalized.length < MIN_STATEMENT_LENGTH) {
    return false;
  }

  if (normalized.length > MAX_STATEMENT_LENGTH) {
    return false;
  }

  if (isPartialQuotation(normalized)) {
    return false;
  }

  if (isEntityListFragment(normalized)) {
    return false;
  }

  if (isHeadingOrListFragment(normalized)) {
    return false;
  }

  if (!hasClearProposition(normalized)) {
    return false;
  }

  return true;
}

export function splitIntoCandidateSentences(text: string): string[] {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return [];
  }

  const parts = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [normalized];
  }

  return parts;
}

function isGuidanceNoise(text: string): boolean {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return true;
  }

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  const lower = normalized.toLowerCase();
  const noiseTokens = [
    "skip to main content",
    "open menu",
    "close menu",
    "click here",
    "learn more",
    "cookie policy",
    "privacy policy",
    "terms of use",
  ];

  return noiseTokens.some((token) => lower.includes(token));
}

export function isActionableGuidanceStatement(text: string): boolean {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return false;
  }

  if (normalized.length < MIN_GUIDANCE_LENGTH) {
    return false;
  }

  if (normalized.length > MAX_GUIDANCE_LENGTH) {
    return false;
  }

  if (isGuidanceNoise(normalized)) {
    return false;
  }

  if (isPartialQuotation(normalized)) {
    return false;
  }

  if (isEntityListFragment(normalized)) {
    return false;
  }

  if (!ACTIONABLE_GUIDANCE_VERBS.test(normalized)) {
    return false;
  }

  const imperative = IMPERATIVE_START.test(normalized);
  const endsProperly = /[.!?]["”']?$/.test(normalized);

  if (!imperative && !endsProperly) {
    return false;
  }

  if (imperative && !endsProperly) {
    return normalized.split(/\s+/).length >= 4;
  }

  if (normalized.split(/\s+/).length <= 2) {
    return false;
  }

  return true;
}

export function extractActionableGuidanceStatements(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizeSourceText(line))
    .filter(Boolean);
  const statements: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!isActionableGuidanceStatement(line)) {
      continue;
    }

    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    statements.push(line.endsWith(".") ? line : `${line}.`);
  }

  return statements;
}

export function extractCleanStatements(text: string): string[] {
  const candidates = splitIntoCandidateSentences(text);
  const statements: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const cleaned = normalizeSourceText(candidate);
    if (isNoiseFragment(cleaned) || !isCompleteSentence(cleaned)) {
      continue;
    }

    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    statements.push(cleaned);
  }

  return statements;
}

export function statementExistsInSourceText(
  statement: string,
  sourceText: string,
): boolean {
  const normalizedStatement = normalizeSourceText(statement)
    .replace(/\.$/, "")
    .toLowerCase();
  const normalizedSource = normalizeSourceText(sourceText).toLowerCase();

  if (!normalizedStatement || !normalizedSource) {
    return false;
  }

  if (normalizedSource.includes(normalizedStatement)) {
    return true;
  }

  const withPeriod = `${normalizedStatement}.`;
  if (normalizedSource.includes(withPeriod)) {
    return true;
  }

  const prefixLength = Math.min(90, normalizedStatement.length);
  const prefix = normalizedStatement.slice(0, prefixLength);
  const minPrefix = normalizedStatement.length < 40 ? 15 : 40;
  return prefix.length >= minPrefix && normalizedSource.includes(prefix);
}

export function truncateDiscoveryExcerpt(text: string, maxLength = 220): string {
  const normalized = normalizeSourceText(text);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return `${truncated.slice(0, lastSpace)}…`;
  }

  return `${truncated}…`;
}

export function statementsAreSimilar(left: string, right: string): boolean {
  const a = left.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const b = right.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  if (a.includes(b) || b.includes(a)) {
    return true;
  }

  const aTokens = new Set(a.split(/\s+/).filter((token) => token.length > 3));
  const bTokens = new Set(b.split(/\s+/).filter((token) => token.length > 3));
  let overlap = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  const union = aTokens.size + bTokens.size - overlap;
  return union > 0 && overlap / union >= 0.75;
}

export function deduplicateStatements(statements: string[]): string[] {
  const result: string[] = [];

  for (const statement of statements) {
    if (result.some((existing) => statementsAreSimilar(existing, statement))) {
      continue;
    }
    result.push(statement);
  }

  return result;
}

export type CandidateRejectionReason =
  | "incomplete"
  | "boilerplate"
  | "promotional"
  | "low_relevance"
  | "duplicate"
  | "heading_only"
  | "unsupported"
  | "too_short";

export function extractPageCandidates(blocks: string[]): {
  prose: string[];
  guidance: string[];
} {
  const prose: string[] = [];
  const guidance: string[] = [];
  const pageText = blocks.join("\n");

  for (const block of blocks) {
    prose.push(...extractCleanStatements(block));
    guidance.push(...extractActionableGuidanceStatements(block));
  }

  return {
    prose: deduplicateStatements(prose),
    guidance: deduplicateStatements(guidance).filter((statement) =>
      statementExistsInSourceText(statement, pageText),
    ),
  };
}
