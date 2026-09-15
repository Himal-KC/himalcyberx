export const SOL_REVIEW_MODEL = "gpt-5.6-sol";

export const SOL_REVIEW_MAX_OUTPUT_TOKENS = 12000;

export const SOL_UNSUPPORTED_RESPONSE_REQUEST_PARAMS = [
  "temperature",
  "top_p",
  "frequency_penalty",
  "presence_penalty",
  "max_tokens",
  "max_completion_tokens",
  "response_format",
  "reasoning_effort",
  "reasoning",
  "tools",
  "tool_choice",
  "parallel_tool_calls",
  "store",
  "metadata",
] as const;

export interface SolReviewResponseRequest {
  model: string;
  max_output_tokens: number;
  instructions: string;
  input: Array<{
    role: "user";
    content: Array<{
      type: "input_text";
      text: string;
    }>;
  }>;
  text: {
    format: unknown;
  };
}

export interface BuildSolReviewResponseRequestInput<TTextFormat = unknown> {
  model?: string;
  instructions: string;
  userPromptText: string;
  textFormat: TTextFormat;
  maxOutputTokens?: number;
}

export function buildSolReviewResponseRequest<TTextFormat>(
  input: BuildSolReviewResponseRequestInput<TTextFormat>,
): Omit<SolReviewResponseRequest, "text"> & { text: { format: TTextFormat } } {
  return {
    model: input.model ?? SOL_REVIEW_MODEL,
    max_output_tokens: input.maxOutputTokens ?? SOL_REVIEW_MAX_OUTPUT_TOKENS,
    instructions: input.instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: input.userPromptText,
          },
        ],
      },
    ],
    text: {
      format: input.textFormat,
    },
  };
}

export function listUnsupportedSolResponseParams(
  request: Record<string, unknown>,
): string[] {
  return SOL_UNSUPPORTED_RESPONSE_REQUEST_PARAMS.filter(
    (param) => param in request,
  );
}
