"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LearnerSignOutButton } from "@/components/auth/LearnerSignOutButton";
import { UserIcon } from "@/components/icons";
import {
  LEARNER_DASHBOARD_PATH,
  LEARNER_LOGIN_PATH,
  LEARNER_PROFILE_PATH,
  LEARNER_SIGNUP_PATH,
} from "@/lib/auth/constants";
import { focusRing } from "@/lib/page-data";
import { createClient } from "@/lib/supabase/client";

type AuthNavState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "signed-in"; label: string };

interface HeaderAuthNavProps {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

function hasPublicSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function accountLabel(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string {
  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return "Account";
}

export function HeaderAuthNav({ variant, onNavigate }: HeaderAuthNavProps) {
  const supabaseConfigured = hasPublicSupabaseEnv();
  const [state, setState] = useState<AuthNavState>(
    supabaseConfigured ? { status: "loading" } : { status: "unavailable" },
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) {
        return;
      }

      if (!data.user) {
        setState({ status: "signed-out" });
        return;
      }

      let label = accountLabel(data.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (profile?.display_name && typeof profile.display_name === "string") {
        label = profile.display_name;
      } else if (profile?.username && typeof profile.username === "string") {
        label = profile.username;
      }

      setState({ status: "signed-in", label });
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  if (state.status === "unavailable") {
    return null;
  }

  if (state.status === "loading") {
    if (variant === "mobile") {
      return (
        <li className="pt-2">
          <div className="h-11 animate-pulse rounded-md bg-hcx-card" />
        </li>
      );
    }

    return (
      <div
        className="hidden h-9 w-28 animate-pulse rounded-md bg-hcx-card/80 sm:block"
        aria-hidden="true"
      />
    );
  }

  if (state.status === "signed-out") {
    if (variant === "mobile") {
      return (
        <>
          <li className="pt-2">
            <Link
              href={LEARNER_LOGIN_PATH}
              className={`block min-h-11 rounded-md px-3 py-2.5 text-sm text-hcx-text-secondary transition-colors hover:bg-hcx-card hover:text-hcx-cyan ${focusRing}`}
              onClick={onNavigate}
            >
              Sign In
            </Link>
          </li>
          <li>
            <Link
              href={LEARNER_SIGNUP_PATH}
              className={`block min-h-11 rounded-md bg-hcx-cyan px-3 py-2.5 text-center text-sm font-semibold text-hcx-bg ${focusRing}`}
              onClick={onNavigate}
            >
              Create Account
            </Link>
          </li>
        </>
      );
    }

    return (
      <div className="hidden items-center gap-1.5 sm:flex">
        <Link
          href={LEARNER_LOGIN_PATH}
          className={`rounded-md px-2.5 py-1.5 text-sm font-semibold text-hcx-text/85 transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          Sign In
        </Link>
        <Link
          href={LEARNER_SIGNUP_PATH}
          className={`rounded-md border border-hcx-cyan/40 px-3 py-1.5 text-sm font-semibold text-hcx-cyan transition-colors hover:bg-hcx-cyan/10 ${focusRing}`}
        >
          Create Account
        </Link>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <>
        <li className="pt-2">
          <Link
            href={LEARNER_DASHBOARD_PATH}
            className={`block min-h-11 rounded-md px-3 py-2.5 text-sm font-semibold text-hcx-cyan transition-colors hover:bg-hcx-card ${focusRing}`}
            onClick={onNavigate}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href={LEARNER_PROFILE_PATH}
            className={`flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm text-hcx-text-secondary transition-colors hover:bg-hcx-card hover:text-hcx-cyan ${focusRing}`}
            onClick={onNavigate}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </li>
        <li>
          <LearnerSignOutButton className="block w-full rounded-md px-3 py-2.5 text-left text-sm text-hcx-text-secondary transition-colors hover:bg-hcx-card hover:text-hcx-cyan" />
        </li>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={LEARNER_DASHBOARD_PATH}
        className={`hidden rounded-md px-2 py-1.5 text-sm font-semibold text-hcx-text/85 transition-colors hover:text-hcx-cyan sm:inline ${focusRing}`}
      >
        Dashboard
      </Link>
      <Link
        href={LEARNER_PROFILE_PATH}
        className={`inline-flex max-w-[8rem] items-center gap-1.5 truncate rounded-md px-2.5 py-1.5 text-sm font-semibold text-hcx-text/90 transition-colors hover:text-hcx-cyan ${focusRing}`}
        title={state.label}
      >
        <UserIcon className="h-4 w-4 shrink-0" />
        <span className="hidden truncate sm:inline">Profile</span>
        <span className="sm:hidden">Profile</span>
      </Link>
      <LearnerSignOutButton className="hidden rounded-md px-2 py-1.5 text-sm font-semibold text-hcx-text-secondary transition-colors hover:text-hcx-cyan sm:inline" />
    </div>
  );
}
