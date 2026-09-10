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

function isSpecificExploitationClaim(statement: string): boolean {
  if (GENERIC_EXPLOITATION_CONTEXT.some((pattern) => pattern.test(statement))) {
    return false;
  }

  return EXPLOITATION_STATUS_PATTERNS.some((pattern) => pattern.test(statement));
}

function hasActionableMitigation(statement: string): boolean {
  const lower = statement.toLowerCase();
  const hasMitigationTerm =
    /\bmitigat|\bremediat|\bpatch\b|\bworkaround\b|\bupdate\b/.test(lower);

  if (!hasMitigationTerm) {
    return false;
  }

  return (
    /\bshould\b|\brecommend|\bapply\b|\bdeploy\b|\bimplement\b|\benable\b|\bdisable\b|\bremove\b|\bupgrade\b/i.test(
      statement,
    ) || /\bcve-\d{4}-\d+\b/i.test(statement)
  );
}

function hasActionablePreparedness(statement: string): boolean {
  const lower = statement.toLowerCase();
  const hasPrepTerm =
    /\bpreparedness\b|\bpreparation\b|\bprepare\b|\bprevent\b|\bplan\b/.test(
      lower,
    );

  if (!hasPrepTerm) {
    return false;
  }

  return (
    hasActionableMitigation(statement) ||
    /\bmaintain\b|\btest\b|\bbackup\b|\brestore\b|\bdevelop\b|\bestablish\b/i.test(
      statement,
    )
  );
}

function hasActionableResponse(statement: string): boolean {
  const lower = statement.toLowerCase();
  const hasResponseTerm =
    /\brespond\b|\bincident response\b|\brecovery\b|\bcontain\b|\bisolate\b/.test(
      lower,
    );

  if (!hasResponseTerm) {
    return false;
  }

  return (
    /\bshould\b|\brecommend|\bsteps\b|\bplan\b|\bprocedure\b|\bplaybook\b/i.test(
      statement,
    ) || /\bcve-\d{4}-\d+\b/i.test(statement)
  );
}

function hasStructuredCvssEvidence(statement: string): boolean {
  return /\bcvss\b/i.test(statement) && /\b(score|vector|severity)\b/i.test(statement);
}

function hasPatchEvidence(statement: string): boolean {
  return (
    /\bpatch\b|\bsecurity update\b|\bfixed in\b|\bupdated version\b/i.test(
      statement,
    ) && /\b(cve-\d{4}-\d+|\d+\.\d+|\brelease\b|\bversion\b)/i.test(statement)
  );
}

export function classifyWebClaimType(statement: string): VerifiedClaimType {
  const lower = statement.toLowerCase();

  if (isSpecificExploitationClaim(statement)) {
    return "exploitation_status";
  }

  if (/\bcve-\d{4}-\d+\b/.test(lower)) {
    return "cve_id";
  }

  if (hasStructuredCvssEvidence(statement)) {
    return "cvss";
  }

  if (hasPatchEvidence(statement)) {
    return "patch_information";
  }

  if (hasActionablePreparedness(statement)) {
    return "preparedness";
  }

  if (hasActionableMitigation(statement)) {
    return "mitigation";
  }

  if (hasActionableResponse(statement)) {
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

  if (
    /\brecommend|\badvis|\bguidance\b|\bofficial\b/i.test(statement) &&
    hasActionableMitigation(statement) === false &&
    /\bshould\b|\bmust\b|\borganizations?\b/i.test(statement)
  ) {
    return "official_guidance";
  }

  if (/\bguid|\badvis|\brecommend|\bofficial\b/.test(lower)) {
    return "official_guidance";
  }

  return "guidance";
}
