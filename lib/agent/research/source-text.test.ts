import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deduplicateStatements,
  extractCleanStatements,
  isCompleteSentence,
  isNoiseFragment,
} from "./source-text.ts";

describe("source-text hardening", () => {
  it("rejects truncated snippets", () => {
    const truncated =
      "CISA and the FBI maintain the #StopRansomware initiative for network";

    assert.equal(isCompleteSentence(truncated), false);
    assert.equal(extractCleanStatements(truncated).length, 0);
  });

  it("accepts complete guidance sentences", () => {
    const sentence =
      "CISA and the FBI maintain the #StopRansomware initiative for network defenders.";

    assert.equal(isCompleteSentence(sentence), true);
    assert.deepEqual(extractCleanStatements(sentence), [sentence]);
  });

  it("rejects navigation noise", () => {
    const noise = "Home > Resources > Alerts > Ransomware guidance overview";

    assert.equal(isNoiseFragment(noise), true);
    assert.equal(extractCleanStatements(noise).length, 0);
  });

  it("deduplicates similar statements", () => {
    const left =
      "CISA's StopRansomware Guide includes preparation, prevention, mitigation and response guidance.";
    const right =
      "CISA's StopRansomware Guide includes preparation, prevention, mitigation and response guidance";

    assert.deepEqual(deduplicateStatements([left, right]), [left]);
  });
});

describe("CISA ransomware fixture expectations", () => {
  const noisySnippet =
    "Skip to main content. StopRansomware Guide. CISA and the FBI maintain the #StopRansomware initiative for network defenders. The guide includes preparation, prevention, mitigation and response guidance for organizations.";

  it("extracts only clean atomic statements from noisy discovery text", () => {
    const statements = extractCleanStatements(noisySnippet);

    assert.equal(statements.length, 2);
    assert.match(statements[0], /#StopRansomware initiative/);
    assert.match(statements[1], /preparation, prevention, mitigation and response guidance/);
    assert.equal(
      statements.some((statement) => statement.startsWith("Skip to")),
      false,
    );
  });
});

describe("CVE fake fixture expectations", () => {
  it("does not treat malformed CVE text as a complete sentence", () => {
    const fake =
      "CVE-2099-00001 could not be verified in NVD and cannot be treated as";

    assert.equal(isCompleteSentence(fake), false);
  });
});
