import "server-only";

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}
