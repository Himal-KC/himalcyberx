const HTML_CONTENT_PATTERN =
  /^<(p|h[1-6]|ul|ol|blockquote|pre|div|table|hr|span|strong|em|code)\b/i;

export function isRichHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  return HTML_CONTENT_PATTERN.test(trimmed);
}

export function isArticleHtmlContent(content: string): boolean {
  return isRichHtmlContent(content);
}

export function escapeRichHtml(text: string): string {
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
      const withLineBreaks = escapeRichHtml(paragraph).replace(/\n/g, "<br>");
      return `<p>${withLineBreaks}</p>`;
    })
    .join("");
}

export function getInitialEditorContent(content: string): string {
  if (!content.trim()) {
    return "";
  }

  if (isRichHtmlContent(content)) {
    return content;
  }

  return plainTextToEditorHtml(content);
}

export function stripRichHtml(content: string): string {
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

export function stripArticleHtml(content: string): string {
  return stripRichHtml(content);
}

export function getRichContentTextLength(content: string): number {
  return stripRichHtml(content).length;
}

export function getArticleContentTextLength(content: string): number {
  return getRichContentTextLength(content);
}

/** @deprecated Use escapeRichHtml */
export const escapeArticleHtml = escapeRichHtml;
