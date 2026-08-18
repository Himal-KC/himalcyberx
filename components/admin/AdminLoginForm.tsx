"use client";

import { useActionState, useState } from "react";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { focusRing } from "@/lib/page-data";

const INITIAL_STATE: AuthActionState = {};

const adminInputClass =
  "w-full rounded-lg border border-[#26354B] bg-[#070B14] py-3 text-sm text-[#F4F7FB] placeholder:text-[#64748B] transition-colors focus:border-[#00D9FF] focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 disabled:cursor-not-allowed disabled:opacity-60";

const adminLabelClass = "block text-sm font-medium text-[#F4F7FB]";

export function AdminLoginForm({
  initialError,
}: {
  initialError?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    signIn,
    initialError ? { error: initialError } : INITIAL_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-xl border border-[rgba(0,217,255,0.14)] bg-[#111A2C] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] sm:p-8"
      aria-label="Admin sign in"
    >
      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-4 text-sm text-hcx-red"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="admin-email" className={adminLabelClass}>
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            aria-invalid={Boolean(state.error)}
            className={`mt-2 px-4 ${adminInputClass}`}
          />
        </div>

        <div>
          <label htmlFor="admin-password" className={adminLabelClass}>
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              disabled={isPending}
              aria-invalid={Boolean(state.error)}
              className={`pl-4 pr-11 ${adminInputClass}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isPending}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#94A3B8] transition-colors hover:text-[#00D9FF] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="admin-password"
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#94A3B8]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#26354B] bg-[#070B14] text-[#00D9FF] focus:ring-[#00D9FF]/30 focus:ring-offset-[#111A2C]"
          />
          Remember me
        </label>
        <button
          type="button"
          className={`text-sm text-[#00D9FF] transition-opacity hover:opacity-80 ${focusRing}`}
          onClick={(event) => event.preventDefault()}
          aria-disabled="true"
          title="Password recovery coming soon"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`mt-6 w-full rounded-lg bg-[#00D9FF] px-4 py-3 text-sm font-semibold text-[#070B14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {isPending ? "Signing in…" : "Sign In"}
      </button>

      <p className="mt-6 text-center text-xs leading-relaxed text-[#94A3B8]">
        Authorized personnel only. Unauthorized access attempts may be monitored
        and reported.
      </p>
    </form>
  );
}
