"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { getInitialEditorContent } from "@/lib/content/html";
import { buildRichEditorExtensions } from "@/lib/editor/extensions";
import { EditorFloatingToolbar } from "@/components/admin/editor/EditorFloatingToolbar";
import { EditorToolbar } from "@/components/admin/editor/EditorToolbar";
import { focusRing } from "@/lib/page-data";

export interface RichContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  minHeightClass?: string;
  enableTables?: boolean;
  enableColors?: boolean;
  enableFontFamilies?: boolean;
  ariaLabelledBy?: string;
}

export function RichContentEditor({
  value,
  onChange,
  disabled = false,
  invalid = false,
  minHeightClass = "min-h-[24rem]",
  enableTables = true,
  enableColors = true,
  enableFontFamilies = true,
  ariaLabelledBy,
}: RichContentEditorProps) {
  const [initialContent] = useState(() => getInitialEditorContent(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildRichEditorExtensions({
      enableTables,
      enableColors,
      enableFontFamilies,
    }),
    content: initialContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `article-editor-content focus:outline-none ${minHeightClass}`,
        ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text-secondary">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      aria-invalid={invalid}
      className={`tiptap-editor overflow-hidden rounded-lg border bg-hcx-bg transition-colors ${
        invalid
          ? "border-hcx-red/50"
          : "border-hcx-border focus-within:border-hcx-cyan/50 focus-within:ring-2 focus-within:ring-hcx-cyan/20"
      }`}
    >
      <div
        className={`sticky top-14 z-20 border-b border-hcx-border bg-hcx-card/95 backdrop-blur-sm ${focusRing}`}
      >
        <div className="overflow-x-auto">
          <EditorToolbar
            editor={editor}
            disabled={disabled}
            enableTables={enableTables}
            enableColors={enableColors}
            enableFontFamilies={enableFontFamilies}
          />
        </div>
      </div>

      <div className="relative px-4 py-4">
        <EditorFloatingToolbar editor={editor} disabled={disabled} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
