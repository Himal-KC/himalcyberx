import { prepareRichContentForSave } from "@/lib/content/sanitize-on-save";
import type { LabFormInput } from "@/lib/labs/validation";
import type { LabInsert, LabStatus } from "@/lib/supabase/types";

export function buildLabInsertPayload({
  input,
  status,
  publishedAt,
}: {
  input: LabFormInput;
  status: LabStatus;
  publishedAt: string | null;
}): LabInsert {
  const payload: LabInsert = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    status,
    featured: input.featured,
    estimated_time: input.estimatedTime || null,
    learning_objectives: prepareRichContentForSave(input.learningObjectives) || null,
    requirements_tools: prepareRichContentForSave(input.requirementsTools) || null,
    introduction: prepareRichContentForSave(input.introduction) || null,
    instructions: prepareRichContentForSave(input.instructions) || null,
    expected_result: prepareRichContentForSave(input.expectedResult) || null,
    security_notes: prepareRichContentForSave(input.securityNotes) || null,
  };

  if (input.featured_image) {
    payload.featured_image = input.featured_image;
  }

  if (publishedAt) {
    payload.published_at = publishedAt;
  }

  return payload;
}

export function buildLabUpdatePayload({
  input,
  status,
  publishedAt,
}: {
  input: LabFormInput;
  status: LabStatus;
  publishedAt: string | null;
}) {
  return {
    ...buildLabInsertPayload({ input, status, publishedAt }),
    updated_at: new Date().toISOString(),
  };
}
