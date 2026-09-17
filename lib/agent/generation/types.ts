import type {
  AgentContentType,
  AgentFactCheckStatus,
} from "@/lib/supabase/types";
import type {
  ContentAwarenessResult,
  ContentSimilarityMatch,
  DiscoveryContext,
  ResearchConfidence,
  ResearchQuality,
  UncertainClaim,
  VerifiedClaim,
} from "@/lib/agent/types";

export interface GenerationPlan {
  contentAngle: string;
  audience: string;
  intent: string;
  sectionPlan: string[];
}

export interface SourceMapping {
  sectionKey: string;
  claim: string;
  sourceUrls: string[];
}

export interface InternalLinkSuggestion {
  contentId: string;
  contentType: AgentContentType;
  anchorText: string;
  suggestedSection: string;
}

export interface GenerationWarning {
  code: string;
  message: string;
}

export interface SeoFields {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogTitle: string;
  ogDescription: string;
}

export interface ArticleGeneratedDraft {
  contentType: "article";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryRecommendation: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  keyTakeaways: string[];
  seo: SeoFields;
  generationPlan: GenerationPlan;
  sourceMappings: SourceMapping[];
  internalLinks: InternalLinkSuggestion[];
  warnings: string[];
}

export interface TutorialGeneratedDraft {
  contentType: "tutorial";
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  requirements: string;
  introduction: string;
  instructions: string;
  keyTakeaways: string;
  securityNotes: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seo: SeoFields;
  generationPlan: GenerationPlan;
  sourceMappings: SourceMapping[];
  internalLinks: InternalLinkSuggestion[];
  warnings: string[];
}

export interface LabGeneratedDraft {
  contentType: "lab";
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  learningObjectives: string;
  requirementsTools: string;
  introduction: string;
  instructions: string;
  expectedResult: string;
  securityNotes: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seo: SeoFields;
  generationPlan: GenerationPlan;
  sourceMappings: SourceMapping[];
  internalLinks: InternalLinkSuggestion[];
  warnings: string[];
}

export type GeneratedDraft =
  | ArticleGeneratedDraft
  | TutorialGeneratedDraft
  | LabGeneratedDraft;

export interface GroundingAuditResult {
  passed: boolean;
  unsupportedClaims: string[];
  invalidSourceUrls: string[];
  invalidInternalLinks: string[];
  warnings: string[];
}

export interface DraftQualityAssessment {
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface OpenAiUsageMetadata {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface PersistedContentIntentProfile {
  areas: Array<{ id: string; label: string }>;
  topicAnchors: string[];
  topicPhrases: string[];
  audienceLabels: string[];
  expectsExplanation: boolean;
  expectsDefensiveGuidance: boolean;
}

export interface PersistedResearchSufficiencyAssessment {
  status: "sufficient" | "needs_more_research" | "blocked";
  score: number;
  reasons: string[];
  supportedIntentAreas: string[];
  missingIntentAreas: string[];
  verifiedClaimCount: number;
  authoritativeSourceCount: number;
  topicRelevantClaimCount: number;
}

export interface PersistedResearchPayload {
  keyFindings: string[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  discoveryContexts: DiscoveryContext[];
  relatedHCXContent: ContentSimilarityMatch[];
  researchConfidence: ResearchConfidence;
  researchQuality: ResearchQuality;
  canGenerateDraft: boolean;
  contentAwareness?: ContentAwarenessResult | null;
  categoryRecommendation?: string | null;
  categoryId?: string | null;
  difficulty?: string | null;
  contentIntentProfile?: PersistedContentIntentProfile | null;
  researchSufficiency?: PersistedResearchSufficiencyAssessment | null;
  researchImprovementCount?: number;
}

export interface GenerationMetadata {
  usage?: OpenAiUsageMetadata | null;
  quality?: DraftQualityAssessment | null;
  groundingAudit?: GroundingAuditResult | null;
  generatedAt?: string | null;
  sourceMappings?: SourceMapping[];
  internalLinks?: InternalLinkSuggestion[];
  generationWarnings?: string[];
}

export interface GenerateDraftResult {
  contentId: string;
  contentType: AgentContentType;
  editUrl: string;
  previewUrl: string | null;
  title: string;
  slug: string;
  factCheckStatus: AgentFactCheckStatus;
  qualityScore: number;
  warnings: string[];
  existingDraft: boolean;
}
