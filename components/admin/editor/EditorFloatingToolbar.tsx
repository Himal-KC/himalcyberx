"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { isSafeContentUrl, normalizeContentLink } from "@/lib/content/link";
import { EditorToolbarButton } from "@/components/admin/editor/EditorToolbarButton";

interface EditorFloatingToolbarProps {
  editor: Editor;
  disabled?: boolean;
}

export function EditorFloatingToolbar({
  editor,
  disabled = false,
}: EditorFloatingToolbarProps) {
  function setLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalized = normalizeContentLink(url);
    if (!isSafeContentUrl(normalized)) {
      window.alert("Only http(s), mailto, and relative links are allowed.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalized })
      .run();
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-1 rounded-lg border border-hcx-border bg-hcx-card p-1 shadow-lg"
    >
      <EditorToolbarButton
        label="B"
        title="Bold"
        active={editor.isActive("bold")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <EditorToolbarButton
        label="I"
        title="Italic"
        active={editor.isActive("italic")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <EditorToolbarButton
        label="U"
        title="Underline"
        active={editor.isActive("underline")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <EditorToolbarButton
        label="Link"
        title="Insert link"
        active={editor.isActive("link")}
        disabled={disabled}
        onClick={setLink}
      />
      <EditorToolbarButton
        label="`"
        title="Inline code"
        active={editor.isActive("code")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
    </BubbleMenu>
  );
}
