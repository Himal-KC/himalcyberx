import type { VerifiedClaimType } from "@/lib/agent/types";

export function classifyWebClaimType(statement: string): VerifiedClaimType {
  const lower = statement.toLowerCase();

  if (/\bcve-\d{4}-\d+\b/.test(lower)) {
    return "cve_id";
  }

  if (/\bcvss\b/.test(lower)) {
    return "cvss";
  }

  if (/\bexploit/.test(lower)) {
    return "exploitation_status";
  }

  if (/\bpreparedness\b|\bpreparation\b|\bprepare\b/.test(lower)) {
    return "preparedness";
  }

  if (/\bmitigat|\bremediat|\bpatch\b/.test(lower)) {
    return "mitigation";
  }

  if (/\brespond\b|\bincident response\b|\brecovery\b/.test(lower)) {
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

  if (/\bguid|\badvis|\brecommend|\bofficial\b/.test(lower)) {
    return "official_guidance";
  }

  return "guidance";
}
