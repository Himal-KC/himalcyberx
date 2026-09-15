"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AgentFeaturedImagePanel } from "@/components/admin/agent/AgentFeaturedImagePanel";
import {
  reviewAgentDraft,
  type ReviewAgentDraftState,
} from "@/lib/actions/agent";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import type { RunReviewResult } from "@/lib/agent/review/types";
import { focusRing } from "@/lib/page-data";

const initialState: ReviewAgentDraftState = {};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pass":
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
    case "needs_review":
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
    default:
      return "border-hcx-red/40 bg-hcx-red/10 text-hcx-red";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "needs_review":
      return "NEEDS REVIEW";
    default:
      return "FAIL";
  }
}

export function AgentReviewPanel({
  agentRunId,
  draft,
  initialReview = null,
  initialFeaturedImage = { url: null, alt: null },
}: {
  agentRunId: string;
  draft: GenerateDraftResult;
  initialReview?: RunReviewResult | null;
  initialFeaturedImage?: { url: string | null; alt: string | null };
}) {
  const [state, formAction, isPending] = useActionState(
    reviewAgentDraft,
    initialReview ? { success: true, review: initialReview } : initialState,
  );

  const review = state.review?.review ?? initialReview?.review;

  return (
    <div className="mt-8 rounded-xl border border-hcx-border bg-hcx-bg/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Fact-check &amp; Quality Review
          </p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Independent Phase 5 review using persisted Phase 3 evidence only.
            Nothing is published automatically.
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="agentRunId" value={agentRunId} />
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
          >
            {isPending ? "Reviewing draft..." : "Run Independent Review"}
          </button>
        </form>
      </div>

      {state.error ? (
        <div className="mt-4 rounded-lg border border-hcx-red/30 bg-hcx-red/5 p-4 text-sm text-hcx-red">
          {state.error}
        </div>
      ) : null}

      {review ? (
        <div className="mt-5 space-y-5">
          {review.reusedFromCache ? (
            <p className="text-sm text-hcx-text-secondary">
              Reused the latest completed review for the unchanged draft fingerprint.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(review.status)}`}
            >
              {statusLabel(review.status)}
            </span>
            <span className="inline-flex items-center rounded-full border border-hcx-border px-3 py-1 text-xs font-semibold text-hcx-text">
              Quality score: {review.qualityScore}
            </span>
            <span className="inline-flex items-center rounded-full border border-hcx-border px-3 py-1 text-xs font-semibold text-hcx-text">
              Fact-check: {review.factCheckStatus}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-hcx-text">Review summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
              {review.summary}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewList
              title="Supported findings"
              items={review.findings
                .filter((finding) => finding.status === "supported")
                .map((finding) => finding.claimText)}
            />
            <ReviewList
              title="Needs-review findings"
              items={review.findings
                .filter(
                  (finding) =>
                    finding.status === "partially_supported" ||
                    finding.status === "not_verifiable",
                )
                .map((finding) => finding.claimText)}
            />
            <ReviewList
              title="Unsupported / conflicting findings"
              items={[
                ...review.unsupportedClaims,
                ...review.conflictingClaims,
                ...review.findings
                  .filter(
                    (finding) =>
                      finding.status === "unsupported" ||
                      finding.status === "conflicting",
                  )
                  .map((finding) => finding.claimText),
              ]}
            />
            <ReviewList
              title="Warnings"
              items={review.warnings}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <IntegrityPanel
              title="Source integrity"
              passed={review.sourceIntegrity.passed}
              issues={review.sourceIntegrity.issues}
            />
            <IntegrityPanel
              title="Internal-link integrity"
              passed={review.internalLinkIntegrity.passed}
              issues={review.internalLinkIntegrity.issues}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AssessmentPanel title="Technical review" assessment={review.safetyReview} />
            <AssessmentPanel title="SEO review" assessment={review.seoReview} />
            <AssessmentPanel title="Readability" assessment={review.readabilityReview} />
            <AssessmentPanel title="Originality" assessment={review.originalityReview} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={state.review?.editUrl ?? initialReview?.editUrl ?? draft.editUrl}
              className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
            >
              Open Draft
            </Link>
            {(state.review?.previewUrl ??
              initialReview?.previewUrl ??
              draft.previewUrl) ? (
              <Link
                href={
                  state.review?.previewUrl ??
                  initialReview?.previewUrl ??
                  draft.previewUrl ??
                  "#"
                }
                className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
              >
                Preview Draft
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {(review ?? initialReview) ? (
        <AgentFeaturedImagePanel
          agentRunId={agentRunId}
          draft={draft}
          review={state.review ?? initialReview ?? null}
          initialImage={initialFeaturedImage}
        />
      ) : null}
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-hcx-border p-4">
      <h3 className="text-sm font-semibold text-hcx-text">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-hcx-text-secondary">
          {items.slice(0, 8).map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-hcx-text-secondary">None recorded.</p>
      )}
    </div>
  );
}

function IntegrityPanel({
  title,
  passed,
  issues,
}: {
  title: string;
  passed: boolean;
  issues: string[];
}) {
  return (
    <div className="rounded-lg border border-hcx-border p-4">
      <h3 className="text-sm font-semibold text-hcx-text">{title}</h3>
      <p
        className={`mt-2 text-sm font-semibold ${passed ? "text-hcx-green" : "text-hcx-red"}`}
      >
        {passed ? "Passed" : "Failed"}
      </p>
      {issues.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-hcx-text-secondary">
          {issues.map((issue) => (
            <li key={`${title}-${issue}`}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AssessmentPanel({
  title,
  assessment,
}: {
  title: string;
  assessment: {
    score: number;
    summary: string;
    issues: string[];
  } | null;
}) {
  if (!assessment) {
    return null;
  }

  return (
    <div className="rounded-lg border border-hcx-border p-4">
      <h3 className="text-sm font-semibold text-hcx-text">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-hcx-text">
        Score: {assessment.score}
      </p>
      <p className="mt-2 text-sm text-hcx-text-secondary">{assessment.summary}</p>
    </div>
  );
}
