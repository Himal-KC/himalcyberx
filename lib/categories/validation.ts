import { isValidSlug, slugifyTitle } from "@/lib/articles/validation";

export { slugifyTitle as slugifyCategoryName };

export interface CategoryFormInput {
  name: string;
  slug: string;
  description: string;
}

export function parseCategoryFormData(formData: FormData): CategoryFormInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

export function validateCategoryInput(
  input: CategoryFormInput,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (input.name.length < 2) {
    fieldErrors.name = "Category name must be at least 2 characters.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug is required.";
  } else if (!isValidSlug(input.slug)) {
    fieldErrors.slug =
      "Slug must be lowercase, use hyphens, and contain only letters and numbers.";
  }

  if (input.description.length > 500) {
    fieldErrors.description = "Description must be 500 characters or fewer.";
  }

  return fieldErrors;
}
