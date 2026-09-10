const PROMOTIONAL_PATTERNS = [
  /\busing every tool available\b/i,
  /\bstands ready\b/i,
  /\bstand ready\b/i,
  /\bcommitment to\b/i,
  /\bempowering\b/i,
  /\bleading the nation\b/i,
  /\bprotecting the nation\b/i,
  /\bworking tirelessly\b/i,
  /\bwe are dedicated\b/i,
  /\bour mission\b/i,
  /\bmission is to\b/i,
  /\bpartnership with\b/i,
  /\bworking together\b/i,
  /\balerts?\s+(typically|may|often|usually)\s+include\b/i,
  /\bthis (page|site|section)\s+(contains|provides|includes)\b/i,
  /\bvisit our website\b/i,
  /\blearn more about\b/i,
  /\bfor more information\b/i,
  /\bclick here\b/i,
];

const PAGE_DESCRIPTION_PATTERNS = [
  /\balerts?\s+(typically|may|often)\s+include\s+information\b/i,
  /\bnewly exploited or disclosed vulnerabilities\b/i,
  /\bthis advisory (page|index)\b/i,
  /\bthese pages (contain|provide|list)\b/i,
  /\bgeneral information about\b/i,
];

export function isGenericOrPromotionalLanguage(statement: string): boolean {
  const normalized = statement.trim();
  if (!normalized) {
    return true;
  }

  if (PROMOTIONAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (PAGE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

export function isPageDescriptionFragment(statement: string): boolean {
  return PAGE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(statement));
}
