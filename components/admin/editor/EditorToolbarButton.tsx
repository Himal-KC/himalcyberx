"use client";

import { focusRing } from "@/lib/page-data";

interface EditorToolbarButtonProps {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function EditorToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: EditorToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-hcx-cyan/15 text-hcx-cyan"
          : "text-hcx-text-secondary hover:bg-hcx-bg hover:text-hcx-text"
      } ${focusRing}`}
    >
      {label}
    </button>
  );
}

export function EditorToolbarDivider() {
  return (
    <span
      className="mx-1 hidden h-5 w-px shrink-0 bg-hcx-border sm:inline"
      aria-hidden="true"
    />
  );
}

export function EditorToolbarSelect({
  label,
  title,
  value,
  disabled = false,
  onChange,
  options,
}: {
  label: string;
  title: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        title={title}
        aria-label={title}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-md border border-hcx-border bg-hcx-bg px-2 py-1 text-xs text-hcx-text ${focusRing}`}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
