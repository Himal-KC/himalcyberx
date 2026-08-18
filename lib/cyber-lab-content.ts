import { cyberLabModules } from "@/lib/sample-data";
import { LAB_CATEGORIES } from "@/lib/labs/constants";
import type { PublicLabCard } from "@/lib/supabase/public-labs";

export type StaticLabModule = (typeof cyberLabModules)[number];

export interface CyberLabCategorySection {
  category: string;
  dbLabs: PublicLabCard[];
  staticModules: StaticLabModule[];
}

export function buildCyberLabSections(
  dbLabs: PublicLabCard[],
): CyberLabCategorySection[] {
  return LAB_CATEGORIES.map((category) => {
    const categoryDbLabs = dbLabs.filter((lab) => lab.category === category);
    const staticModules =
      categoryDbLabs.length === 0
        ? cyberLabModules.filter((module) => module.category === category)
        : [];

    return {
      category,
      dbLabs: categoryDbLabs,
      staticModules,
    };
  }).filter(
    (section) =>
      section.dbLabs.length > 0 || section.staticModules.length > 0,
  );
}
