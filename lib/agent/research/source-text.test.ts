import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const {
  deduplicateStatements,
  extractCleanStatements,
  isCompleteSentence,
  isEntityListFragment,
  isNoiseFragment,
  isPartialQuotation,
  statementExistsInSourceText,
} = (await import(
  pathToFileURL(join(testDir, "source-text.ts")).href
)) as typeof import("./source-text");

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

describe("Phase 3.2 sentence validation", () => {
  it('rejects "NSA), U.S." style entity list fragments', () => {
    const fragment =
      "The Federal Bureau of Investigation (FBI), Cybersecurity and Infrastructure Security Agency (CISA), Department of Defense Cyber Crime Center (DC3), National Security Agency (NSA), U.S.";

    assert.equal(isEntityListFragment(fragment), true);
    assert.equal(isCompleteSentence(fragment), false);
    assert.equal(extractCleanStatements(fragment).length, 0);
  });

  it("rejects unmatched opening quotation fragments", () => {
    const fragment =
      "“This advisory demonstrates CISA’s commitment to empowering critical infrastructure organizations with the tools and insights they need to outpace sophisticated cyber threats.";

    assert.equal(isPartialQuotation(fragment), true);
    assert.equal(isCompleteSentence(fragment), false);
  });

  it("accepts complete CISA factual statements", () => {
    const sentence =
      "CISA's StopRansomware Guide includes preparation, prevention, mitigation and response guidance for organizations.";

    assert.equal(isCompleteSentence(sentence), true);
    assert.deepEqual(extractCleanStatements(sentence), [sentence]);
  });
});

describe("page-backed statement verification", () => {
  const pageText =
    "StopRansomware Guide. CISA and the FBI maintain the #StopRansomware initiative for network defenders. The guide includes preparation, prevention, mitigation and response guidance for organizations.";

  it("extracts clean factual statements from authoritative page text", () => {
    const statements = extractCleanStatements(pageText);

    assert.equal(statements.length, 2);
    assert.match(statements[0], /#StopRansomware initiative/);
    assert.match(statements[1], /preparation, prevention, mitigation and response guidance/);
  });

  it("requires statements to exist in fetched page text", () => {
    const statement =
      "CISA and the FBI maintain the #StopRansomware initiative for network defenders.";

    assert.equal(statementExistsInSourceText(statement, pageText), true);
    assert.equal(
      statementExistsInSourceText(
        "CISA recommends immediate patching for all internet-facing systems.",
        pageText,
      ),
      false,
    );
  });
});

describe("CISA ransomware fixture expectations", () => {
  const noisySnippet =
    "Skip to main content. StopRansomware Guide. CISA and the FBI maintain the #StopRansomware initiative for network defenders. The guide includes preparation, prevention, mitigation and response guidance for organizations.";

  it("extracts only clean atomic statements from noisy discovery text", () => {
    const statements = extractCleanStatements(noisySnippet);

    assert.equal(statements.length, 2);
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
