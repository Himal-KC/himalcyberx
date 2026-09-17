import "server-only";

import { HCX_DRAFT_MODEL } from "@/lib/agent/openai/config";
import { getOpenAiClient } from "@/lib/agent/openai/client";
import {
  extractSafeOpenAiDiagnostics,
  logOpenAiGenerationFailure,
} from "@/lib/agent/openai/log-generation-error";
import { buildTerraDraftResponseRequest } from "@/lib/agent/generation/openai-request-core";
import {
  createOpenAiDraftTextFormat,
  parseContentTypeDraftOutput,
} from "@/lib/agent/generation/schema-selection";
import type { GeneratedDraft } from "@/lib/agent/generation/types";
import type { RevisionPlan } from "@/lib/agent/review/automatic-revision-core";
import {
  REVISION_SYSTEM_INSTRUCTIONS,
  buildRevisionUserPrompt,
} from "@/lib/agent/review/revision-prompt-core";
import type { ReviewContextPayload } from "@/lib/agent/review/types";
import type { VerifiedClaim } from "@/lib/agent/types";

export interface ReviseDraftWithOpenAiResult {
  draft: GeneratedDraft | null;
  model: string;
  error: string | null;
}

export async function reviseDraftWithOpenAi(input: {
  context: ReviewContextPayload;
  plan: RevisionPlan;
  verifiedClaims: VerifiedClaim[];
}): Promise<ReviseDraftWithOpenAiResult> {
  try {
    const client = getOpenAiClient();
    const textFormat = createOpenAiDraftTextFormat(input.context.contentType);
    const request = buildTerraDraftResponseRequest({
      model: HCX_DRAFT_MODEL,
      instructions: REVISION_SYSTEM_INSTRUCTIONS,
      userPromptText: buildRevisionUserPrompt(input),
      textFormat,
      maxOutputTokens: 8000,
    });
    const response = await client.responses.parse(request);
    const draft = parseContentTypeDraftOutput(
      input.context.contentType,
      response.output_parsed ?? null,
    );

    if (!draft) {
      return {
        draft: null,
        model: response.model ?? HCX_DRAFT_MODEL,
        error: "Revision output failed validation.",
      };
    }

    return {
      draft: draft as GeneratedDraft,
      model: response.model ?? HCX_DRAFT_MODEL,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_NOT_CONFIGURED") {
      return {
        draft: null,
        model: HCX_DRAFT_MODEL,
        error: "OpenAI is not configured.",
      };
    }

    const diagnostics = extractSafeOpenAiDiagnostics(error, {
      stage: "responses_parse",
      model: HCX_DRAFT_MODEL,
      contentType: input.context.contentType,
    });
    logOpenAiGenerationFailure(diagnostics);

    return {
      draft: null,
      model: HCX_DRAFT_MODEL,
      error: "Revision request failed.",
    };
  }
}
