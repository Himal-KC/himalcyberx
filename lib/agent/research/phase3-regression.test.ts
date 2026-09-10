import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const sourceText = (await import(
  pathToFileURL(join(testDir, "source-text.ts")).href
)) as typeof import("./source-text");
const htmlExtract = (await import(
  pathToFileURL(join(testDir, "html-extract.ts")).href
)) as typeof import("./html-extract");
const claimClassifier = (await import(
  pathToFileURL(join(testDir, "claim-classifier.ts")).href
)) as typeof import("./claim-classifier");
const sourceQuality = (await import(
  pathToFileURL(join(testDir, "source-quality.ts")).href
)) as typeof import("./source-quality");
const searchQueries = (await import(
  pathToFileURL(join(testDir, "search-queries-core.ts")).href
)) as typeof import("./search-queries-core");
const promotionalFilter = (await import(
  pathToFileURL(join(testDir, "promotional-filter.ts")).href
)) as typeof import("./promotional-filter");
const evaluateQuality = (await import(
  pathToFileURL(join(testDir, "evaluate-research-quality.ts")).href
)) as typeof import("./evaluate-research-quality");
const deriveCanGenerate = (await import(
  pathToFileURL(join(testDir, "derive-can-generate.ts")).href
)) as typeof import("./derive-can-generate");

const TOPIC = "CISA ransomware preparedness guidance";

describe("Phase 3 source text", () => {
  it("rejects agency-list fragment ending in U.S.", () => {
    const fragment =
      "The Federal Bureau of Investigation (FBI), Cybersecurity and Infrastructure Security Agency (CISA), Department of Defense Cyber Crime Center (DC3), National Security Agency (NSA), U.S.";
    assert.equal(sourceText.isEntityListFragment(fragment), true);
    assert.equal(sourceText.isCompleteSentence(fragment), false);
  });

  it("rejects unmatched quote", () => {
    const fragment =
      "“This advisory demonstrates CISA’s commitment to empowering critical infrastructure organizations.";
    assert.equal(sourceText.isPartialQuotation(fragment), true);
  });

  it("rejects navigation", () => {
    assert.equal(
      sourceText.isNoiseFragment("Home > Resources > Alerts > Ransomware guidance overview"),
      true,
    );
  });

  it("accepts complete factual statement", () => {
    const sentence =
      "CISA and the FBI maintain the #StopRansomware initiative for network defenders.";
    assert.equal(sourceText.isCompleteSentence(sentence), true);
  });
});

describe("Phase 3 HTML extraction", () => {
  const html = `
    <html><body>
      <nav>Skip to main content</nav>
      <h1>StopRansomware Guide</h1>
      <p>CISA provides ransomware preparedness resources for organizations.</p>
      <h2>Back Up Your Data</h2>
      <ul>
        <li>Maintain offline backups of data.</li>
        <li>Regularly test backup restoration procedures.</li>
      </ul>
      <footer>Privacy policy</footer>
    </body></html>
  `;

  it("extracts paragraph independently", () => {
    const blocks = htmlExtract.extractHtmlBlocks(html);
    assert.ok(
      blocks.some(
        (block) =>
          block.blockType === "prose" &&
          block.text.includes("ransomware preparedness resources"),
      ),
    );
  });

  it("extracts list item independently", () => {
    const blocks = htmlExtract.extractHtmlBlocks(html);
    const listItem = blocks.find((block) => block.text.includes("offline backups"));
    assert.equal(listItem?.blockType, "list_item");
  });

  it("does not merge heading with list item", () => {
    const blocks = htmlExtract.extractHtmlBlocks(html);
    const listItem = blocks.find((block) => block.text.includes("offline backups"));
    assert.equal(listItem?.headingContext, "Back Up Your Data");
    assert.equal(listItem?.text.includes("Back Up Your Data"), false);
  });

  it("does not merge nav/footer into claim blocks", () => {
    const blocks = htmlExtract.extractHtmlBlocks(html);
    assert.equal(
      blocks.some((block) => block.text.includes("Skip to main content")),
      false,
    );
    assert.equal(
      blocks.some((block) => block.text.includes("Privacy policy")),
      false,
    );
  });
});

describe("Phase 3 actionable guidance", () => {
  it('accepts "Maintain offline backups of data."', () => {
    assert.equal(
      sourceText.isActionableGuidanceStatement("Maintain offline backups of data."),
      true,
    );
  });

  it('accepts "Test restoration procedures regularly."', () => {
    assert.equal(
      sourceText.isActionableGuidanceStatement(
        "Regularly test backup restoration procedures.",
      ),
      true,
    );
  });

  it('accepts "Implement phishing-resistant MFA."', () => {
    assert.equal(
      sourceText.isActionableGuidanceStatement(
        "Implement phishing-resistant multifactor authentication.",
      ),
      true,
    );
  });

  it('rejects short fragment "Backups"', () => {
    assert.equal(sourceText.isActionableGuidanceStatement("Backups"), false);
  });
});

