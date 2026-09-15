import { canonicalizeRichContentForStorage } from "@/lib/content/canonical-html-core";

export function prepareRichContentForSave(content: string): string {
  return canonicalizeRichContentForStorage(content);
}

export function prepareAgentRichContentForSave(
  content: string,
  allowedSourceUrls: readonly string[],
): string {
  return canonicalizeRichContentForStorage(content, { allowedSourceUrls });
}
