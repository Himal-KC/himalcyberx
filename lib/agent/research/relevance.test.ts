import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const { classifyWebClaimType } = (await import(
  pathToFileURL(join(testDir, "claim-classifier.ts")).href
)) as typeof import("./claim-classifier");
const {
  isGenericOrPromotionalLanguage,
  scoreClaimRelevance,
  shouldPromoteWebClaim,
} = (await import(pathToFileURL(join(testDir, "relevance.ts")).href)) as typeof import("./relevance");

const TOPIC = "CISA ransomware preparedness guidance";

describe("claim relevance scoring", () => {
  it("rejects generic CISA advisory index language for ransomware preparedness", () => {
    const claim =
      "Alerts typically include information on newly exploited or disclosed vulnerabilities and associated mitigations.";

    const relevance = scoreClaimRelevance({
      topic: TOPIC,
      statement: claim,
      sourceTitle: "CISA Alerts",
      sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    });

    assert.equal(isGenericOrPromotionalLanguage(claim), true);
    assert.equal(relevance.relevanceLevel, "low");
    assert.equal(shouldPromoteWebClaim(relevance), false);
  });

  it("rejects FBI promotional language", () => {
    const claim =
      "The FBI is using every tool available to combat cyber threats facing the nation.";

    const relevance = scoreClaimRelevance({
      topic: TOPIC,
      statement: claim,
      sourceTitle: "FBI Cyber",
      sourceUrl: "https://www.fbi.gov/investigate/cyber",
    });

    assert.equal(isGenericOrPromotionalLanguage(claim), true);
    assert.equal(shouldPromoteWebClaim(relevance), false);
  });

  it("accepts high-relevance ransomware preparedness guidance", () => {
    const claim =
      "Organizations should maintain offline backups and test restoration procedures regularly to recover from ransomware incidents.";

    const relevance = scoreClaimRelevance({
      topic: TOPIC,
      statement: claim,
      sourceTitle: "StopRansomware Guide",
      sourceUrl: "https://www.cisa.gov/stopransomware",
    });

    assert.equal(relevance.relevanceLevel, "high");
    assert.equal(shouldPromoteWebClaim(relevance), true);
  });

  it("accepts phishing-resistant MFA guidance when topic supports prevention", () => {
    const claim =
      "CISA recommends implementing phishing-resistant MFA to reduce ransomware initial access risk.";

    const relevance = scoreClaimRelevance({
      topic: TOPIC,
      statement: claim,
      sourceTitle: "StopRansomware Guide",
      sourceUrl: "https://www.cisa.gov/stopransomware",
    });

    assert.ok(relevance.relevanceScore >= 40);
    assert.equal(shouldPromoteWebClaim(relevance), true);
  });

  it("scores generic cybersecurity claims as medium or low", () => {
    const claim =
      "Cybersecurity guidance helps organizations improve their security posture.";

    const relevance = scoreClaimRelevance({
      topic: TOPIC,
      statement: claim,
      sourceTitle: "Cybersecurity Overview",
      sourceUrl: "https://www.cisa.gov/topics/cybersecurity-best-practices",
    });

    assert.ok(["medium", "low"].includes(relevance.relevanceLevel));
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
