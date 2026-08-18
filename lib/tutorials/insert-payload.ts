import type { TutorialFormInput } from "@/lib/tutorials/validation";
import type { TutorialInsert, TutorialStatus } from "@/lib/supabase/types";

export function buildTutorialInsertPayload({
  input,
  status,
  publishedAt,
}: {
  input: TutorialFormInput;
  status: TutorialStatus;
  publishedAt: string | null;
}): TutorialInsert {
  const payload: TutorialInsert = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    status,
    featured: input.featured,
    estimated_time: input.estimatedTime || null,
    requirements: input.requirements || null,
    introduction: input.introduction || null,
    instructions: input.instructions || null,
    key_takeaways: input.keyTakeaways || null,
    security_notes: input.securityNotes || null,
  };

  if (input.featured_image) {
    payload.featured_image = input.featured_image;
  }

  if (publishedAt) {
    payload.published_at = publishedAt;
  }

  return payload;
}

export function buildTutorialUpdatePayload({
  input,
  status,
  publishedAt,
}: {
  input: TutorialFormInput;
  status: TutorialStatus;
  publishedAt: string | null;
}) {
  return {
    ...buildTutorialInsertPayload({ input, status, publishedAt }),
    updated_at: new Date().toISOString(),
  };
}
