import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const validationLog = (await import(
  pathToFileURL(join(testDir, "validation-log-core.ts")).href
)) as typeof import("./validation-log-core");

describe("Phase 4 validation diagnostics logging", () => {
  it("maps reference errors to issue codes", () => {
    assert.deepEqual(
      validationLog.issueCodesForReferenceError(
        "Generated output contained a malformed source URL.",
      ),
      ["INVALID_SOURCE_URL"],
    );
    assert.deepEqual(
      validationLog.issueCodesForReferenceError(
        "Generated output referenced a source URL outside the research allowlist.",
      ),
      ["SOURCE_NOT_IN_ALLOWLIST"],
    );
  });

  it("maps structure errors to issue codes", () => {
    assert.deepEqual(
      validationLog.issueCodesForStructureError(
        "Generated output contained prohibited HTML.",
      ),
      ["INVALID_HTML"],
    );
    assert.deepEqual(
      validationLog.issueCodesForStructureError(
        "Generated title was too short.",
      ),
      ["CONTENT_TOO_SHORT"],
    );
  });

  it("classifies unsupported grounding claim types", () => {
    assert.deepEqual(
      validationLog.classifyUnsupportedClaimTypes([
        "CVE-2099-00001",
        "CVSS 9.8 severity",
        "CISA KEV catalog entry",
        "KB5034123",
      ]),
      ["cve", "cvss", "kev", "patch"],
    );
  });

  it("builds grounding validation logs with safe fields only", () => {
    const log = validationLog.buildGroundingValidationLog({
      agentRunId: "run-123",
      contentType: "article",
      audit: {
        passed: false,
        unsupportedClaims: ["CVE-2099-00001"],
        invalidSourceUrls: ["https://evil.example/not-allowed"],
        invalidInternalLinks: ["00000000-0000-4000-8000-000000000099"],
        warnings: [],
      },
    });

    assert.equal(log.validationStage, "grounding_audit");
    assert.equal(log.outcome, "failed");
    assert.ok(log.issueCodes.includes("UNSUPPORTED_CVE"));
    assert.ok(log.issueCodes.includes("SOURCE_NOT_IN_ALLOWLIST"));
    assert.ok(log.issueCodes.includes("INVALID_INTERNAL_LINK"));
    assert.equal(log.invalidSourceCount, 1);
    assert.equal(log.invalidInternalLinkCount, 1);
    assert.equal(log.reason, "Generated output failed validation.");
  });

  it("sanitizes validation reasons to short safe strings", () => {
    assert.equal(
      validationLog.sanitizeValidationReason("  too   long   reason   ".repeat(20).trim()).length,
      240,
    );
  });

  it("includes structure HTML diagnostic fields in validation logs", () => {
    const log = validationLog.buildValidationFailureLog({
      agentRunId: "run-phishing-365",
      contentType: "article",
      validationStage: "structure_validation",
      issueCodes: ["INVALID_HTML"],
      reason:
        "Generated output contained malformed HTML markup in article.content (nested_anchor).",
      failingField: "article.content",
      htmlIssue: "nested_anchor",
      htmlValidationPhase: "post_sanitize_only",
      markupExcerpt: '<li><a href="https://www.cisa.gov/phishing">CISA</a></li>',
    });

    assert.equal(log.failingField, "article.content");
    assert.equal(log.htmlIssue, "nested_anchor");
    assert.equal(log.htmlValidationPhase, "post_sanitize_only");
    assert.ok(log.markupExcerpt?.includes("cisa.gov"));
  });
});
