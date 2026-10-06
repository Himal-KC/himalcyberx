import type { GroundingAuditResult } from "./types";

export type ValidationIssueCode =
  | "SCHEMA_VALIDATION_FAILED"
  | "CONTENT_TYPE_MISMATCH"
  | "CONTENT_TOO_SHORT"
  | "INVALID_HTML"
  | "INVALID_SLUG"
  | "UNSUPPORTED_CVE"
  | "UNSUPPORTED_CVSS"
  | "UNSUPPORTED_KEV_STATUS"
  | "UNSUPPORTED_PATCH_ID"
  | "INVALID_SOURCE_URL"
  | "SOURCE_NOT_IN_ALLOWLIST"
  | "INVALID_INTERNAL_LINK"
  | "GROUNDING_AUDIT_FAILED";

export type ValidationStage =
  | "openai_parse"
  | "openai_content_type"
  | "reference_validation"
  | "structure_validation"
  | "grounding_audit";

export type GenerationTraceCheckpoint =
  | "openai_success"
  | "validation_start"
  | "validation_success"
  | "grounding_start"
  | "grounding_success"
  | "save_start"
  | "save_success";

export interface GenerationValidationLog {
  agentRunId?: string | null;
  contentType?: string | null;
  validationStage: ValidationStage;
  outcome: "failed";
  issueCount: number;
  issueCodes: ValidationIssueCode[];
  unsupportedClaimTypes: string[];
  invalidSourceCount: number;
  invalidInternalLinkCount: number;
  reason: string | null;
  failingField?: string | null;
  htmlIssue?: string | null;
  htmlValidationPhase?: string | null;
  markupExcerpt?: string | null;
}

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/i;
const CVSS_PATTERN = /\bCVSS\b/i;
const KEV_PATTERN = /\b(known exploited vulnerabilities|CISA KEV|KEV catalog)\b/i;
const PATCH_PATTERN = /\bKB\d{5,7}\b/i;

export function sanitizeValidationReason(reason: string): string {
  return reason.replace(/\s+/g, " ").trim().slice(0, 240);
}

