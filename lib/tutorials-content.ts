import { tutorials as staticTutorials } from "@/lib/page-data";
import { TUTORIAL_CATEGORIES } from "@/lib/tutorials/constants";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";

export interface StaticTutorialItem {
  id: string;
  category: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
}

export interface TutorialCategorySection {
  category: string;
  dbTutorials: PublicTutorialCard[];
  staticTutorials: StaticTutorialItem[];
}

export function buildTutorialSections(
  dbTutorials: PublicTutorialCard[],
): TutorialCategorySection[] {
  const predefined = [...TUTORIAL_CATEGORIES];
  const extraCategories = [
    ...new Set(
      dbTutorials
        .map((tutorial) => tutorial.category)
        .filter(
          (category) =>
            category && !predefined.includes(category as (typeof predefined)[number]),
        ),
    ),
  ].sort();

  const allCategories = [...predefined, ...extraCategories];

  return allCategories
    .map((category) => {
      const categoryDbTutorials = dbTutorials.filter(
        (tutorial) => tutorial.category === category,
      );
      const categoryStatic =
        categoryDbTutorials.length === 0
          ? staticTutorials.filter((tutorial) => tutorial.category === category)
          : [];

      return {
        category,
        dbTutorials: categoryDbTutorials,
        staticTutorials: categoryStatic,
      };
    })
    .filter(
      (section) =>
        section.dbTutorials.length > 0 || section.staticTutorials.length > 0,
    );
}
