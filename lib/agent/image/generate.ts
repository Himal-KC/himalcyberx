import "server-only";

import { getOpenAiClient } from "@/lib/agent/openai/client";
import {
  HCX_IMAGE_MODEL,
  HCX_IMAGE_OUTPUT_FORMAT,
  HCX_IMAGE_QUALITY,
} from "@/lib/agent/openai/config";
import { resolveOpenAiImageSize } from "./image-core";

export interface OpenAiFeaturedImageResult {
  buffer: Buffer;
  model: string;
  nativeSize: string;
}

export async function generateFeaturedImageWithOpenAi(
  prompt: string,
): Promise<
  | { ok: true; result: OpenAiFeaturedImageResult }
  | { ok: false; message: string }
> {
  const model = HCX_IMAGE_MODEL;
  const size = resolveOpenAiImageSize(model);

  try {
    const client = getOpenAiClient();
    const response = await client.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality: HCX_IMAGE_QUALITY,
      output_format: HCX_IMAGE_OUTPUT_FORMAT,
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      return {
        ok: false,
        message: "Image model returned no image data.",
      };
    }

    return {
      ok: true,
      result: {
        buffer: Buffer.from(imageData, "base64"),
        model,
        nativeSize: size,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed.";
    return {
      ok: false,
      message,
    };
  }
}