export function sanitizeProductWording(value: string): string {
  return value
    .replace(/[^\w\s().,/:-]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function sanitizeMarkupExcerpt(excerpt: string): string {
  return excerpt.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function logGenerationValidationFailure(
  log: GenerationValidationLog,
): void {
  console.error("[agent-generation:validation]", {
    agentRunId: log.agentRunId ?? null,
    contentType: log.contentType ?? null,
    validationStage: log.validationStage,
    outcome: log.outcome,
    issueCount: log.issueCount,
    issueCodes: log.issueCodes,
    unsupportedClaimTypes: log.unsupportedClaimTypes,
    invalidSourceCount: log.invalidSourceCount,
    invalidInternalLinkCount: log.invalidInternalLinkCount,
    reason: log.reason,
    failingField: log.failingField ?? null,
    htmlIssue: log.htmlIssue ?? null,
    htmlValidationPhase: log.htmlValidationPhase ?? null,
    markupExcerpt: log.markupExcerpt ?? null,
  });
}

export function logGenerationTrace(
  checkpoint: GenerationTraceCheckpoint,
  context: {
    agentRunId?: string | null;
    contentType?: string | null;
  },
): void {
  console.log("[agent-generation:trace]", {
    checkpoint,
    agentRunId: context.agentRunId ?? null,
    contentType: context.contentType ?? null,
  });
}

export function classifyUnsupportedClaimTypes(claims: string[]): string[] {
  const types = new Set<string>();

  for (const claim of claims) {
    if (CVE_PATTERN.test(claim)) {
      types.add("cve");
    }
    if (CVSS_PATTERN.test(claim)) {
      types.add("cvss");
    }
    if (KEV_PATTERN.test(claim)) {
      types.add("kev");
    }
    if (PATCH_PATTERN.test(claim)) {
      types.add("patch");
    }
  }

  return [...types];
}

export function issueCodesForUnsupportedClaims(
  claims: string[],
): ValidationIssueCode[] {
  const codes = new Set<ValidationIssueCode>();

  for (const claim of claims) {
    if (CVE_PATTERN.test(claim)) {
      codes.add("UNSUPPORTED_CVE");
    }
    if (CVSS_PATTERN.test(claim)) {
      codes.add("UNSUPPORTED_CVSS");
    }
    if (KEV_PATTERN.test(claim)) {
      codes.add("UNSUPPORTED_KEV_STATUS");
    }
    if (PATCH_PATTERN.test(claim)) {
      codes.add("UNSUPPORTED_PATCH_ID");
    }
  }

  if (claims.length > 0 && codes.size === 0) {
    codes.add("GROUNDING_AUDIT_FAILED");
  }

  return [...codes];
}

export function issueCodesForReferenceError(
  reason: string,
): ValidationIssueCode[] {
  if (reason.includes("malformed source URL")) {
    return ["INVALID_SOURCE_URL"];
  }

  if (reason.includes("outside the research allowlist")) {
    return ["SOURCE_NOT_IN_ALLOWLIST"];
  }

  if (reason.includes("malformed internal link ID")) {
    return ["INVALID_INTERNAL_LINK"];
  }

  if (reason.includes("unknown internal link")) {
    return ["INVALID_INTERNAL_LINK"];
  }

  return ["GROUNDING_AUDIT_FAILED"];
}

export function issueCodesForStructureError(
  reason: string,
): ValidationIssueCode[] {
  if (reason.includes("did not match the requested content type")) {
    return ["CONTENT_TYPE_MISMATCH"];
  }

  if (reason.includes("slug failed validation")) {
    return ["INVALID_SLUG"];
  }

  if (reason.includes("prohibited HTML")) {
    return ["INVALID_HTML"];
  }

  if (reason.includes("malformed HTML markup")) {
    return ["INVALID_HTML"];
  }

  if (reason.includes("title was too short")) {
    return ["CONTENT_TOO_SHORT"];
  }

  return ["GROUNDING_AUDIT_FAILED"];
}

function parseUnsupportedClaimToken(claim: string): {
  kind: string;
  cveId?: string;
  value?: string;
} {
  if (claim.startsWith("internal_link:")) {
    const [, contentId, cveId] = claim.split(":");
    return {
      kind: "internal_link_cve",
      cveId,
      value: contentId,
    };
  }

  const parts = claim.split(":");
  if (parts.length >= 3) {
    return {
      kind: parts[0] ?? "unknown",
      cveId: parts[1],
      value: parts.slice(2).join(":"),
    };
  }

  return {
    kind: parts[0] ?? "unknown",
    value: parts[1],
  };
}

export function formatGroundingAuditFailureReason(
  audit: GroundingAuditResult,
): string {
  if (audit.unsupportedClaims.length > 0) {
    const firstClaim = audit.unsupportedClaims[0]?.trim() ?? "";
    if (CVE_PATTERN.test(firstClaim) && firstClaim.split(":").length === 1) {
      const cveId = firstClaim.match(CVE_PATTERN)?.[0]?.toUpperCase() ?? firstClaim;
      return sanitizeValidationReason(
        `Draft validation failed: CVE ${cveId} is not supported by verified research.`,
      );
    }

    const token = parseUnsupportedClaimToken(firstClaim);
    switch (token.kind) {
      case "cve":
        return sanitizeValidationReason(
          `Draft validation failed: CVE ${token.cveId ?? token.value ?? "identifier"} is not supported by verified research.`,
        );
      case "cvss_score":
        return sanitizeValidationReason(
          `Draft validation failed: CVSS score ${token.value ?? "value"} for ${token.cveId ?? "the CVE"} is not supported by verified research.`,
        );
      case "cvss_severity":
        return sanitizeValidationReason(
          `Draft validation failed: CVSS severity ${token.value ?? "value"} for ${token.cveId ?? "the CVE"} is not supported by verified research.`,
        );
      case "cvss_vector":
        return sanitizeValidationReason(
          `Draft validation failed: CVSS vector for ${token.cveId ?? "the CVE"} is not supported by verified research.`,
        );
      case "kev_status":
        return sanitizeValidationReason(
          `Draft validation failed: CISA KEV status for ${token.cveId ?? "the CVE"} is not supported by verified research.`,
        );
      case "patch_id":
        return sanitizeValidationReason(
          `Draft validation failed: patch ID ${token.value ?? "value"} is not supported by verified research.`,
        );
      case "affected_product": {
        const productLabel = sanitizeProductWording(token.value ?? "wording");
        return sanitizeValidationReason(
          `Draft validation failed: affected product "${productLabel}" for ${token.cveId ?? "the CVE"} is not supported by verified research.`,
        );
      }
      case "internal_link_cve":
        return sanitizeValidationReason(
          `Draft validation failed: internal link references CVE ${token.cveId ?? "identifier"} not present on the linked HCX content.`,
        );
      default:
        return sanitizeValidationReason(
          "Draft validation failed: draft includes factual claims not supported by verified research.",
        );
    }
  }

  if (audit.invalidSourceUrls.length > 0) {
    return sanitizeValidationReason(
      "Draft validation failed: citation URL is not present in verified research sources.",
    );
  }

  if (audit.invalidInternalLinks.length > 0) {
    return sanitizeValidationReason(
      "Draft validation failed: internal link references unknown or disallowed HCX content.",
    );
  }

  return sanitizeValidationReason(
    "Draft validation failed: grounding audit failed.",
  );
}

export function buildGroundingValidationLog(input: {
  agentRunId?: string | null;
  contentType?: string | null;
  audit: GroundingAuditResult;
}): GenerationValidationLog {
  const issueCodes = new Set<ValidationIssueCode>(
    issueCodesForUnsupportedClaims(input.audit.unsupportedClaims),
  );

  if (input.audit.invalidSourceUrls.length > 0) {
    issueCodes.add("SOURCE_NOT_IN_ALLOWLIST");
  }

  if (input.audit.invalidInternalLinks.length > 0) {
    issueCodes.add("INVALID_INTERNAL_LINK");
  }

  if (issueCodes.size === 0) {
    issueCodes.add("GROUNDING_AUDIT_FAILED");
  }

  const issueCodeList = [...issueCodes];

  return {
    agentRunId: input.agentRunId ?? null,
    contentType: input.contentType ?? null,
    validationStage: "grounding_audit",
    outcome: "failed",
    issueCount: issueCodeList.length,
    issueCodes: issueCodeList,
    unsupportedClaimTypes: classifyUnsupportedClaimTypes(
      input.audit.unsupportedClaims,
    ),
    invalidSourceCount: input.audit.invalidSourceUrls.length,
    invalidInternalLinkCount: input.audit.invalidInternalLinks.length,
    reason: formatGroundingAuditFailureReason(input.audit),
  };
}

export function buildValidationFailureLog(input: {
  agentRunId?: string | null;
  contentType?: string | null;
  validationStage: ValidationStage;
  issueCodes: ValidationIssueCode[];
  reason: string;
  unsupportedClaimTypes?: string[];
  invalidSourceCount?: number;
  invalidInternalLinkCount?: number;
  failingField?: string | null;
  htmlIssue?: string | null;
  htmlValidationPhase?: string | null;
  markupExcerpt?: string | null;
}): GenerationValidationLog {
  const issueCodes = [...new Set(input.issueCodes)];

  return {
    agentRunId: input.agentRunId ?? null,
    contentType: input.contentType ?? null,
    validationStage: input.validationStage,
    outcome: "failed",
    issueCount: issueCodes.length,
    issueCodes,
    unsupportedClaimTypes: input.unsupportedClaimTypes ?? [],
    invalidSourceCount: input.invalidSourceCount ?? 0,
    invalidInternalLinkCount: input.invalidInternalLinkCount ?? 0,
    reason: sanitizeValidationReason(input.reason),
    failingField: input.failingField ?? null,
    htmlIssue: input.htmlIssue ?? null,
    htmlValidationPhase: input.htmlValidationPhase ?? null,
    markupExcerpt: input.markupExcerpt
      ? sanitizeMarkupExcerpt(input.markupExcerpt)
      : null,
  };
}
