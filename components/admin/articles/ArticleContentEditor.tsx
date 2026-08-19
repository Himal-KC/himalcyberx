"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { getInitialEditorContent } from "@/lib/articles/content";
import { focusRing } from "@/lib/page-data";

interface ArticleContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  minHeightClass?: string;
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-hcx-cyan/15 text-hcx-cyan"
          : "text-hcx-text-secondary hover:bg-hcx-bg hover:text-hcx-text"
      } ${focusRing}`}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-hcx-border" aria-hidden="true" />;
}

export function ArticleContentEditor({
  value,
  onChange,
  disabled = false,
  invalid = false,
  minHeightClass = "min-h-[24rem]",
}: ArticleContentEditorProps) {
  const [initialContent] = useState(() => getInitialEditorContent(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-hcx-cyan underline underline-offset-2",
        },
      }),
    ],
    content: initialContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `article-editor-content focus:outline-none ${minHeightClass}`,
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

  const activeEditor = editor;

  function setLink() {
    const previousUrl = activeEditor.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    activeEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  return (
    <div
      id="content"
      aria-invalid={invalid}
      className={`tiptap-editor overflow-hidden rounded-lg border bg-hcx-bg transition-colors ${
        invalid ? "border-hcx-red/50" : "border-hcx-border focus-within:border-hcx-cyan/50 focus-within:ring-2 focus-within:ring-hcx-cyan/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-hcx-border bg-hcx-card px-2 py-2">
        <ToolbarButton
          label="B"
          title="Bold"
          active={activeEditor.isActive("bold")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="Italic"
          active={activeEditor.isActive("italic")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
        />
        <ToolbarDivider />
        <ToolbarButton
          label="H2"
          title="Heading 2"
          active={activeEditor.isActive("heading", { level: 2 })}
          disabled={disabled}
          onClick={() =>
            activeEditor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          label="H3"
          title="Heading 3"
          active={activeEditor.isActive("heading", { level: 3 })}
          disabled={disabled}
          onClick={() =>
            activeEditor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <ToolbarDivider />
        <ToolbarButton
          label="• List"
          title="Bullet list"
          active={activeEditor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          title="Numbered list"
          active={activeEditor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarDivider />
        <ToolbarButton
          label="“”"
          title="Blockquote"
          active={activeEditor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="`"
          title="Inline code"
          active={activeEditor.isActive("code")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          label="{ }"
          title="Code block"
          active={activeEditor.isActive("codeBlock")}
          disabled={disabled}
          onClick={() => activeEditor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolbarDivider />
        <ToolbarButton
          label="Link"
          title="Insert link"
          active={activeEditor.isActive("link")}
          disabled={disabled}
          onClick={setLink}
        />
        <ToolbarDivider />
        <ToolbarButton
          label="Undo"
          title="Undo"
          disabled={
            disabled || !activeEditor.can().chain().focus().undo().run()
          }
          onClick={() => activeEditor.chain().focus().undo().run()}
        />
        <ToolbarButton
          label="Redo"
          title="Redo"
          disabled={
            disabled || !activeEditor.can().chain().focus().redo().run()
          }
          onClick={() => activeEditor.chain().focus().redo().run()}
        />
        <ToolbarButton
          label="Clear"
          title="Clear formatting"
          disabled={disabled}
          onClick={() =>
            activeEditor.chain().focus().clearNodes().unsetAllMarks().run()
          }
        />
      </div>

      <div className="px-4 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
