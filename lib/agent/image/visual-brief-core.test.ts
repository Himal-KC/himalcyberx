import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildFeaturedImageAltTextFromBrief,
  buildFeaturedImagePromptFromVisualBrief,
  buildFeaturedImageVisualBrief,
  detectArticleVisualTheme,
  promptDiscouragesGenericShieldLanguage,
  promptProhibitsFakeBranding,
  buildImagePromptContext,
  evaluateExistingFeaturedImageReuse,
  validateSourceImageLandscape,
} = (await import(pathToFileURL(join(testDir, "image-core.ts")).href)) as typeof import("./image-core");

const RUN_ID = "00000000-0000-4000-8000-000000000001";

describe("Featured image visual brief V2", () => {
  it("detects ransomware article themes for topic-specific prompts", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "article",
      topic: "Gunra ransomware campaign",
      title: "Gunra Ransomware Targets Remote Access and Backups",
      description: "Operators encrypt systems and pressure victims with double extortion.",
      contentAngle: "Ransomware operators targeting remote access and backup gaps",
      primaryKeyword: "Gunra ransomware",
      categoryLabel: "Ransomware",
      keyFindings: ["Maintain offline backups."],
      verifiedConcepts: ["Remote access is a common initial access vector."],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);

    assert.equal(detectArticleVisualTheme("gunra ransomware backup"), "ransomware");
    assert.match(prompt, /incident response|backup/i);
    assert.doesNotMatch(prompt, /phishing inbox/i);
  });

  it("does not apply ransomware styling to phishing articles", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "article",
      topic: "Phishing-resistant authentication",
      title: "Stopping Business Email Compromise",
      description: "Attackers use inbox social engineering rather than encryption.",
      contentAngle: "Phishing and inbox deception in enterprise email",
      primaryKeyword: "business email compromise",
      categoryLabel: "Phishing",
      keyFindings: ["Verify sender domains."],
      verifiedConcepts: [],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);

    assert.match(prompt, /inbox|workstation|email/i);
    assert.match(prompt, /do not force ransomware red styling/i);
    assert.doesNotMatch(prompt, /encrypted systems implied/i);
  });

  it("uses hands-on lab direction for cyber labs", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "lab",
      topic: "Memory forensics lab",
      title: "Analyze Suspicious Process Memory",
      description: "Students capture and inspect process memory artifacts.",
      contentAngle: "Hands-on memory forensics workflow",
      primaryKeyword: "memory forensics",
      categoryLabel: "Digital Forensics",
      keyFindings: [],
      verifiedConcepts: [],
      sectionFocus: "Capture memory; Identify suspicious modules",
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);

    assert.match(prompt, /Cyber Lab/i);
    assert.match(prompt, /forensic|lab workstation/i);
    assert.match(prompt, /fake screenshots pretending to be real case evidence/i);
  });

  it("uses task-specific tutorial direction", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "tutorial",
      topic: "Wireshark basics",
      title: "Capture and Filter Network Traffic with Wireshark",
      description: "Learn packet capture and display filters.",
      contentAngle: "Network traffic analysis for defenders",
      primaryKeyword: "Wireshark",
      categoryLabel: "Network Security",
      keyFindings: [],
      verifiedConcepts: [],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);

    assert.match(prompt, /Tutorial/i);
    assert.match(prompt, /network analysis|packet/i);
  });

  it("discourages generic shield and icon collage language", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "article",
      topic: "Security operations",
      title: "Modern SOC Visibility",
      description: "General SOC visibility improvements.",
      contentAngle: "Security operations visibility",
      primaryKeyword: "SOC",
      categoryLabel: "Security Operations",
      keyFindings: [],
      verifiedConcepts: [],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);
    assert.equal(promptDiscouragesGenericShieldLanguage(prompt), true);
  });

  it("prohibits fake logos and watermarks in prompts", () => {
    const prompt = buildFeaturedImagePromptFromVisualBrief(
      buildFeaturedImageVisualBrief({
        contentType: "article",
        topic: "Cloud security",
        title: "Cloud Identity Hardening",
        description: "Improve cloud identity controls.",
        contentAngle: "Cloud identity hardening",
        primaryKeyword: "cloud identity",
        categoryLabel: "Cloud Security",
        keyFindings: [],
        verifiedConcepts: [],
      }),
    );
    assert.equal(promptProhibitsFakeBranding(prompt), true);
  });

  it("requires wide landscape composition language", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "article",
      topic: "Vulnerability management",
      title: "Patch Prioritization for Critical CVEs",
      description: "Prioritize patching based on exposure.",
      contentAngle: "Vulnerability exposure and remediation",
      primaryKeyword: "patch prioritization",
      categoryLabel: "Vulnerabilities",
      keyFindings: [],
      verifiedConcepts: [],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(brief);
    assert.match(prompt, /wide 16:9|landscape/i);
    assert.match(brief.composition, /16:9/);
  });

  it("builds natural bounded alt text", () => {
    const brief = buildFeaturedImageVisualBrief({
      contentType: "article",
      topic: "Ransomware resilience",
      title: "Ransomware Backup and Recovery Planning",
      description: "Focus on immutable backups and recovery testing.",
      contentAngle: "Backup resilience against ransomware",
      primaryKeyword: "ransomware backups",
      categoryLabel: "Ransomware",
      keyFindings: ["Test recovery procedures regularly."],
      verifiedConcepts: [],
    });
    const alt = buildFeaturedImageAltTextFromBrief(brief);
    assert.ok(alt.length >= 80);
    assert.ok(alt.length <= 160);
    assert.equal(/^image of/i.test(alt), false);
  });

  it("supports article, tutorial, and lab content types", () => {
    for (const contentType of ["article", "tutorial", "lab"] as const) {
      const brief = buildFeaturedImageVisualBrief({
        contentType,
        topic: "Topic",
        title: "Title",
        description: "Description long enough for context.",
        contentAngle: "Specific editorial angle for the content",
        primaryKeyword: "keyword",
        categoryLabel: "Category",
        keyFindings: ["Finding one"],
        verifiedConcepts: [],
      });
      assert.equal(brief.contentType, contentType);
      assert.ok(buildFeaturedImagePromptFromVisualBrief(brief).length > 100);
    }
  });

  it("reuses existing agent-generated images unless force regenerate is requested", () => {
    const path = `articles/agent-${RUN_ID}-1234567890.webp`;
    assert.equal(
      evaluateExistingFeaturedImageReuse({
        featuredImageUrl: "https://example.com/articles/agent.webp",
        storagePath: path,
        agentRunId: RUN_ID,
        forceRegenerate: false,
      }),
      true,
    );
  });

  it("validates landscape source images before normalization", () => {
    const portrait = validateSourceImageLandscape({ width: 1024, height: 1536 });
    assert.equal(portrait.valid, false);
  });

  it("builds prompts server-side from persisted context fields only", () => {
    const context = buildImagePromptContext({
      contentType: "article",
      topic: "AI security governance",
      title: "Securing Enterprise LLM Deployments",
      description: "Governance and monitoring for enterprise LLM use.",
      contentAngle: "LLM security governance in enterprise environments",
      primaryKeyword: "LLM security",
      researchSummary: "Monitor model usage and access controls.",
      reviewSummary: "Review complete.",
      categoryLabel: "AI Security",
      keyFindings: ["Monitor model access."],
      verifiedConcepts: ["Access control reduces model abuse risk."],
    });
    const prompt = buildFeaturedImagePromptFromVisualBrief(context.visualBrief);
    assert.match(prompt, /LLM|AI compute/i);
  });
});

describe("Featured image V2 engine boundaries", () => {
  it("does not invoke research, review, readiness, or publish during image generation", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.equal(engineSource.includes("runAgentResearch"), false);
    assert.equal(engineSource.includes("runAgentReview"), false);
    assert.equal(engineSource.includes("runAgentReadinessEvaluation"), false);
    assert.equal(engineSource.includes("publishArticle"), false);
    assert.match(engineSource, /evaluateExistingFeaturedImageReuse/);
    assert.match(engineSource, /buildImagePromptContext/);
  });

  it("preserves draft on model, processing, upload, and attach failures", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /if \(!generated\.ok\)/);
    assert.match(engineSource, /if \(!processed\.ok\)/);
    assert.match(engineSource, /if \(!uploaded\.data/);
    assert.match(engineSource, /if \(attachError\)/);
    assert.match(engineSource, /stage: "fact_check"/);
  });

  it("passes explicit regenerate intent from the admin action only", () => {
    const actionSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );
    assert.match(actionSource, /forceRegenerate/);
    const panelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentFeaturedImagePanel.tsx"),
      "utf8",
    );
    assert.match(panelSource, /forceRegenerate/);
  });
});
