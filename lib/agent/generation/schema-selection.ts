import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import type { AgentContentType } from "@/lib/supabase/types";
import {
  getContentTypeDraftSchema,
  getOpenAiDraftFormatName,
  getZodSchemaRootType,
  isDiscriminatedUnionZodSchema,
  isRootObjectZodSchema,
  OPENAI_DRAFT_FORMAT_NAMES,
  parseArticleDraftOutput,
  parseContentTypeDraftOutput,
  parseLabDraftOutput,
  parseTutorialDraftOutput,
} from "@/lib/agent/generation/schemas";

export {
  getContentTypeDraftSchema,
  getOpenAiDraftFormatName,
  getZodSchemaRootType,
  isDiscriminatedUnionZodSchema,
  isRootObjectZodSchema,
  OPENAI_DRAFT_FORMAT_NAMES,
  parseArticleDraftOutput,
  parseContentTypeDraftOutput,
  parseLabDraftOutput,
  parseTutorialDraftOutput,
};

export function createOpenAiDraftTextFormat(contentType: AgentContentType) {
  const schema = getContentTypeDraftSchema(contentType);
  return zodTextFormat(schema, getOpenAiDraftFormatName(contentType));
}
