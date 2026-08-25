export interface ConsentPreferences {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

export type ConsentCategoryId = "essential" | "analytics";

export interface ConsentCategoryDefinition {
  id: ConsentCategoryId;
  label: string;
  description: string;
  required: boolean;
}
