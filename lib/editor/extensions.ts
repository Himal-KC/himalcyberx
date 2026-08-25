import type { Extensions } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { HcxFontFamily, HcxTextColor, HcxTextVariant } from "@/lib/editor/hcx-marks";

export interface RichEditorExtensionOptions {
  enableTables?: boolean;
  enableColors?: boolean;
  enableFontFamilies?: boolean;
}

export function buildRichEditorExtensions(
  options: RichEditorExtensionOptions = {},
): Extensions {
  const {
    enableTables = true,
    enableColors = true,
    enableFontFamilies = true,
  } = options;

  const extensions: Extensions = [
    StarterKit.configure({
      heading: {
        levels: [2, 3, 4],
      },
      codeBlock: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "text-hcx-cyan underline underline-offset-2",
      },
    }),
    CodeBlock.configure({
      HTMLAttributes: {
        class: "hcx-code-block",
      },
    }),
  ];

  if (enableColors) {
    extensions.push(HcxTextColor, HcxTextVariant);
  }

  if (enableFontFamilies) {
    extensions.push(HcxFontFamily);
  }

  if (enableTables) {
    extensions.push(
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "hcx-editor-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    );
  }

  return extensions;
}
