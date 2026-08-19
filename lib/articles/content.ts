const HTML_CONTENT_PATTERN =
  /^<(p|h[1-6]|ul|ol|blockquote|pre|div|strong|em|code)\b/i;

export function isArticleHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  return HTML_CONTENT_PATTERN.test(trimmed);
}

export function escapeArticleHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextToEditorHtml(content: string): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "";
  }

  return paragraphs
    .map((paragraph) => {
      const withLineBreaks = escapeArticleHtml(paragraph).replace(/\n/g, "<br>");
      return `<p>${withLineBreaks}</p>`;
    })
    .join("");
}

export function getInitialEditorContent(content: string): string {
  if (!content.trim()) {
    return "";
  }

  if (isArticleHtmlContent(content)) {
    return content;
  }

  return plainTextToEditorHtml(content);
}

export function stripArticleHtml(content: string): string {
  return content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function getArticleContentTextLength(content: string): number {
  return stripArticleHtml(content).length;
}
