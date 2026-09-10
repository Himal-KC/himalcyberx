import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const { classifyWebClaimType } = (await import(
  pathToFileURL(join(testDir, "claim-classifier.ts")).href
)) as typeof import("./claim-classifier");
const {
  isActionableGuidanceStatement,
  isCompleteSentence,
} = (await import(pathToFileURL(join(testDir, "source-text.ts")).href)) as typeof import("./source-text");
const { isGenericOrPromotionalLanguage } = (await import(
  pathToFileURL(join(testDir, "promotional-filter.ts")).href
)) as typeof import("./promotional-filter");

describe("claim relevance scoring", () => {
  it("rejects generic CISA advisory index language for ransomware preparedness", () => {
    const claim =
      "Alerts typically include information on newly exploited or disclosed vulnerabilities and associated mitigations.";

    assert.equal(isGenericOrPromotionalLanguage(claim), true);
    assert.equal(isActionableGuidanceStatement(claim), false);
  });

  it("rejects FBI promotional language", () => {
    const claim =
      "The FBI is using every tool available to combat cyber threats facing the nation.";

    assert.equal(isActionableGuidanceStatement(claim), false);
  });

  it("accepts high-relevance ransomware preparedness guidance", () => {
    const claim =
      "Organizations should maintain offline backups and test restoration procedures regularly to recover from ransomware incidents.";

    assert.equal(isCompleteSentence(claim), true);
  });

  it("accepts phishing-resistant MFA guidance when topic supports prevention", () => {
    const claim =
      "Implement phishing-resistant multifactor authentication to reduce ransomware initial access risk.";

    assert.equal(isActionableGuidanceStatement(claim), true);
  });

  it("scores generic cybersecurity claims as medium or low", () => {
    const claim =
      "Cybersecurity guidance helps organizations improve their security posture.";

    assert.equal(isActionableGuidanceStatement(claim), false);
  });
});

describe("exploitation claim classification", () => {
  it("does not classify advisory index language as exploitation status", () => {
    const claim =
      "Alerts may include exploited vulnerabilities and mitigation guidance.";

    assert.notEqual(classifyWebClaimType(claim), "exploitation_status");
  });

  it("classifies specific exploitation status claims correctly", () => {
    const claim = "CVE-2024-21412 is known to be exploited in the wild.";

    assert.equal(classifyWebClaimType(claim), "exploitation_status");
  });
});
