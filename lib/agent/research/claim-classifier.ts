import type { VerifiedClaimType } from "@/lib/agent/types";

const EXPLOITATION_STATUS_PATTERNS = [
  /\bcve-\d{4}-\d+\b.*\b(exploited|exploitation)\b/i,
  /\b(exploited|exploitation)\b.*\bcve-\d{4}-\d+\b/i,
  /\bknown to be exploited\b/i,
  /\bexploited in the wild\b/i,
  /\bactive exploitation\b/i,
  /\bobserved exploitation\b/i,
  /\badded to (the )?cisa (known exploited vulnerabilities|kev)\b/i,
  /\blisted in (the )?cisa (known exploited vulnerabilities|kev)\b/i,
  /\bknown exploited vulnerabilities catalog\b/i,
];

const GENERIC_EXPLOITATION_CONTEXT = [
  /\balerts?\s+(typically|may|often|usually)\s+include\b/i,
  /\bnewly exploited or disclosed vulnerabilities\b/i,
  /\binformation on\b.+\bvulnerabilit/i,
];

const ACTIONABLE_VERB =
  /\b(maintain|implement|patch|update|segment|enable|disable|monitor|test|backup|restore|encrypt|isolate|contain|deploy|configure|apply|use|avoid|limit|restrict|verify|review|document|train|ensure|create|develop|establish|remove|install|enforce|regularly|promptly)\b/i;

function isSpecificExploitationClaim(statement: string): boolean {
  if (GENERIC_EXPLOITATION_CONTEXT.some((pattern) => pattern.test(statement))) {
    return false;
  }

  return EXPLOITATION_STATUS_PATTERNS.some((pattern) => pattern.test(statement));
}

function hasPatchEvidence(statement: string): boolean {
  return (
    /\bpatch\b|\bsecurity update\b|\bfixed in\b|\bupdated version\b|\bkb\d+/i.test(
      statement,
    ) &&
    /\b(cve-\d{4}-\d+|\d+\.\d+|\brelease\b|\bversion\b|kb\d+)/i.test(statement)
  );
}

export function classifyWebClaimType(statement: string): VerifiedClaimType {
  const lower = statement.toLowerCase();

  if (isSpecificExploitationClaim(statement)) {
    return "exploitation_status";
  }

  if (hasPatchEvidence(statement)) {
    return "patch_information";
  }

  if (/\bcve-\d{4}-\d+\b/.test(lower)) {
    return "cve_id";
  }

  if (/\bcvss\b/i.test(statement) && /\b(score|vector|severity)\b/i.test(statement)) {
    return "cvss";
  }

  if (/\bbackup|\bbackups\b|\boffline\b/.test(lower) && ACTIONABLE_VERB.test(statement)) {
    return "backup";
  }

  if (
    /\brestor|\brecovery\b/.test(lower) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "recovery";
  }

  if (
    /\bmfa\b|\bmultifactor|\bauthentication\b|\bphishing-resistant\b/i.test(
      statement,
    ) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "authentication";
  }

  if (
    /\bsegment|\blateral\b|\bnetwork\b/.test(lower) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "network_security";
  }

  if (
    /\bpreparedness\b|\bpreparation\b|\bprepare\b|\bprevent\b|\bplan\b/.test(
      lower,
    ) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "preparedness";
  }

  if (
    /\bmitigat|\bremediat|\bpatch|\bpatches\b/.test(lower) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "mitigation";
  }

  if (
    /\brespond\b|\bincident response\b|\bcontain\b|\bisolate\b/.test(lower) &&
    ACTIONABLE_VERB.test(statement)
  ) {
    return "response";
  }

  if (/\bthreat actor\b|\battribution\b/.test(lower)) {
    return "threat_actor_attribution";
  }

  if (/\bindicator\b|\bioc\b/.test(lower)) {
    return "indicators";
  }

  if (/\btechnique\b|\bmitre\b|\bt\d{4}\b/.test(lower)) {
    return "techniques";
  }

  if (ACTIONABLE_VERB.test(statement)) {
    return "official_guidance";
  }

  if (/\bguid|\badvis|\brecommend|\bofficial\b/.test(lower)) {
    return "official_guidance";
  }

  return "general";
}
