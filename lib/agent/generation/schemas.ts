import { z } from "zod";

const generationPlanSchema = z.object({
  contentAngle: z.string().min(8).max(500),
  audience: z.string().min(8).max(300),
  intent: z.string().min(8).max(300),
  sectionPlan: z.array(z.string().min(3).max(200)).min(2).max(12),
});

const sourceMappingSchema = z.object({
  sectionKey: z.string().min(2).max(120),
  claim: z.string().min(8).max(1000),
  sourceUrls: z.array(z.string().url()).min(1).max(5),
});

const internalLinkSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(["article", "tutorial", "lab"]),
  anchorText: z.string().min(3).max(120),
  suggestedSection: z.string().min(2).max(120),
});

const seoSchema = z.object({
  seoTitle: z.string().min(10).max(70),
  seoDescription: z.string().min(40).max(180),
  seoKeywords: z.array(z.string().min(2).max(60)).min(1).max(12),
  ogTitle: z.string().min(10).max(70),
  ogDescription: z.string().min(40).max(200),
});

const sharedFields = {
  title: z.string().min(8).max(180),
  slug: z.string().min(3).max(120),
  primaryKeyword: z.string().min(2).max(80),
  secondaryKeywords: z.array(z.string().min(2).max(60)).max(12),
  seo: seoSchema,
  generationPlan: generationPlanSchema,
  sourceMappings: z.array(sourceMappingSchema).max(40),
  internalLinks: z.array(internalLinkSchema).max(5),
  warnings: z.array(z.string().max(300)).max(20),
};

const richHtmlField = z.string().min(80).max(50000);

export const articleGeneratedDraftSchema = z.object({
  contentType: z.literal("article"),
  ...sharedFields,
  excerpt: z.string().min(40).max(400),
  content: richHtmlField,
  categoryRecommendation: z.string().min(2).max(120),
  keyTakeaways: z.array(z.string().min(8).max(300)).min(1).max(8),
});

export const tutorialGeneratedDraftSchema = z.object({
  contentType: z.literal("tutorial"),
  ...sharedFields,
  description: z.string().min(20).max(500),
  category: z.string().min(2).max(80),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  estimatedTime: z.string().min(3).max(40),
  requirements: richHtmlField,
  introduction: richHtmlField,
  instructions: richHtmlField,
  keyTakeaways: richHtmlField,
  securityNotes: richHtmlField,
});

export const labGeneratedDraftSchema = z.object({
  contentType: z.literal("lab"),
  ...sharedFields,
  description: z.string().min(20).max(500),
  category: z.string().min(2).max(80),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  estimatedTime: z.string().min(3).max(40),
  learningObjectives: richHtmlField,
  requirementsTools: richHtmlField,
  introduction: richHtmlField,
  instructions: richHtmlField,
  expectedResult: richHtmlField,
  securityNotes: richHtmlField,
});

export const generatedDraftSchema = z.discriminatedUnion("contentType", [
  articleGeneratedDraftSchema,
  tutorialGeneratedDraftSchema,
  labGeneratedDraftSchema,
]);

export type GeneratedDraftSchema = z.infer<typeof generatedDraftSchema>;

type AgentContentTypeDraft = "article" | "tutorial" | "lab";

type ContentTypeDraftSchemaMap = {
  article: typeof articleGeneratedDraftSchema;
  tutorial: typeof tutorialGeneratedDraftSchema;
  lab: typeof labGeneratedDraftSchema;
};

const CONTENT_TYPE_DRAFT_SCHEMAS: ContentTypeDraftSchemaMap = {
  article: articleGeneratedDraftSchema,
  tutorial: tutorialGeneratedDraftSchema,
  lab: labGeneratedDraftSchema,
};

export const OPENAI_DRAFT_FORMAT_NAMES: Record<AgentContentTypeDraft, string> = {
  article: "hcx_article_draft",
  tutorial: "hcx_tutorial_draft",
  lab: "hcx_lab_draft",
};

type ZodSchemaWithDef = z.ZodType & {
  _zod?: {
    def?: {
      type?: string;
    };
  };
};

export function getZodSchemaRootType(schema: z.ZodType): string | undefined {
  return (schema as ZodSchemaWithDef)._zod?.def?.type;
}

export function isRootObjectZodSchema(schema: z.ZodType): boolean {
  return getZodSchemaRootType(schema) === "object";
}

export function isDiscriminatedUnionZodSchema(schema: z.ZodType): boolean {
  return getZodSchemaRootType(schema) === "union";
}

export function getContentTypeDraftSchema<T extends AgentContentTypeDraft>(
  contentType: T,
): ContentTypeDraftSchemaMap[T] {
  return CONTENT_TYPE_DRAFT_SCHEMAS[contentType];
}

export function getOpenAiDraftFormatName(
  contentType: AgentContentTypeDraft,
): string {
  return OPENAI_DRAFT_FORMAT_NAMES[contentType];
}

export function parseContentTypeDraftOutput(
  contentType: AgentContentTypeDraft,
  value: unknown,
): GeneratedDraftSchema | null {
  const parsed = getContentTypeDraftSchema(contentType).safeParse(value);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function parseArticleDraftOutput(
  value: unknown,
): z.infer<typeof articleGeneratedDraftSchema> | null {
  const parsed = articleGeneratedDraftSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseTutorialDraftOutput(
  value: unknown,
): z.infer<typeof tutorialGeneratedDraftSchema> | null {
  const parsed = tutorialGeneratedDraftSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseLabDraftOutput(
  value: unknown,
): z.infer<typeof labGeneratedDraftSchema> | null {
  const parsed = labGeneratedDraftSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
