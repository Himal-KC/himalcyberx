import sanitizeHtml from "sanitize-html";
import {
  HCX_ALLOWED_CODE_CLASSES,
  HCX_ALLOWED_SPAN_CLASSES,
} from "@/lib/editor/constants";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "span",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["class", "data-hcx-color", "data-hcx-variant", "data-hcx-font"],
    code: ["class"],
    pre: ["class", "data-language"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedClasses: {
    span: [...HCX_ALLOWED_SPAN_CLASSES],
    code: [...HCX_ALLOWED_CODE_CLASSES],
    pre: ["hcx-code-block"],
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

export function sanitizeRichContentHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export function sanitizeArticleHtml(html: string): string {
  return sanitizeRichContentHtml(html);
}
