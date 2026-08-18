import { slugifyTitle } from "@/lib/articles/validation";
import {
  TUTORIAL_DIFFICULTIES,
  TUTORIAL_STATUSES,
} from "@/lib/tutorials/constants";
import type { TutorialDifficulty, TutorialStatus } from "@/lib/supabase/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export { slugifyTitle };

export function isValidTutorialSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export interface TutorialFormInput {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: TutorialDifficulty;
  estimatedTime: string;
  requirements: string;
  introduction: string;
  instructions: string;
  keyTakeaways: string;
  securityNotes: string;
  status: TutorialStatus;
  featured: boolean;
  featured_image: string;
}

export interface TutorialValidationResult {
  fieldErrors: Record<string, string>;
  values: TutorialFormInput;
}

export function parseTutorialFormData(formData: FormData): TutorialFormInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    difficulty: String(
      formData.get("difficulty") ?? "Beginner",
    ).trim() as TutorialDifficulty,
    estimatedTime: String(formData.get("estimated_time") ?? "").trim(),
    requirements: String(formData.get("requirements") ?? "").trim(),
    introduction: String(formData.get("introduction") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    keyTakeaways: String(formData.get("key_takeaways") ?? "").trim(),
    securityNotes: String(formData.get("security_notes") ?? "").trim(),
    status: String(formData.get("status") ?? "draft").trim() as TutorialStatus,
    featured: formData.get("featured") === "on",
    featured_image: String(formData.get("featured_image") ?? "").trim(),
  };
}

export function validateTutorialInput(
  input: TutorialFormInput,
): TutorialValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (input.title.length < 8) {
    fieldErrors.title = "Tutorial title must be at least 8 characters.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug is required.";
  } else if (!isValidTutorialSlug(input.slug)) {
    fieldErrors.slug =
      "Slug must be lowercase, use hyphens, and contain only letters and numbers.";
  }

  if (input.description.length < 20) {
    fieldErrors.description = "Short description must be at least 20 characters.";
  }

  if (!TUTORIAL_DIFFICULTIES.includes(input.difficulty)) {
    fieldErrors.difficulty =
      "Difficulty must be Beginner, Intermediate, or Advanced.";
  }

  if (!TUTORIAL_STATUSES.includes(input.status)) {
    fieldErrors.status = "Status must be draft or published.";
  }

  if (input.status === "published") {
    if (!input.category) {
      fieldErrors.category = "Category is required when publishing.";
    }
    if (!input.estimatedTime) {
      fieldErrors.estimated_time = "Estimated time is required when publishing.";
    }
    if (input.introduction.length < 50) {
      fieldErrors.introduction =
        "Introduction must be at least 50 characters when publishing.";
    }
    if (input.instructions.length < 100) {
      fieldErrors.instructions =
        "Step-by-step instructions must be at least 100 characters when publishing.";
    }
  }

  if (
    input.featured_image &&
    !/^https?:\/\/.+/i.test(input.featured_image)
  ) {
    fieldErrors.featured_image = "Featured image URL must be a valid URL.";
  }

  return { fieldErrors, values: input };
}

export function resolveTutorialSubmitStatus(
  formData: FormData,
  input: TutorialFormInput,
): TutorialStatus {
  const intent = String(formData.get("intent") ?? "");

  if (intent === "draft") {
    return "draft";
  }

  if (intent === "publish") {
    return "published";
  }

  return input.status;
}

export function resolveTutorialPublishedAt(
  status: TutorialStatus,
  existingPublishedAt?: string | null,
): string | null {
  if (status === "draft") {
    return existingPublishedAt ?? null;
  }

  if (existingPublishedAt) {
    return existingPublishedAt;
  }

  return new Date().toISOString();
}
