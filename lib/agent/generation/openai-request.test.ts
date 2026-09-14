import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { zodTextFormat } from "openai/helpers/zod";

const testDir = dirname(fileURLToPath(import.meta.url));

const openAiRequest = (await import(
  pathToFileURL(join(testDir, "openai-request-core.ts")).href
)) as typeof import("./openai-request-core");
const schemas = (await import(
  pathToFileURL(join(testDir, "schemas.ts")).href
)) as typeof import("./schemas");

const INSTRUCTIONS = "Grounded draft instructions.";
const USER_PROMPT = "Generate a grounded article draft using this compact research context:\n\n{}";

function buildRequest(contentType: "article" | "tutorial" | "lab") {
  const schema = schemas.getContentTypeDraftSchema(contentType);
  const textFormat = zodTextFormat(
    schema,
    schemas.getOpenAiDraftFormatName(contentType),
  );

  return openAiRequest.buildTerraDraftResponseRequest({
    instructions: INSTRUCTIONS,
    userPromptText: USER_PROMPT,
    textFormat,
  });
}

describe("Phase 4 Terra Responses request construction", () => {
  it("uses model gpt-5.6-terra", () => {
    const request = buildRequest("article");
    assert.equal(request.model, "gpt-5.6-terra");
  });

  it("does not contain temperature", () => {
    const request = buildRequest("article");
    assert.equal("temperature" in request, false);
  });

  it("does not contain unsupported sampling or tool parameters", () => {
    const request = buildRequest("article");
    assert.deepEqual(
      openAiRequest.listUnsupportedTerraResponseParams(
        request as unknown as Record<string, unknown>,
      ),
      [],
    );
  });

  it("uses Responses API structured output via text.format", () => {
    const request = buildRequest("article");
    const format = request.text.format as {
      type?: string;
      name?: string;
      strict?: boolean;
    };

    assert.equal(format.type, "json_schema");
    assert.equal(format.strict, true);
    assert.equal(format.name, "hcx_article_draft");
  });

  it("uses article object schema for article", () => {
    const request = buildRequest("article");
    const format = request.text.format as { name?: string; schema?: { type?: string } };

    assert.equal(format.name, "hcx_article_draft");
    assert.equal(format.schema?.type, "object");
    assert.equal(
      schemas.isRootObjectZodSchema(schemas.getContentTypeDraftSchema("article")),
      true,
    );
  });

  it("uses tutorial object schema for tutorial", () => {
    const request = buildRequest("tutorial");
    const format = request.text.format as { name?: string; schema?: { type?: string } };

    assert.equal(format.name, "hcx_tutorial_draft");
    assert.equal(format.schema?.type, "object");
  });

  it("uses lab object schema for lab", () => {
    const request = buildRequest("lab");
    const format = request.text.format as { name?: string; schema?: { type?: string } };

    assert.equal(format.name, "hcx_lab_draft");
    assert.equal(format.schema?.type, "object");
  });

  it("includes configured output token limit using max_output_tokens", () => {
    const request = buildRequest("article");
    assert.equal(request.max_output_tokens, openAiRequest.TERRA_DRAFT_MAX_OUTPUT_TOKENS);
  });

  it("does not enable web search or other tools", () => {
    const request = buildRequest("article") as unknown as Record<string, unknown>;
    assert.equal("tools" in request, false);
    assert.equal("tool_choice" in request, false);
    assert.equal("parallel_tool_calls" in request, false);
  });

  it("contains no secrets", () => {
    const request = buildRequest("article");
    assert.equal(openAiRequest.terraRequestContainsSecrets(request), false);
  });
});
