import "server-only";

import type { AgentSourceType } from "@/lib/supabase/types";

export interface AuthoritativeDomainRule {
  domain: string;
  publisher: string;
  sourceType: AgentSourceType;
  priority: number;
}

/** Lower priority number = higher authority. */
export const AUTHORITATIVE_DOMAIN_RULES: AuthoritativeDomainRule[] = [
  { domain: "nvd.nist.gov", publisher: "NIST NVD", sourceType: "official", priority: 1 },
  { domain: "cve.org", publisher: "CVE Program", sourceType: "official", priority: 2 },
  { domain: "cisa.gov", publisher: "CISA", sourceType: "official", priority: 3 },
  { domain: "cyber.gov.au", publisher: "Australian Cyber Security Centre", sourceType: "official", priority: 4 },
  { domain: "nist.gov", publisher: "NIST", sourceType: "official", priority: 5 },
  { domain: "msrc.microsoft.com", publisher: "Microsoft Security Response Center", sourceType: "official", priority: 6 },
  { domain: "microsoft.com", publisher: "Microsoft", sourceType: "official", priority: 7 },
  { domain: "security.googleblog.com", publisher: "Google Security Blog", sourceType: "official", priority: 8 },
  { domain: "cloud.google.com", publisher: "Google Cloud", sourceType: "official", priority: 9 },
  { domain: "mandiant.com", publisher: "Mandiant", sourceType: "primary", priority: 10 },
  { domain: "talosintelligence.com", publisher: "Cisco Talos", sourceType: "primary", priority: 11 },
  { domain: "unit42.paloaltonetworks.com", publisher: "Unit 42", sourceType: "primary", priority: 12 },
  { domain: "crowdstrike.com", publisher: "CrowdStrike", sourceType: "primary", priority: 13 },
  { domain: "cloudflare.com", publisher: "Cloudflare", sourceType: "primary", priority: 14 },
  { domain: "docs.github.com", publisher: "GitHub", sourceType: "official", priority: 15 },
  { domain: "github.com", publisher: "GitHub", sourceType: "official", priority: 16 },
  { domain: "google.com", publisher: "Google", sourceType: "primary", priority: 17 },
];

export const AUTHORITATIVE_SEARCH_DOMAINS = AUTHORITATIVE_DOMAIN_RULES.map(
  (rule) => rule.domain,
);

export function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isValidResearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeResearchUrl(url: string): string | null {
  if (!isValidResearchUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function matchAuthoritativeDomain(
  url: string,
): AuthoritativeDomainRule | null {
  const hostname = extractHostname(url);
  if (!hostname) {
    return null;
  }

  let best: AuthoritativeDomainRule | null = null;

  for (const rule of AUTHORITATIVE_DOMAIN_RULES) {
    if (hostname === rule.domain || hostname.endsWith(`.${rule.domain}`)) {
      if (!best || rule.priority < best.priority) {
        best = rule;
      }
    }
  }

  return best;
}

export function isAuthoritativeUrl(url: string): boolean {
  return matchAuthoritativeDomain(url) !== null;
}

export function compareSourceAuthority(
  leftUrl: string,
  rightUrl: string,
): number {
  const left = matchAuthoritativeDomain(leftUrl);
  const right = matchAuthoritativeDomain(rightUrl);

  if (left && right) {
    return left.priority - right.priority;
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
}
