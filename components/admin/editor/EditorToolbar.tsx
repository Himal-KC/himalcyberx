"use client";

import type { Editor } from "@tiptap/react";
import {
  HCX_CODE_LANGUAGES,
  HCX_FONT_FAMILIES,
  HCX_TEXT_COLORS,
  HCX_TEXT_VARIANTS,
} from "@/lib/editor/constants";
import { isSafeContentUrl, normalizeContentLink } from "@/lib/content/link";
import {
  EditorToolbarButton,
  EditorToolbarDivider,
  EditorToolbarSelect,
} from "@/components/admin/editor/EditorToolbarButton";

interface EditorToolbarProps {
  editor: Editor;
  disabled?: boolean;
  enableTables?: boolean;
  enableColors?: boolean;
  enableFontFamilies?: boolean;
}

export function EditorToolbar({
  editor,
  disabled = false,
  enableTables = true,
  enableColors = true,
  enableFontFamilies = true,
}: EditorToolbarProps) {
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

  function applyTextVariant(variantId: string) {
    const variant = HCX_TEXT_VARIANTS.find((item) => item.id === variantId);
    if (!variant) {
      return;
    }

    if ("tag" in variant && variant.tag === "heading" && "level" in variant) {
      editor
        .chain()
        .focus()
        .unsetMark("hcxTextVariant")
        .toggleHeading({ level: variant.level })
        .run();
      return;
    }

    if (variantId === "normal") {
      editor
        .chain()
        .focus()
        .clearNodes()
        .unsetAllMarks()
        .setParagraph()
        .run();
      return;
    }

    if ("className" in variant) {
      editor
        .chain()
        .focus()
        .unsetMark("hcxTextVariant")
        .setMark("hcxTextVariant", { variant: variantId })
        .run();
    }
  }

  function applyTextColor(colorId: string) {
    if (colorId === "default") {
      editor.chain().focus().unsetMark("hcxTextColor").run();
      return;
    }

    editor.chain().focus().setMark("hcxTextColor", { color: colorId }).run();
  }

  function applyFontFamily(familyId: string) {
    if (familyId === "sans") {
      editor.chain().focus().unsetMark("hcxFontFamily").run();
      return;
    }

    editor.chain().focus().setMark("hcxFontFamily", { family: familyId }).run();
  }

  function setCodeLanguage(language: string) {
    if (language === "plain") {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }

    editor
      .chain()
      .focus()
      .toggleCodeBlock({ language })
      .run();
  }

  const currentLanguage =
    (editor.getAttributes("codeBlock").language as string | undefined) ?? "plain";

  return (
    <div
      className="flex min-w-0 items-center gap-1 px-2 py-2"
      role="toolbar"
      aria-label="Formatting toolbar"
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
        label="S"
        title="Strikethrough"
        active={editor.isActive("strike")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <EditorToolbarDivider />
      <EditorToolbarButton
        label="P"
        title="Paragraph"
        active={editor.isActive("paragraph")}
        disabled={disabled}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <EditorToolbarButton
        label="H2"
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <EditorToolbarButton
        label="H3"
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <EditorToolbarButton
        label="H4"
        title="Heading 4"
        active={editor.isActive("heading", { level: 4 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      />
      <EditorToolbarDivider />
      <EditorToolbarButton
        label="•"
        title="Bullet list"
        active={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <EditorToolbarButton
        label="1."
        title="Numbered list"
        active={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <EditorToolbarButton
        label="“"
        title="Blockquote"
        active={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <EditorToolbarButton
        label="`"
        title="Inline code"
        active={editor.isActive("code")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <EditorToolbarButton
        label="{ }"
        title="Code block"
        active={editor.isActive("codeBlock")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      {editor.isActive("codeBlock") ? (
        <EditorToolbarSelect
          label="Code language"
          title="Code language"
          value={currentLanguage}
          disabled={disabled}
          onChange={setCodeLanguage}
          options={HCX_CODE_LANGUAGES.map((language) => ({
            id: language.id,
            label: language.label,
          }))}
        />
      ) : null}
      <EditorToolbarDivider />
      <EditorToolbarButton
        label="Link"
        title="Insert link"
        active={editor.isActive("link")}
        disabled={disabled}
        onClick={setLink}
      />
      <EditorToolbarButton
        label="—"
        title="Horizontal divider"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      {enableTables ? (
        <>
          <EditorToolbarDivider />
          <EditorToolbarButton
            label="Table"
            title="Insert table"
            disabled={disabled}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          />
          {editor.isActive("table") ? (
            <>
              <EditorToolbarButton
                label="↑R"
                title="Add row above"
                disabled={disabled}
                onClick={() => editor.chain().focus().addRowBefore().run()}
              />
              <EditorToolbarButton
                label="+R"
                title="Add row below"
                disabled={disabled}
                onClick={() => editor.chain().focus().addRowAfter().run()}
              />
              <EditorToolbarButton
                label="←C"
                title="Add column left"
                disabled={disabled}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              />
              <EditorToolbarButton
                label="+C"
                title="Add column right"
                disabled={disabled}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              />
              <EditorToolbarButton
                label="-R"
                title="Delete row"
                disabled={disabled}
                onClick={() => editor.chain().focus().deleteRow().run()}
              />
              <EditorToolbarButton
                label="-C"
                title="Delete column"
                disabled={disabled}
                onClick={() => editor.chain().focus().deleteColumn().run()}
              />
              <EditorToolbarButton
                label="Hdr"
                title="Toggle header row"
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              />
              <EditorToolbarButton
                label="Del Tbl"
                title="Delete table"
                disabled={disabled}
                onClick={() => editor.chain().focus().deleteTable().run()}
              />
            </>
          ) : null}
        </>
      ) : null}
      <EditorToolbarDivider />
      {enableColors ? (
        <>
          <EditorToolbarSelect
            label="Text colour"
            title="Text colour"
            value="default"
            disabled={disabled}
            onChange={applyTextColor}
            options={HCX_TEXT_COLORS.map((color) => ({
              id: color.id,
              label: color.label,
            }))}
          />
          <EditorToolbarSelect
            label="Text style"
            title="Text style"
            value="normal"
            disabled={disabled}
            onChange={applyTextVariant}
            options={HCX_TEXT_VARIANTS.map((variant) => ({
              id: variant.id,
              label: variant.label,
            }))}
          />
        </>
      ) : null}
      {enableFontFamilies ? (
        <EditorToolbarSelect
          label="Font"
          title="Font family"
          value="sans"
          disabled={disabled}
          onChange={applyFontFamily}
          options={HCX_FONT_FAMILIES.map((font) => ({
            id: font.id,
            label: font.label,
          }))}
        />
      ) : null}
      <EditorToolbarDivider />
      <EditorToolbarButton
        label="Undo"
        title="Undo"
        disabled={disabled || !editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <EditorToolbarButton
        label="Redo"
        title="Redo"
        disabled={disabled || !editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      />
      <EditorToolbarButton
        label="Clear"
        title="Clear formatting"
        disabled={disabled}
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      />
    </div>
  );
}
