"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { buildLoginRedirectPath } from "@/lib/auth/redirects";
import {
  getLearningProgressUiState,
  markLearningCompleted,
  startLearning,
} from "@/lib/actions/learning-progress";
import type {
  LearningContentType,
  LearningProgressUiState,
  LearningProgressView,
} from "@/lib/learning/types";
import { focusRing } from "@/lib/page-data";

type LearningProgressControlsProps = {
  contentType: LearningContentType;
  contentId: string;
  returnTo: string;
};

const primaryButtonClass = `inline-flex items-center justify-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan transition-colors hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const secondaryButtonClass = `inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-bg px-4 py-2 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/40 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

function startLabel(contentType: LearningContentType) {
  return contentType === "tutorial" ? "Start Tutorial" : "Start Lab";
}

function errorMessage(error: string | null) {
  if (!error) {
    return null;
  }
  if (error === "unauthenticated") {
    return "Sign in to track your progress.";
  }
  if (error === "invalid_content" || error === "invalid_target") {
    return "This content cannot be tracked yet.";
  }
  if (error === "invalid_progress" || error === "invalid_transition") {
    return "That progress update is not allowed.";
  }
  return "Progress could not be updated. Please try again.";
}

export function LearningProgressControls({
  contentType,
  contentId,
  returnTo,
}: LearningProgressControlsProps) {
  const [ui, setUi] = useState<LearningProgressUiState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    getLearningProgressUiState({ contentType, contentId }).then((state) => {
      if (!cancelled) {
        setUi(state);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [contentType, contentId]);

  const applyView = (progress: LearningProgressView) => {
    setError(null);
    setUi({ authenticated: true, progress });
  };

  const handleStart = () => {
    startTransition(async () => {
      const result = await startLearning({ contentType, contentId });
      if (result.ok) {
        applyView(result.data);
        return;
      }
      setError(result.error);
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await markLearningCompleted({ contentType, contentId });
      if (result.ok) {
        applyView(result.data);
        return;
      }
      setError(result.error);
    });
  };

  const signInHref = buildLoginRedirectPath(returnTo);
  const progress = ui?.progress;
  const status = progress?.status ?? "not_started";
  const message = errorMessage(error);

  return (
    <div
      className="mt-6 rounded-xl border border-hcx-border bg-hcx-bg/60 p-4 sm:p-5"
      aria-busy={!ui || isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Learning progress
          </p>
          {status === "completed" ? (
            <p className="mt-1 text-sm font-semibold text-hcx-green">
              Completed ✓
            </p>
          ) : status === "in_progress" ? (
            <p className="mt-1 text-sm text-hcx-text-secondary">
              In progress
              {typeof progress?.progressPercent === "number"
                ? ` · ${progress.progressPercent}%`
                : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-hcx-text-secondary">
              Track this {contentType} against your account.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!ui ? (
            <span className="text-sm text-hcx-text-secondary">Loading…</span>
          ) : !ui.authenticated ? (
            <Link href={signInHref} className={primaryButtonClass}>
              Sign in to track progress
            </Link>
          ) : status === "completed" ? (
            <span className="rounded-lg border border-hcx-green/30 bg-hcx-green/10 px-4 py-2 text-sm font-semibold text-hcx-green">
              Completed ✓
            </span>
          ) : status === "in_progress" ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              className={primaryButtonClass}
            >
              Mark Complete
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={isPending}
              className={secondaryButtonClass}
            >
              {startLabel(contentType)}
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p role="alert" className="mt-3 text-sm text-hcx-red">
          {message}
        </p>
      ) : null}
    </div>
  );
}
