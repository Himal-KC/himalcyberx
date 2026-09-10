import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import {
  HCX_DRAFT_MODEL,
  HCX_GENERATION_MAX_OUTPUT_TOKENS,
  HCX_GENERATION_TEMPERATURE,
} from "@/lib/agent/openai/config";
import { getOpenAiClient } from "@/lib/agent/openai/client";
import {
  buildDeveloperInstructions,
} from "@/lib/agent/generation/grounding-policy";
import {
  serializeContextForPrompt,
  type GroundedGenerationContext,
} from "@/lib/agent/generation/build-context";
import { generatedDraftSchema } from "@/lib/agent/generation/schemas";
import type {
  GeneratedDraft,
  OpenAiUsageMetadata,
} from "@/lib/agent/generation/types";

export interface GenerateDraftWithOpenAiResult {
  draft: GeneratedDraft | null;
  usage: OpenAiUsageMetadata | null;
  error: string | null;
}

export type OpenAiGenerateFn = (
  context: GroundedGenerationContext,
) => Promise<GenerateDraftWithOpenAiResult>;

export async function generateDraftWithOpenAi(
  context: GroundedGenerationContext,
): Promise<GenerateDraftWithOpenAiResult> {
  try {
    const client = getOpenAiClient();
    const response = await client.responses.parse({
      model: HCX_DRAFT_MODEL,
      temperature: HCX_GENERATION_TEMPERATURE,
      max_output_tokens: HCX_GENERATION_MAX_OUTPUT_TOKENS,
      instructions: buildDeveloperInstructions(context.contentType),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Generate a grounded ${context.contentType} draft using this compact research context:\n\n${serializeContextForPrompt(context)}`,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(generatedDraftSchema, "hcx_generated_draft"),
      },
    });

    const draft = (response.output_parsed ?? null) as GeneratedDraft | null;
    const usage: OpenAiUsageMetadata = {
      model: response.model ?? HCX_DRAFT_MODEL,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      totalTokens: response.usage?.total_tokens ?? null,
    };

    if (!draft) {
      return {
        draft: null,
        usage,
        error: "Generated output failed validation.",
      };
    }

    if (draft.contentType !== context.contentType) {
      return {
        draft: null,
        usage,
        error: "Generated output did not match the requested content type.",
      };
    }

    return { draft, usage, error: null };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "OPENAI_NOT_CONFIGURED"
        ? "OpenAI is not configured."
        : "Generation is temporarily unavailable.";

    return {
      draft: null,
      usage: null,
      error: message,
    };
  }
}
