"use client";

import { useFormStatus } from "react-dom";
import { signOutLearner } from "@/lib/actions/learner-auth";
import { focusRing } from "@/lib/page-data";

function SignOutButtonInner({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
    >
      {pending ? "Signing out…" : label}
    </button>
  );
}

export function LearnerSignOutButton({
  className,
  label = "Log out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={signOutLearner}>
      <SignOutButtonInner className={className} label={label} />
    </form>
  );
}
