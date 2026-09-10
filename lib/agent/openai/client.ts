import "server-only";

import OpenAI from "openai";
import { getOpenAiApiKey } from "@/lib/agent/openai/env";

let client: OpenAI | null | undefined;

export function getOpenAiClient(): OpenAI {
  if (client) {
    return client;
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  client = new OpenAI({ apiKey });
  return client;
}

export function resetOpenAiClientForTests(): void {
  client = undefined;
}
