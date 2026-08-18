"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/lib/actions/auth";
import { focusRing } from "@/lib/page-data";

function SignOutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg border border-hcx-border px-3 py-1.5 text-xs font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/40 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${focusRing}`}
    >
      {pending ? "Signing out…" : "Sign Out"}
    </button>
  );
}

export function AdminSignOutButton() {
  return (
    <form action={signOut}>
      <SignOutButtonInner />
    </form>
  );
}
