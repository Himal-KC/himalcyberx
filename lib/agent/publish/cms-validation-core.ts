import { validateArticleInput } from "@/lib/articles/validation";
import { validateLabInput } from "@/lib/labs/validation";
import { validateTutorialInput } from "@/lib/tutorials/validation";
import type {
  PublishArticleSnapshot,
  PublishContentRowSnapshot,
  PublishLabSnapshot,
  PublishTutorialSnapshot,
} from "./eligibility-core";

export function validatePublishCmsState(input: {
  content: PublishContentRowSnapshot;
  categoriesAvailable: boolean;
}): { valid: true } | { valid: false; message: string } {
  if (input.content.contentType === "article") {
    const content = input.content as PublishArticleSnapshot;
    const validation = validateArticleInput(
      {
        title: content.title,
        slug: content.slug,
        excerpt: content.excerpt,
        content: content.content,
        author: content.author ?? "",
        categoryId: content.categoryId ?? "",
        status: "published",
        featured: false,
        featured_image: content.featuredImage ?? "",
        featured_image_alt: content.featuredImageAlt ?? "",
        seo_title: content.seoTitle ?? "",
        seo_description: content.seoDescription ?? "",
        og_title: content.ogTitle ?? "",
        og_description: content.ogDescription ?? "",
        publishedAt: "",
      },
      { requireCategory: input.categoriesAvailable },
    );

    if (Object.keys(validation.fieldErrors).length > 0) {
      return {
        valid: false,
        message:
          Object.values(validation.fieldErrors)[0] ??
          "Article content failed CMS publish validation.",
      };
    }

    return { valid: true };
  }

  if (input.content.contentType === "tutorial") {
    const content = input.content as PublishTutorialSnapshot;
    const validation = validateTutorialInput({
      title: content.title,
      slug: content.slug,
      description: content.description,
      category: content.category ?? "",
      difficulty: content.difficulty as "Beginner" | "Intermediate" | "Advanced",
      estimatedTime: content.estimatedTime ?? "",
      requirements: content.requirements ?? "",
      introduction: content.introduction,
      instructions: content.instructions,
      keyTakeaways: content.keyTakeaways ?? "",
      securityNotes: content.securityNotes ?? "",
      status: "published",
      featured: false,
      featured_image: content.featuredImage ?? "",
    });

    if (Object.keys(validation.fieldErrors).length > 0) {
      return {
        valid: false,
        message:
          Object.values(validation.fieldErrors)[0] ??
          "Tutorial content failed CMS publish validation.",
      };
    }

    return { valid: true };
  }

  const content = input.content as PublishLabSnapshot;
  const validation = validateLabInput({
    title: content.title,
    slug: content.slug,
    description: content.description,
    category: content.category ?? "",
    difficulty: content.difficulty as "Beginner" | "Intermediate" | "Advanced",
    estimatedTime: content.estimatedTime ?? "",
    learningObjectives: content.learningObjectives ?? "",
    requirementsTools: content.requirementsTools ?? "",
    introduction: content.introduction,
    instructions: content.instructions,
    expectedResult: content.expectedResult ?? "",
    securityNotes: content.securityNotes ?? "",
    status: "published",
    featured: false,
    featured_image: content.featuredImage ?? "",
  });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      valid: false,
      message:
        Object.values(validation.fieldErrors)[0] ??
        "Cyber Lab content failed CMS publish validation.",
    };
  }

  return { valid: true };
}
