import "server-only";

export function hasTavilyApiKey(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export function getTavilyApiKey(): string | null {
  const key = process.env.TAVILY_API_KEY?.trim();
  return key || null;
}

export function hasNvdApiKey(): boolean {
  return Boolean(process.env.NVD_API_KEY?.trim());
}

export function getNvdApiKey(): string | null {
  const key = process.env.NVD_API_KEY?.trim();
  return key || null;
}
