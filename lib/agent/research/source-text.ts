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
];

const MIN_STATEMENT_LENGTH = 40;
const MAX_STATEMENT_LENGTH = 280;

export function normalizeSourceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  ];

  if (noiseTokens.some((token) => lower.startsWith(token))) {
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
