"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  publishAgentContent,
  type PublishAgentContentState,
} from "@/lib/actions/agent";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import { buildAgentContentTypeLabel } from "@/lib/agent/publish/public-url-core";
import type { RunPublishResult } from "@/lib/agent/publish/types";
import type { RunReadinessResult } from "@/lib/agent/readiness/types";
import { focusRing } from "@/lib/page-data";

const initialState: PublishAgentContentState = {};

function notificationLabel(
  outcome: RunPublishResult["notificationOutcome"],
): string | null {
  switch (outcome) {
    case "sent":
      return "Subscriber notification: sent";
    case "partial":
      return "Subscriber notification: partially sent";
    case "failed":
      return "Subscriber notification: failed";
    case "skipped":
      return "Subscriber notification: skipped";
    default:
      return null;
  }
}

export function AgentPublishPanel({
  agentRunId,
  draft,
  readiness,
  initialPublish = null,
}: {
  agentRunId: string;
  draft: GenerateDraftResult;
  readiness: RunReadinessResult | null;
  initialPublish?: RunPublishResult | null;
}) {
  const [state, formAction, isPending] = useActionState(
    publishAgentContent,
    initialPublish
      ? {
          publish: initialPublish,
          ...(initialPublish.success ? { success: true as const } : {}),
        }
      : initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, startConfirmTransition] = useTransition();

  const publish = state.publish ?? initialPublish;
  const contentTypeLabel = buildAgentContentTypeLabel(draft.contentType);
  const reviewStale = readiness?.warningIssues.some(
    (entry) => entry.code === "REVIEW_STALE",
  );
  const isOutOfBandPublished = publish?.code === "OUT_OF_BAND_PUBLISHED";
  const isPhase8Published =
    publish?.success === true &&
    (publish.code === "PUBLISHED" || publish.code === "ALREADY_PUBLISHED");
  const canPublish =
    readiness?.status === "READY_TO_PUBLISH" &&
    !readiness.stale &&
    !reviewStale &&
    !isPhase8Published &&
    !isOutOfBandPublished;

  function handleConfirmPublish() {
    setConfirmError(null);
    startConfirmTransition(() => {
      const formData = new FormData();
      formData.set("agentRunId", agentRunId);
      formAction(formData);
      setConfirmOpen(false);
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-hcx-border bg-hcx-bg/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Phase 8 — Safe Publishing
          </p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Explicit publication through the existing CMS path. Nothing is
            published automatically.
          </p>
        </div>
        {canPublish ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending || isConfirming}
            className={`inline-flex items-center rounded-lg border border-hcx-green/40 bg-hcx-green/10 px-4 py-2 text-sm font-semibold text-hcx-green hover:bg-hcx-green/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
          >
            {isPending || isConfirming ? "Publishing..." : "Publish Content"}
          </button>
        ) : null}
      </div>

      {!readiness ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          Run Final Readiness Check before publishing.
        </p>
      ) : readiness.status === "BLOCKED" ? (
        <p className="mt-4 text-sm text-hcx-orange">
          Publishing blocked. Resolve Phase 7 blocking issues first.
        </p>
      ) : readiness.status === "NEEDS_REVIEW" ? (
        <p className="mt-4 text-sm text-hcx-orange">
          Not ready to publish. Resolve review warnings and rerun the required
          checks.
        </p>
      ) : readiness.stale ? (
        <p className="mt-4 text-sm text-hcx-orange">
          Final readiness is outdated. Rerun Phase 7.
        </p>
      ) : reviewStale ? (
        <p className="mt-4 text-sm text-hcx-orange">
          Phase 5 review is outdated. Rerun Independent Review before publishing.
        </p>
      ) : null}

      {state.error ? (
        <div className="mt-4 rounded-lg border border-hcx-red/30 bg-hcx-red/5 p-4 text-sm text-hcx-red">
          {state.error}
        </div>
      ) : null}

      {publish ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isOutOfBandPublished
                  ? "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange"
                  : publish.success
                    ? "border-hcx-green/40 bg-hcx-green/10 text-hcx-green"
                    : "border-hcx-red/40 bg-hcx-red/10 text-hcx-red"
              }`}
            >
              {isOutOfBandPublished
                ? "PUBLISHED OUTSIDE HCX AGENT"
                : publish.alreadyPublished
                  ? "ALREADY PUBLISHED"
                  : publish.success
                    ? "PUBLISHED"
                    : publish.code}
            </span>
            {publish.publishedAt ? (
              <span className="text-sm text-hcx-text-secondary">
                Published at: {new Date(publish.publishedAt).toLocaleString()}
              </span>
            ) : null}
          </div>

          {isOutOfBandPublished ? (
            <p className="text-sm text-hcx-text-secondary">
              This content is already public, but it was not published through
              this HCX Agent Phase 8 run.
            </p>
          ) : !publish.success ? (
            <p className="text-sm text-hcx-text-secondary">{publish.message}</p>
          ) : null}

          {notificationLabel(publish.notificationOutcome) ? (
            <p className="text-sm text-hcx-text-secondary">
              {notificationLabel(publish.notificationOutcome)}
            </p>
          ) : null}

          {publish.publicUrl ? (
            <Link
              href={publish.publicUrl}
              className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
            >
              View Public Content
            </Link>
          ) : null}
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => !isPending && !isConfirming && setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-publish-title"
            className="w-full max-w-md rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="agent-publish-title"
              className="text-lg font-semibold text-hcx-text"
            >
              Publish this {contentTypeLabel} now?
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              This will make the content public and may notify active
              subscribers.
            </p>

            {confirmError ? (
              <p className="mt-4 text-sm text-hcx-red" role="alert">
                {confirmError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending || isConfirming}
                className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 disabled:opacity-60 ${focusRing}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPending || isConfirming}
                className={`rounded-lg bg-hcx-green px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
              >
                {isPending || isConfirming ? "Publishing..." : "Confirm Publish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
