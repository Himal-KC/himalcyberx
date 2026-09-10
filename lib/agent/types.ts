import type {
  AgentContentType,
  AgentFactCheckStatus,
  AgentRunStage,
  AgentSourceType,
  ArticleStatus,
  LabDifficulty,
  LabStatus,
  TutorialDifficulty,
  TutorialStatus,
} from "@/lib/supabase/types";

export type AgentPublishMode = "draft" | "publish";

export interface AgentTopicInput {
  contentType: AgentContentType;
  topic: string;
  categoryId?: string | null;
  difficulty?: TutorialDifficulty | LabDifficulty | null;
  publishMode?: AgentPublishMode | null;
  notes?: string | null;
}

export interface ResearchSource {
  title: string;
  url: string;
  publisher?: string | null;
  sourceType?: AgentSourceType;
  publishedAt?: string | null;
  /** Raw discovery excerpt from search — not a verified claim. */
  discoveryContext?: string | null;
  /** Claim statements this source supports (populated after extraction). */
  supportsClaims?: string[] | null;
  sortOrder?: number;
}

export interface DiscoveryContext {
  url: string;
  title: string;
  publisher?: string | null;
  excerpt?: string | null;
}

export type ResearchQuality = "passed" | "needs_review" | "failed";

export type ResearchConfidence = "high" | "medium" | "low";

export interface ClaimSourceRef {
  url: string;
  title: string;
  publisher?: string | null;
}

export type VerifiedClaimType =
  | "cve_id"
  | "affected_product"
  | "affected_versions"
  | "cvss"
  | "exploitation_status"
  | "disclosure_date"
  | "mitigation"
  | "patch_information"
  | "threat_actor_attribution"
  | "techniques"
  | "indicators"
  | "guidance"
  | "general";

export type VerifiedClaimConfidence = "high" | "medium";

export interface VerifiedClaim {
  id: string;
  type: VerifiedClaimType;
  statement: string;
  sources: ClaimSourceRef[];
  confidence: VerifiedClaimConfidence;
}

export interface UncertainClaim {
  id: string;
  label: string;
  reason: string;
  partialValue?: string | null;
  sources?: ClaimSourceRef[];
}

export interface ResearchResult {
  agentRunId: string;
  topic: string;
  contentType: AgentContentType;
  summary: string;
  recommendedAngle: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  keyFindings: string[];
  verifiedClaims: VerifiedClaim[];
  uncertainClaims: UncertainClaim[];
  discoveryContexts: DiscoveryContext[];
  sources: ResearchSource[];
  relatedHCXContent: ContentSimilarityMatch[];
  researchConfidence: ResearchConfidence;
  researchQuality: ResearchQuality;
}

export interface ArticlePlan {
  title: string;
  angle: string;
  outline: string[];
  targetAudience?: string | null;
}

/** HTML content compatible with the existing TipTap / articles.content storage model. */
export interface GeneratedArticle {
  contentType: "article";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId?: string | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

/** Matches TutorialFormInput / tutorials table fields. */
export interface GeneratedTutorial {
  contentType: "tutorial";
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: TutorialDifficulty;
  estimatedTime?: string | null;
  requirements?: string | null;
  introduction?: string | null;
  instructions?: string | null;
  keyTakeaways?: string | null;
  securityNotes?: string | null;
  featured?: boolean;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

/** Matches LabFormInput / labs table fields. */
export interface GeneratedLab {
  contentType: "lab";
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  estimatedTime?: string | null;
  learningObjectives?: string | null;
  requirementsTools?: string | null;
  introduction?: string | null;
  instructions?: string | null;
  expectedResult?: string | null;
  securityNotes?: string | null;
  featured?: boolean;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

export type GeneratedContent =
  | GeneratedArticle
  | GeneratedTutorial
  | GeneratedLab;

export interface SeoResult {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seoKeywords?: string[] | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  featuredImageAlt?: string | null;
}

export interface FactCheckResult {
  status: AgentFactCheckStatus;
  verifiedClaims: string[];
  failedClaims: string[];
  needsReviewClaims: string[];
  notes?: string | null;
  verifiedAt?: string | null;
}

export interface QualityResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  readyToPublish: boolean;
}

export interface ImageResult {
  publicUrl: string;
  storagePath: string;
  altText: string;
  filename?: string | null;
  fileSize?: number | null;
}

export interface ArticleInventoryItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string | null;
  categoryName: string | null;
  status: ArticleStatus;
  content: string | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
}

export interface TutorialInventoryItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: TutorialDifficulty;
  status: TutorialStatus;
  requirements: string | null;
  introduction: string | null;
  instructions: string | null;
  keyTakeaways: string | null;
  securityNotes: string | null;
  publishedAt: string | null;
}

export interface LabInventoryItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  status: LabStatus;
  learningObjectives: string | null;
  requirementsTools: string | null;
  introduction: string | null;
  instructions: string | null;
  expectedResult: string | null;
  securityNotes: string | null;
  publishedAt: string | null;
}

export interface CategoryInventoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface SiteContentInventory {
  articles: ArticleInventoryItem[];
  tutorials: TutorialInventoryItem[];
  labs: LabInventoryItem[];
  categories: CategoryInventoryItem[];
}

export interface ContentSimilarityMatch {
  contentType: AgentContentType;
  id: string;
  title: string;
  slug: string;
  similarityScore: number;
  reason: string;
}

export type ContentDuplicateRisk = "low" | "medium" | "high";

export interface RecommendedCategory {
  /** Populated for articles when a categories.id match exists. */
  id: string | null;
  /** Category display name, or tutorial/lab category text when no FK exists. */
  name: string;
}

export interface ContentAwarenessResult {
  duplicateRisk: ContentDuplicateRisk;
  similarContent: ContentSimilarityMatch[];
  recommendedCategory: RecommendedCategory;
  relatedContent: ContentSimilarityMatch[];
  contentGapSummary: string | null;
}

export interface AgentPipelineResultBase {
  runId: string;
  contentType: AgentContentType;
  topic: string;
  stage: AgentRunStage;
  status: "ready" | "failed" | "completed";
  research?: ResearchResult | null;
  plan?: ArticlePlan | null;
  seo?: SeoResult | null;
  factCheck?: FactCheckResult | null;
  quality?: QualityResult | null;
  image?: ImageResult | null;
  contentAwareness?: ContentAwarenessResult | null;
  errorMessage?: string | null;
}

export type AgentPipelineResult =
  | (AgentPipelineResultBase & {
      contentType: "article";
      generatedContent?: GeneratedArticle | null;
      contentId?: string | null;
    })
  | (AgentPipelineResultBase & {
      contentType: "tutorial";
      generatedContent?: GeneratedTutorial | null;
      contentId?: string | null;
    })
  | (AgentPipelineResultBase & {
      contentType: "lab";
      generatedContent?: GeneratedLab | null;
      contentId?: string | null;
    });
