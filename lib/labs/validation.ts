import { slugifyTitle } from "@/lib/articles/validation";
import { getRichContentTextLength } from "@/lib/content/html";
import {
  LAB_DIFFICULTIES,
  LAB_STATUSES,
} from "@/lib/labs/constants";
import type { LabDifficulty, LabStatus } from "@/lib/supabase/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export { slugifyTitle };

export function isValidLabSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export interface LabFormInput {
  title: string;
  slug: string;
  description: string;
  difficulty: LabDifficulty;
  category: string;
  estimatedTime: string;
  learningObjectives: string;
  requirementsTools: string;
  introduction: string;
  instructions: string;
  expectedResult: string;
  securityNotes: string;
  status: LabStatus;
  featured: boolean;
  featured_image: string;
}

export interface LabValidationResult {
  fieldErrors: Record<string, string>;
  values: LabFormInput;
}

export function parseLabFormData(formData: FormData): LabFormInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
    difficulty: String(
      formData.get("difficulty") ?? "Beginner",
    ).trim() as LabDifficulty,
    category: String(formData.get("category") ?? "").trim(),
    estimatedTime: String(formData.get("estimated_time") ?? "").trim(),
    learningObjectives: String(formData.get("learning_objectives") ?? "").trim(),
    requirementsTools: String(formData.get("requirements_tools") ?? "").trim(),
    introduction: String(formData.get("introduction") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    expectedResult: String(formData.get("expected_result") ?? "").trim(),
    securityNotes: String(formData.get("security_notes") ?? "").trim(),
    status: String(formData.get("status") ?? "draft").trim() as LabStatus,
    featured: formData.get("featured") === "on",
    featured_image: String(formData.get("featured_image") ?? "").trim(),
  };
}

export function validateLabInput(
  input: LabFormInput,
): LabValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (input.title.length < 8) {
    fieldErrors.title = "Lab title must be at least 8 characters.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug is required.";
  } else if (!isValidLabSlug(input.slug)) {
    fieldErrors.slug =
      "Slug must be lowercase, use hyphens, and contain only letters and numbers.";
  }

  if (input.description.length < 20) {
    fieldErrors.description = "Short description must be at least 20 characters.";
  }

  if (!LAB_DIFFICULTIES.includes(input.difficulty)) {
    fieldErrors.difficulty = "Difficulty must be Beginner, Intermediate, or Advanced.";
  }

  if (!LAB_STATUSES.includes(input.status)) {
    fieldErrors.status = "Status must be draft or published.";
  }

  if (input.status === "published") {
    if (!input.category) {
      fieldErrors.category = "Category is required when publishing.";
    }
    if (!input.estimatedTime) {
      fieldErrors.estimated_time = "Estimated time is required when publishing.";
    }
    if (getRichContentTextLength(input.introduction) < 50) {
      fieldErrors.introduction =
        "Lab introduction must be at least 50 characters when publishing.";
    }
    if (getRichContentTextLength(input.instructions) < 100) {
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

export function resolveLabSubmitStatus(
  formData: FormData,
  input: LabFormInput,
): LabStatus {
  const intent = String(formData.get("intent") ?? "");

  if (intent === "draft") {
    return "draft";
  }

  if (intent === "publish") {
    return "published";
  }

  return input.status;
}

export function resolveLabPublishedAt(
  status: LabStatus,
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
