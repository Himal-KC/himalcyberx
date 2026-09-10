import type {
  DraftQualityAssessment,
  GeneratedDraft,
  GroundingAuditResult,
} from "@/lib/agent/generation/types";
import type { ResearchQuality } from "@/lib/agent/types";

export function assessDraftQuality({
  draft,
  groundingAudit,
  researchQuality,
}: {
  draft: GeneratedDraft;
  groundingAudit: GroundingAuditResult;
  researchQuality: ResearchQuality;
}): DraftQualityAssessment {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 55;

  if (draft.generationPlan.sectionPlan.length >= 3) {
    score += 8;
    strengths.push("Structured section plan present.");
  } else {
    weaknesses.push("Limited section planning.");
  }

  if (draft.sourceMappings.length >= 2) {
    score += 10;
    strengths.push("Source mappings included.");
  } else {
    weaknesses.push("Limited source traceability.");
  }

  if (draft.seo.seoTitle && draft.seo.seoDescription) {
    score += 8;
    strengths.push("SEO metadata generated.");
  }

  if (groundingAudit.passed) {
    score += 15;
    strengths.push("Grounding audit passed.");
  } else {
    weaknesses.push("Grounding audit reported issues.");
    score -= 10;
  }

  if (researchQuality === "passed") {
    score += 8;
    strengths.push("Research passed quality gate.");
  } else if (researchQuality === "needs_review") {
    weaknesses.push("Research requires review before publication.");
  }

  if (draft.warnings.length > 0) {
    weaknesses.push("Generation warnings recorded.");
    score -= 4;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
  };
}
