"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { learnerSignInHref } from "@/lib/bookmarks/learner-sign-in";
import type { BookmarkContentType } from "@/lib/bookmarks/types";
import {
  getBookmarkUiStateAction,
  removeBookmarkAction,
  saveBookmarkAction,
} from "@/lib/actions/bookmarks";
import { focusRing } from "@/lib/page-data";

type SaveContentButtonProps = {
  contentType: BookmarkContentType;
  contentId: string;
  returnTo: string;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
    </svg>
  );
}

const buttonClass = `inline-flex min-w-[8.5rem] items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${focusRing}`;

export function SaveContentButton({
  contentType,
  contentId,
  returnTo,
}: SaveContentButtonProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    getBookmarkUiStateAction({ contentType, contentId }).then((state) => {
      if (cancelled) {
        return;
      }
      setAuthenticated(state.authenticated);
      setSaved(state.saved);
    });

    return () => {
      cancelled = true;
    };
  }, [contentType, contentId]);

  if (authenticated === false) {
    return (
      <Link
        href={learnerSignInHref(returnTo)}
        className={`${buttonClass} border-hcx-border text-hcx-text-secondary hover:border-hcx-cyan/30 hover:text-hcx-cyan`}
      >
        <BookmarkIcon filled={false} />
        Sign in to save
      </Link>
    );
  }

  const busy = authenticated === null || pending;
  const label = saved ? "Saved" : "Save";
  const ariaLabel = saved
    ? `Remove saved ${contentType}`
    : `Save ${contentType}`;

  function toggleSave() {
    if (busy) {
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);

    startTransition(async () => {
      const result = nextSaved
        ? await saveBookmarkAction({ contentType, contentId })
        : await removeBookmarkAction({ contentType, contentId });

      if (!result.ok) {
        setSaved(!nextSaved);
        if (result.error === "unauthenticated") {
          setAuthenticated(false);
        }
        return;
      }

      setSaved(result.data.saved);
    });
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={busy}
      aria-pressed={saved}
      aria-busy={busy}
      aria-label={ariaLabel}
      className={`${buttonClass} ${
        saved
          ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
          : "border-hcx-border text-hcx-text-secondary hover:border-hcx-cyan/30 hover:text-hcx-cyan"
      } disabled:cursor-wait disabled:opacity-70`}
    >
      <BookmarkIcon filled={saved} />
      {busy && authenticated === null ? "Save" : label}
    </button>
  );
}
