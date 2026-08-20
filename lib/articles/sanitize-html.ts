import sanitizeHtml from "sanitize-html";

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

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto"],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attribs) => {
      const href = attribs.href ?? "";
      const nextAttribs: Record<string, string> = {
        rel: "noopener noreferrer",
      };

      if (href) {
        nextAttribs.href = href;
      }

      if (/^https?:\/\//i.test(href)) {
        nextAttribs.target = "_blank";
      }

      return {
        tagName: "a",
        attribs: nextAttribs,
      };
    },
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
