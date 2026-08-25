import { PlainTextContent } from "@/components/content/PlainTextContent";
import { RichContentView } from "@/components/content/RichContentView";
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

  if (!isRichHtmlContent(content)) {
    return (
      <PlainTextContent content={content} preserveLineBreaks={preserveLineBreaks} />
    );
  }

  const sanitized = sanitizeRichContentHtml(content);

  if (!sanitized.trim()) {
    return null;
  }

  return <RichContentView html={sanitized} />;
}
