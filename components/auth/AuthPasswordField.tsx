"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { formInputClass, formLabelClass } from "@/components/forms/form-ui";
import { focusRing, iconButtonClass } from "@/lib/page-data";

interface AuthPasswordFieldProps {
  id: string;
  name?: string;
  label: string;
  autoComplete: string;
  disabled?: boolean;
  error?: string;
  minLength?: number;
}

export function AuthPasswordField({
  id,
  name = "password",
  label,
  autoComplete,
  disabled = false,
  error,
  minLength,
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={formLabelClass}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`pr-14 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className={`${iconButtonClass} absolute right-1 top-1/2 -translate-y-1/2 text-hcx-text-secondary transition-colors hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-hcx-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const authSubmitClass = `mt-6 w-full rounded-lg bg-hcx-cyan px-4 py-3 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const authSecondaryLinkClass = `text-sm font-medium text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`;
