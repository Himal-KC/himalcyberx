import type { FormActionState } from "@/lib/form-types";
import { HONEYPOT_FIELD_NAME } from "@/lib/form-validation";

interface FormStatusMessageProps {
  state: FormActionState;
  successTitle?: string;
  successDescription?: string;
}

export function FormStatusMessage({
  state,
  successTitle,
  successDescription,
}: FormStatusMessageProps) {
  if (!state.message) return null;

  if (state.success && successTitle) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-hcx-green/25 bg-hcx-green/10 p-4"
      >
        <p className="font-semibold text-hcx-green">{successTitle}</p>
        {successDescription && (
          <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
            {successDescription}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role={state.success ? "status" : "alert"}
      aria-live="polite"
      className={`rounded-lg border p-4 text-sm ${
        state.success
          ? "border-hcx-green/25 bg-hcx-green/10 text-hcx-green"
          : "border-hcx-red/25 bg-hcx-red/10 text-hcx-red"
      }`}
    >
      {state.message}
    </div>
  );
}

export function HoneypotField() {
  return (
    <div
      className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      aria-hidden="true"
    >
      <label htmlFor={HONEYPOT_FIELD_NAME}>Leave blank</label>
      <input
        type="text"
        id={HONEYPOT_FIELD_NAME}
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export const formInputClass =
  "w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20";

export const formLabelClass =
  "block text-sm font-medium text-hcx-text";

export const formErrorClass = "mt-1.5 text-sm text-hcx-red";