describe("Phase 3 promotional filtering", () => {
  it('rejects "The FBI is using every tool available..."', () => {
    assert.equal(
      promotionalFilter.isGenericOrPromotionalLanguage(
        "The FBI is using every tool available to combat cyber threats facing the nation.",
      ),
      true,
    );
  });

  it('rejects "CISA stands ready..." without concrete guidance', () => {
    assert.equal(
      promotionalFilter.isGenericOrPromotionalLanguage(
        "CISA stands ready to help organizations improve cybersecurity resilience.",
      ),
      true,
    );
  });
});

describe("Phase 3 relevance", () => {
  it("rejects generic alerts description for ransomware preparedness", () => {
    const statement =
      "Alerts typically include information on newly exploited or disclosed vulnerabilities and associated mitigations.";
    assert.equal(promotionalFilter.isGenericOrPromotionalLanguage(statement), true);
    assert.equal(sourceText.isActionableGuidanceStatement(statement), false);
  });

  it("accepts ransomware backup guidance", () => {
    assert.equal(
      sourceText.isActionableGuidanceStatement("Maintain offline backups of data."),
      true,
    );
  });

  it("uses heading context in HTML blocks for relevance support", () => {
    const blocks = htmlExtract.extractHtmlBlocks(`
      <h2>Back Up Your Data</h2>
      <ul><li>Maintain offline backups of data.</li></ul>
    `);
    const listItem = blocks.find((block) => block.text.includes("offline backups"));
    assert.equal(listItem?.headingContext, "Back Up Your Data");
  });
});

describe("Phase 3 classification", () => {
  it("does not classify generic exploited vulnerabilities as exploitation status", () => {
    assert.notEqual(
      claimClassifier.classifyWebClaimType(
        "Alerts may include exploited vulnerabilities and mitigation guidance.",
      ),
      "exploitation_status",
    );
  });

  it("classifies specific CVE exploited-in-the-wild statement", () => {
    assert.equal(
      claimClassifier.classifyWebClaimType(
        "CVE-2024-21412 is known to be exploited in the wild.",
      ),
      "exploitation_status",
    );
  });

  it("classifies mitigation action", () => {
    assert.equal(
      claimClassifier.classifyWebClaimType(
        "Organizations should apply vendor patches immediately.",
      ),
      "mitigation",
    );
  });

  it("classifies patch statement", () => {
    assert.equal(
      claimClassifier.classifyWebClaimType(
        "Apply vendor patch KB5034123 to address CVE-2024-21412.",
      ),
      "patch_information",
    );
  });
});

describe("Phase 3 quality gate", () => {
  const officialSource = {
    url: "https://www.cisa.gov/stopransomware",
    title: "StopRansomware",
    publisher: "CISA",
    sourceType: "official" as const,
  };

  const claim = (
    statement: string,
    level: "high" | "medium" = "high",
  ) => ({
    id: `verified-${statement.slice(0, 8)}`,
    type: "backup" as const,
    statement,
    sources: [{ url: officialSource.url, title: officialSource.title }],
    confidence: "high" as const,
    relevanceLevel: level,
    relevanceScore: level === "high" ? 80 : 50,
  });

  it("returns passed for 2 strong verified claims", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [
        claim("Maintain offline backups of data."),
        claim("Regularly test backup restoration procedures."),
      ],
      uncertainClaims: [],
      cveResults: [],
      researchConfidence: "medium",
      unpromotedDiscoveryCount: 0,
      pageBackedClaimCount: 2,
      highRelevanceClaimCount: 2,
      successfulPageFetchCount: 1,
      failedPageFetchCount: 0,
      topicHasCve: false,
    });
    assert.equal(quality, "passed");
  });

  it("returns needs_review for credible sources with 1 verified claim", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [claim("Maintain offline backups of data.")],
      uncertainClaims: [],
      cveResults: [],
      researchConfidence: "low",
      unpromotedDiscoveryCount: 1,
      pageBackedClaimCount: 1,
      highRelevanceClaimCount: 1,
      successfulPageFetchCount: 1,
      failedPageFetchCount: 0,
      topicHasCve: false,
    });
    assert.equal(quality, "needs_review");
  });

  it("returns needs_review for credible PDF-only discovery", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [
        {
          ...officialSource,
          url: "https://www.cisa.gov/sites/default/files/guide.pdf",
        },
      ],
      verifiedClaims: [],
      uncertainClaims: [
        {
          id: "uncertain-1",
          label: "Source page evidence",
          reason: "PDF evidence could not be extracted deterministically.",
        },
      ],
      cveResults: [],
      researchConfidence: "low",
      unpromotedDiscoveryCount: 1,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 0,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 1,
      topicHasCve: false,
    });
    assert.equal(quality, "needs_review");
  });

  it("returns needs_review when extraction is insufficient", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [],
      uncertainClaims: [
        {
          id: "uncertain-1",
          label: "Source page evidence",
          reason:
            "Authoritative sources were found, but insufficient page-verifiable topic-specific evidence was extracted.",
        },
      ],
      cveResults: [],
      researchConfidence: "low",
      unpromotedDiscoveryCount: 2,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 0,
      successfulPageFetchCount: 1,
      failedPageFetchCount: 0,
      topicHasCve: false,
    });
    assert.equal(quality, "needs_review");
  });

  it("returns failed for zero credible evidence", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [],
      verifiedClaims: [],
      uncertainClaims: [],
      cveResults: [],
      researchConfidence: "low",
      unpromotedDiscoveryCount: 0,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 0,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 0,
      topicHasCve: false,
    });
    assert.equal(quality, "failed");
  });

  it("returns failed for invalid CVE", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [officialSource],
      verifiedClaims: [],
      uncertainClaims: [],
      cveResults: [{ cveId: "CVE-2099-00001", status: "not_found", record: null }],
      researchConfidence: "low",
      unpromotedDiscoveryCount: 0,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 0,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 0,
      topicHasCve: true,
    });
    assert.equal(quality, "failed");
  });
});

