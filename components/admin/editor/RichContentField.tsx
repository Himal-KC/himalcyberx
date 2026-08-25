"use client";

import { RichContentEditor } from "@/components/admin/editor/RichContentEditor";

interface RichContentFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  minHeightClass?: string;
  enableTables?: boolean;
  enableColors?: boolean;
  enableFontFamilies?: boolean;
  helperText?: string;
}

export function RichContentField({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  invalid = false,
  error,
  minHeightClass,
  enableTables = true,
  enableColors = true,
  enableFontFamilies = true,
  helperText,
}: RichContentFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-hcx-text">
        {label}
      </label>
      <div className="mt-2">
        <RichContentEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          minHeightClass={minHeightClass}
          enableTables={enableTables}
          enableColors={enableColors}
          enableFontFamilies={enableFontFamilies}
          ariaLabelledBy={id}
        />
        <input type="hidden" name={name} value={value} />
      </div>
      {helperText ? (
        <p className="mt-1.5 text-xs text-hcx-text-secondary">{helperText}</p>
      ) : null}
      {error ? <p className="mt-1.5 text-sm text-hcx-red">{error}</p> : null}
    </div>
  );
}
