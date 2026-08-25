import { Mark, mergeAttributes } from "@tiptap/core";

export const HcxTextColor = Mark.create({
  name: "hcxTextColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-hcx-color"),
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }

          return {
            "data-hcx-color": attributes.color,
            class: `hcx-text-${attributes.color}`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-hcx-color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export const HcxTextVariant = Mark.create({
  name: "hcxTextVariant",
  addAttributes() {
    return {
      variant: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-hcx-variant"),
        renderHTML: (attributes) => {
          if (!attributes.variant) {
            return {};
          }

          return {
            "data-hcx-variant": attributes.variant,
            class: `hcx-text-${attributes.variant}`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-hcx-variant]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export const HcxFontFamily = Mark.create({
  name: "hcxFontFamily",
  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-hcx-font"),
        renderHTML: (attributes) => {
          if (!attributes.family) {
            return {};
          }

          return {
            "data-hcx-font": attributes.family,
            class: `hcx-font-${attributes.family}`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-hcx-font]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
