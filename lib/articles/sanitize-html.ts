import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "br",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

function hardenArticleLinks(): void {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") {
      return;
    }

    node.setAttribute("rel", "noopener noreferrer");

    const href = node.getAttribute("href");
    if (href && /^https?:\/\//i.test(href)) {
      node.setAttribute("target", "_blank");
    }
  });
}

export function sanitizeArticleHtml(html: string): string {
  hardenArticleLinks();

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  DOMPurify.removeHook("afterSanitizeAttributes");

  return sanitized;
}
