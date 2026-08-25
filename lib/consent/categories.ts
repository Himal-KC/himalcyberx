import type { ConsentCategoryDefinition } from "@/lib/consent/types";

export const consentCategories: ConsentCategoryDefinition[] = [
  {
    id: "essential",
    label: "Essential",
    description:
      "Required for core site functionality such as page delivery and administrative access controls.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    description:
      "Optional Google Analytics (GA4) measurement to understand how public pages are used and improve content.",
    required: false,
  },
];
