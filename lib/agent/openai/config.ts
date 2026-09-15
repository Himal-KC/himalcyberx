import "server-only";

import {
  TERRA_DRAFT_MAX_OUTPUT_TOKENS,
  TERRA_DRAFT_MODEL,
} from "@/lib/agent/generation/openai-request-core";

export { TERRA_DRAFT_MAX_OUTPUT_TOKENS, TERRA_DRAFT_MODEL };

export const HCX_DRAFT_MODEL =
  process.env.HCX_DRAFT_MODEL?.trim() || TERRA_DRAFT_MODEL;

export const HCX_REVIEW_MODEL =
  process.env.HCX_REVIEW_MODEL?.trim() || "gpt-5.6-sol";

export const HCX_REVIEW_MAX_OUTPUT_TOKENS = 12000;

export const HCX_GENERATION_MAX_OUTPUT_TOKENS = TERRA_DRAFT_MAX_OUTPUT_TOKENS;

export const HCX_MAX_INTERNAL_LINKS = 5;

export const HCX_MAX_SOURCE_MAPPINGS = 40;