describe("Phase 3 structured data safeguards", () => {
  it("keeps NVD structured verification path", () => {
    const quality = evaluateQuality.evaluateResearchQuality({
      sources: [
        {
          url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
          title: "NVD",
          publisher: "NIST NVD",
          sourceType: "official",
        },
      ],
      verifiedClaims: [
        {
          id: "verified-cve",
          type: "cve_id",
          statement:
            "CVE-2024-21412 is recorded in the NIST National Vulnerability Database.",
          sources: [
            {
              url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
              title: "NVD — CVE-2024-21412",
            },
          ],
          confidence: "high",
          relevanceLevel: "high",
        },
        {
          id: "verified-cvss",
          type: "cvss",
          statement:
            "NVD records a CVSS base score of 8.1 (High) for CVE-2024-21412.",
          sources: [
            {
              url: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412",
              title: "NVD — CVE-2024-21412",
            },
          ],
          confidence: "high",
          relevanceLevel: "high",
        },
      ],
      uncertainClaims: [],
      cveResults: [
        { cveId: "CVE-2024-21412", status: "verified", record: null },
      ],
      researchConfidence: "high",
      unpromotedDiscoveryCount: 0,
      pageBackedClaimCount: 0,
      highRelevanceClaimCount: 2,
      successfulPageFetchCount: 0,
      failedPageFetchCount: 0,
      topicHasCve: true,
    });
    assert.equal(quality, "passed");
  });
});

describe("Phase 3 source selection and queries", () => {
  it("ranks generic index below topic-specific guidance", () => {
    const indexScore = sourceQuality.scoreSourcePathQuality(
      "https://www.cisa.gov/news-events/cybersecurity-advisories",
    );
    const guideScore = sourceQuality.scoreSourcePathQuality(
      "https://www.cisa.gov/stopransomware/guide",
    );
    assert.ok(guideScore > indexScore);
  });

  it("deduplicates Tavily URLs in search query builder", () => {
    const queries = searchQueries.buildResearchSearchQueries(TOPIC);
    const unique = new Set(queries.map((query) => query.toLowerCase()));
    assert.equal(unique.size, queries.length);
    assert.ok(queries.length >= 1 && queries.length <= 3);
  });

  it("prefers HTML sources for fetch selection over PDF", () => {
    const selected = sourceQuality.selectUrlsForFetch([
      {
        url: "https://www.cisa.gov/sites/default/files/guide.pdf",
        sortOrder: 0,
      },
      {
        url: "https://www.cisa.gov/stopransomware/guide",
        sortOrder: 1,
      },
    ]);
    assert.deepEqual(selected, ["https://www.cisa.gov/stopransomware/guide"]);
  });
});

describe("Phase 3 canGenerateDraft", () => {
  it("allows draft generation for needs_review with credible sources", () => {
    assert.equal(
      deriveCanGenerate.deriveCanGenerateDraft("needs_review", [
        {
          url: "https://www.cisa.gov/stopransomware",
          title: "StopRansomware",
          sourceType: "official",
        },
      ]),
      true,
    );
  });

  it("blocks draft generation for failed research", () => {
    assert.equal(
      deriveCanGenerate.deriveCanGenerateDraft("failed", []),
      false,
    );
  });
});
