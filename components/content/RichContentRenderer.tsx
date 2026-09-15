import { PlainTextContent } from "@/components/content/PlainTextContent";
import { RichContentView } from "@/components/content/RichContentView";
import { canonicalizeRichContentForStorage } from "@/lib/content/canonical-html-core";
import { isRichHtmlContent } from "@/lib/content/html";
import { sanitizeRichContentHtml } from "@/lib/content/sanitize-html";

interface RichContentRendererProps {
  content: string;
  preserveLineBreaks?: boolean;
}

export function RichContentRenderer({
  content,
  preserveLineBreaks = false,
}: RichContentRendererProps) {
  if (!content.trim()) {
    return null;
  }

  const canonical = canonicalizeRichContentForStorage(content);

  if (!isRichHtmlContent(canonical)) {
    return (
      <PlainTextContent content={canonical} preserveLineBreaks={preserveLineBreaks} />
    );
  }

  const sanitized = sanitizeRichContentHtml(canonical);

  if (!sanitized.trim()) {
    return null;
  }

  return <RichContentView html={sanitized} />;
}
