import { z } from "zod";

const openAiStringSchema = z.string();

const reviewFindingStatusSchema = z.enum([
  "supported",
  "partially_supported",
  "unsupported",
  "conflicting",
  "not_verifiable",
]);

const reviewFindingSeveritySchema = z.enum([
  "critical",
  "major",
  "minor",
  "informational",
]);

const reviewClaimTypeSchema = z.enum([
  "cve_id",
  "cvss",
  "kev_status",
  "affected_product",
  "affected_versions",
  "patch_id",
  "exploitation",
  "threat_actor",
  "statistics",
  "vendor_statement",
  "technical_behavior",
  "security_impact",
  "date",
  "recommendation",
  "general",
]);

const reviewIntegritySectionSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string().max(500)).max(40),
});

const reviewAssessmentSectionSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(8).max(1000),
  issues: z.array(z.string().max(500)).max(20),
});

const reviewQualityBreakdownSchema = z.object({
  factualGrounding: z.number().min(0).max(100),
  sourceIntegrity: z.number().min(0).max(100),
  technicalAccuracy: z.number().min(0).max(100),
  seoStructure: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  originality: z.number().min(0).max(100),
  internalLinkIntegrity: z.number().min(0).max(100),
});

export const solReviewOutputSchema = z.object({
  reviewVersion: openAiStringSchema.min(3).max(40),
  contentType: z.enum(["article", "tutorial", "lab"]),
  summary: z.string().min(20).max(2000),
  findings: z
    .array(
      z.object({
        findingId: openAiStringSchema.min(3).max(80),
        severity: reviewFindingSeveritySchema,
        claimType: reviewClaimTypeSchema,
        claimText: z.string().min(8).max(1000),
        status: reviewFindingStatusSchema,
        evidenceSourceIds: z.array(openAiStringSchema.min(1).max(80)).max(10),
        explanation: z.string().min(8).max(1500),
        suggestedCorrection: z.string().max(1000).nullable(),
      }),
    )
    .max(80),
  unsupportedClaims: z.array(z.string().max(1000)).max(40),
  conflictingClaims: z.array(z.string().max(1000)).max(40),
  sourceIntegrity: reviewIntegritySectionSchema,
  internalLinkIntegrity: reviewIntegritySectionSchema,
  seoReview: reviewAssessmentSectionSchema,
  readabilityReview: reviewAssessmentSectionSchema,
  originalityReview: reviewAssessmentSectionSchema,
  safetyReview: reviewAssessmentSectionSchema,
  qualityBreakdown: reviewQualityBreakdownSchema,
  publicationRecommendation: z.string().min(8).max(1000),
  warnings: z.array(z.string().max(500)).max(20),
}).superRefine((data, ctx) => {
  for (const finding of data.findings) {
    if (
      (finding.status === "supported" ||
        finding.status === "partially_supported") &&
      finding.evidenceSourceIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${finding.status}_finding_missing_evidence:${finding.findingId}`,
        path: ["findings"],
      });
    }
  }
});

export type SolReviewOutputSchema = z.infer<typeof solReviewOutputSchema>;

export const OPENAI_REVIEW_FORMAT_NAME = "hcx_phase5_review";

export function parseSolReviewOutput(value: unknown) {
  const parsed = solReviewOutputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
