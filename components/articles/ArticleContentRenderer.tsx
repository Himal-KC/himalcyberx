import { PlainTextArticleContent } from "@/components/articles/PlainTextArticleContent";
import { isArticleHtmlContent } from "@/lib/articles/content";
import { sanitizeArticleHtml } from "@/lib/articles/sanitize-html";

interface ArticleContentRendererProps {
  content: string;
}

export function ArticleContentRenderer({ content }: ArticleContentRendererProps) {
  if (!content.trim()) {
    return null;
  }

  if (!isArticleHtmlContent(content)) {
    return <PlainTextArticleContent content={content} />;
  }

  const sanitized = sanitizeArticleHtml(content);

  if (!sanitized.trim()) {
    return null;
  }

  return (
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
