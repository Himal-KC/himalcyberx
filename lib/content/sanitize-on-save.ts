import { isRichHtmlContent } from "@/lib/content/html";
import { sanitizeRichContentHtml } from "@/lib/content/sanitize-html";

export function prepareRichContentForSave(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  if (isRichHtmlContent(trimmed)) {
    return sanitizeRichContentHtml(trimmed);
  }

  return trimmed;
}
