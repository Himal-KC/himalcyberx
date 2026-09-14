export const TERRA_DRAFT_MODEL = "gpt-5.6-terra";

export const TERRA_DRAFT_MAX_OUTPUT_TOKENS = 8000;

export const TERRA_UNSUPPORTED_RESPONSE_REQUEST_PARAMS = [
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

export type TerraContentType = "article" | "tutorial" | "lab";

export interface TerraDraftResponseRequest {
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

export interface BuildTerraDraftResponseRequestInput<TTextFormat = unknown> {
  model?: string;
  instructions: string;
  userPromptText: string;
  textFormat: TTextFormat;
  maxOutputTokens?: number;
}

export function buildTerraDraftUserPrompt(
  contentType: TerraContentType,
  serializedContext: string,
): string {
  return `Generate a grounded ${contentType} draft using this compact research context:\n\n${serializedContext}`;
}

export function buildTerraDraftResponseRequest<TTextFormat>(
  input: BuildTerraDraftResponseRequestInput<TTextFormat>,
): Omit<TerraDraftResponseRequest, "text"> & { text: { format: TTextFormat } } {
  return {
    model: input.model ?? TERRA_DRAFT_MODEL,
    max_output_tokens: input.maxOutputTokens ?? TERRA_DRAFT_MAX_OUTPUT_TOKENS,
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

export function listUnsupportedTerraResponseParams(
  request: Record<string, unknown>,
): string[] {
  return TERRA_UNSUPPORTED_RESPONSE_REQUEST_PARAMS.filter(
    (param) => param in request,
  );
}

export function terraRequestContainsSecrets(request: unknown): boolean {
  const serialized = JSON.stringify(request);

  return (
    /sk-[a-zA-Z0-9]{10,}/.test(serialized) ||
    /\bOPENAI_API_KEY\b/i.test(serialized) ||
    /\bBearer\s+[a-zA-Z0-9._-]{10,}\b/.test(serialized)
  );
}

export function getTerraStructuredOutputFormatName(
  textFormat: unknown,
): string | null {
  if (
    typeof textFormat === "object" &&
    textFormat !== null &&
    "name" in textFormat &&
    typeof textFormat.name === "string"
  ) {
    return textFormat.name;
  }

  return null;
}
