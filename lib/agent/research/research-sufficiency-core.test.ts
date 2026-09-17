import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const sufficiency = (await import(
  pathToFileURL(join(testDir, "research-sufficiency-core.ts")).href
)) as typeof import("./research-sufficiency-core");

const eligibility = (await import(
  pathToFileURL(join(testDir, "research-generation-eligibility-core.ts")).href
)) as typeof import("./research-generation-eligibility-core");

const PRODUCTION_TOPIC =
  "How Small Businesses Can Improve Cybersecurity Using the Essential Eight";

function officialSource() {
  return {
    title: "Essential Eight",
    url: "https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight",
    publisher: "ACSC",
    sourceType: "official" as const,
  };
}

function topicRelevantClaim(statement: string, level: "high" | "medium" = "high") {
  return {
    id: `claim-${statement.slice(0, 12)}`,
    type: "official_guidance" as const,
    statement,
    sources: [{ url: officialSource().url, title: officialSource().title, publisher: "ACSC" }],
    confidence: "high" as const,
    relevanceLevel: level,
    relevanceScore: level === "high" ? 0.8 : 0.5,
  };
}

describe("Research sufficiency assessment", () => {
  it("production Essential Eight failure fixture blocks draft generation", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim(
          "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
        ),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.status, "needs_more_research");
    assert.ok(assessment.topicRelevantClaimCount >= 1);
    assert.ok(assessment.missingIntentAreas.length > 0);
    assert.ok(assessment.authoritativeSourceCount >= 1);

    const gate = eligibility.resolveResearchGenerationEligibility({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      payload: {
        keyFindings: [],
        verifiedClaims: [
          topicRelevantClaim(
            "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
          ),
        ],
        uncertainClaims: [],
        discoveryContexts: [],
        relatedHCXContent: [],
        researchConfidence: "medium",
        researchQuality: "needs_review",
        canGenerateDraft: true,
      },
      sources: [officialSource()],
    });

    assert.equal(gate.canGenerateDraft, false);
  });

  it("one weak generic claim cannot satisfy a framework-style article", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: "How the NIST Cybersecurity Framework works",
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim("Cybersecurity is important for modern organizations.", "medium"),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.notEqual(assessment.status, "sufficient");
  });

  it("multiple relevant verified claims with authoritative evidence can pass", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: "CISA ransomware preparedness guidance for network defenders",
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim(
          "CISA recommends maintaining offline backups and testing restoration for ransomware preparedness.",
        ),
        topicRelevantClaim(
          "Network defenders should implement phishing-resistant MFA as part of ransomware preparedness guidance.",
        ),
        topicRelevantClaim(
          "CISA guidance emphasizes patching internet-facing systems to reduce ransomware risk.",
        ),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "high",
      researchQuality: "passed",
    });

    assert.equal(assessment.status, "sufficient");
  });

  it("authoritative URL alone is insufficient", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      verifiedClaims: [],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.status, "needs_more_research");
    assert.match(assessment.reasons.join(" "), /authoritative source alone/i);
  });

  it("generic article with adequate evidence passes", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: "Recent CISA advisory on remote access vulnerabilities",
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim("CISA published an advisory detailing remote access vulnerability mitigations."),
        topicRelevantClaim("The advisory recommends disabling unused remote access services."),
        topicRelevantClaim("Organizations should monitor remote access logs for suspicious activity."),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "high",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.status, "sufficient");
  });

  it("tutorial requires instructional evidence depth", () => {
    const weak = sufficiency.assessResearchSufficiency({
      topic: "How to configure MFA for administrators",
      contentType: "tutorial",
      verifiedClaims: [
        topicRelevantClaim("MFA can improve administrator account security."),
        topicRelevantClaim("Administrator accounts are frequent targets in intrusions."),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.equal(weak.status, "needs_more_research");

    const strong = sufficiency.assessResearchSufficiency({
      topic: "How to configure MFA for administrators",
      contentType: "tutorial",
      verifiedClaims: [
        topicRelevantClaim(
          "Administrators should configure phishing-resistant MFA during privileged administrators account rollout.",
        ),
        topicRelevantClaim(
          "Security teams should disable legacy authentication before requiring MFA for administrators sign-ins.",
        ),
        topicRelevantClaim(
          "Organizations should monitor MFA enrollment gaps for administrators accounts after configuration.",
        ),
        topicRelevantClaim(
          "Implement conditional access policies to require MFA for administrators accounts during configuration.",
        ),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "high",
      researchQuality: "needs_review",
    });

    assert.equal(strong.status, "sufficient");
  });

  it("lab requires practical instructional evidence", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: "Memory Forensics Tutorial for Windows crash dumps",
      contentType: "lab",
      verifiedClaims: [
        topicRelevantClaim("Memory forensics can reveal malicious processes in Windows crash dumps."),
        topicRelevantClaim("Analysts should capture memory before rebooting a suspected compromised host."),
        topicRelevantClaim("Investigators should document acquisition tools used during memory forensics."),
        topicRelevantClaim("Teams should validate findings against known good process baselines."),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "high",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.status, "sufficient");
  });

  it("critical unresolved evidence gap blocks generation", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: "CVE-2024-0001 exploitation guidance",
      contentType: "article",
      verifiedClaims: [topicRelevantClaim("CVE-2024-0001 affects a widely deployed VPN appliance.")],
      uncertainClaims: [
        {
          id: "unc-1",
          label: "Critical unresolved evidence gap",
          reason: "Exploitation status could not be verified from authoritative pages.",
        },
      ],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.status, "blocked");
  });

  it("unrelated verified claims do not inflate sufficiency", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim(
          "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
        ),
        {
          ...topicRelevantClaim("Australia publishes quarterly weather summaries for coastal regions."),
          relevanceLevel: "low",
          relevanceScore: 0.1,
        },
        {
          ...topicRelevantClaim("Generic cybersecurity awareness training improves employee reporting."),
          relevanceLevel: "low",
          relevanceScore: 0.12,
        },
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
    });

    assert.equal(assessment.topicRelevantClaimCount, 1);
    assert.equal(assessment.status, "needs_more_research");
  });

  it("assessment is deterministic and idempotent", () => {
    const input = {
      topic: PRODUCTION_TOPIC,
      contentType: "article" as const,
      verifiedClaims: [
        topicRelevantClaim(
          "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
        ),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium" as const,
      researchQuality: "needs_review" as const,
    };

    const first = sufficiency.assessResearchSufficiency(input);
    const second = sufficiency.assessResearchSufficiency(input);
    assert.deepEqual(first, second);
  });

  it("legacy payload without sufficiency metadata recomputes eligibility", () => {
    const gate = eligibility.resolveResearchGenerationEligibility({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      payload: {
        keyFindings: [],
        verifiedClaims: [
          topicRelevantClaim(
            "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
          ),
        ],
        uncertainClaims: [],
        discoveryContexts: [],
        relatedHCXContent: [],
        researchConfidence: "medium",
        researchQuality: "needs_review",
        canGenerateDraft: true,
      },
      sources: [officialSource()],
    });

    assert.equal(gate.canGenerateDraft, false);
    assert.equal(gate.researchSufficiency.status, "needs_more_research");
  });

  it("improve research is bounded at max attempts", () => {
    const assessment = sufficiency.assessResearchSufficiency({
      topic: PRODUCTION_TOPIC,
      contentType: "article",
      verifiedClaims: [
        topicRelevantClaim(
          "The ACSC Essential Eight page describes strategies to help organizations mitigate cyber incidents.",
        ),
      ],
      uncertainClaims: [],
      sources: [officialSource()],
      researchConfidence: "medium",
      researchQuality: "needs_review",
      researchImprovementCount: sufficiency.MAX_RESEARCH_IMPROVEMENTS,
    });

    assert.equal(assessment.status, "blocked");
  });

  it("sufficiency modules do not call external research APIs", () => {
    const coreSource = readFileSync(
      join(testDir, "research-sufficiency-core.ts"),
      "utf8",
    );
    const intentSource = readFileSync(
      join(testDir, "research-content-intent-core.ts"),
      "utf8",
    );
    const gateSource = readFileSync(
      join(testDir, "research-generation-eligibility-core.ts"),
      "utf8",
    );

    for (const source of [coreSource, intentSource, gateSource]) {
      assert.doesNotMatch(source, /tavily|openai|fetch\(/i);
    }
  });

  it("improve research engine requires explicit server action wiring", () => {
    const improveSource = readFileSync(
      join(testDir, "improve-research-engine.ts"),
      "utf8",
    );
    const actionsSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );

    assert.match(actionsSource, /improveAgentResearch/);
    assert.match(actionsSource, /runAgentResearchImprovement/);
    assert.doesNotMatch(improveSource, /setInterval|while\s*\(/);
  });
});

describe("Research sufficiency integration guards", () => {
  it("generation engine uses research sufficiency eligibility", () => {
    const generationSource = readFileSync(
      join(testDir, "../generation/engine.ts"),
      "utf8",
    );
    assert.match(generationSource, /resolveResearchGenerationEligibility/);
    assert.doesNotMatch(generationSource, /deriveCanGenerateDraft/);
  });

  it("resume hydration recomputes canGenerateDraft without research engines", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-core.ts"),
      "utf8",
    );
    assert.match(resumeSource, /resolveResearchGenerationEligibility/);
    assert.doesNotMatch(resumeSource, /runAgentResearch/);
  });

  it("article category survives safe revision update payload", () => {
    const revisionSource = readFileSync(
      join(testDir, "../review/revision-save-core.ts"),
      "utf8",
    );
    assert.match(revisionSource, /category_id: input\.existingRow\.category_id/);
  });
});
