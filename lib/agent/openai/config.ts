import "server-only";

export const HCX_DRAFT_MODEL =
  process.env.HCX_DRAFT_MODEL?.trim() || "gpt-5.6-terra";

export const HCX_REVIEW_MODEL =
  process.env.HCX_REVIEW_MODEL?.trim() || "gpt-5.6-sol";

export const HCX_GENERATION_MAX_OUTPUT_TOKENS = 8000;

export const HCX_GENERATION_TEMPERATURE = 0.4;

export const HCX_MAX_INTERNAL_LINKS = 5;

export const HCX_MAX_SOURCE_MAPPINGS = 40;
