"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import {
  generateAgentFeaturedImage,
  type GenerateAgentFeaturedImageState,
} from "@/lib/actions/agent";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import type { RunReviewResult } from "@/lib/agent/review/types";
import type { FeaturedImageState } from "@/lib/agent/resume/resume-core";
import { focusRing } from "@/lib/page-data";

const initialState: GenerateAgentFeaturedImageState = {};

function reviewAllowsImageGeneration(review: RunReviewResult | null): boolean {
  if (!review) {
    return false;
  }

  return review.review.status === "pass" || review.review.status === "needs_review";
}

export function AgentFeaturedImagePanel({
  agentRunId,
  draft,
  review,
  initialImage = { url: null, alt: null },
}: {
  agentRunId: string;
  draft: GenerateDraftResult;
  review: RunReviewResult | null;
  initialImage?: FeaturedImageState;
}) {
  const [state, formAction, isPending] = useActionState(
    generateAgentFeaturedImage,
    initialState,
  );

  const image = state.image
    ? {
        url: state.image.featuredImageUrl,
        alt: state.image.featuredImageAlt,
        width: state.image.width,
        height: state.image.height,
      }
    : initialImage.url
      ? {
          url: initialImage.url,
          alt: initialImage.alt ?? "",
          width: 1536,
          height: 864,
        }
      : null;

  const hasReview = Boolean(review);
  const canGenerate = reviewAllowsImageGeneration(review);
  const blockedByFail = hasReview && !canGenerate;

  return (
    <div className="mt-8 rounded-xl border border-hcx-border bg-hcx-bg/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Phase 6 — Featured Image
          </p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Generate a professional 16:9 featured image after Phase 5 review.
            The draft stays unpublished.
          </p>
        </div>
        {canGenerate ? (
          <form action={formAction}>
            <input type="hidden" name="agentRunId" value={agentRunId} />
            {image ? (
              <input type="hidden" name="forceRegenerate" value="1" />
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
            >
              {isPending
                ? "Generating featured image..."
                : image
                  ? "Regenerate Featured Image"
                  : "Generate Featured Image"}
            </button>
          </form>
        ) : null}
      </div>

      {!hasReview ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          Run Phase 5 review before generating a featured image.
        </p>
      ) : null}

      {blockedByFail ? (
        <p className="mt-4 text-sm text-hcx-red">
          Featured image generation is blocked while the Phase 5 review status is
          FAIL.
        </p>
      ) : null}

      {state.error ? (
        <div className="mt-4 rounded-lg border border-hcx-red/30 bg-hcx-red/5 p-4 text-sm text-hcx-red">
          {state.error}
        </div>
      ) : null}

      {state.success && state.image ? (
        <p className="mt-4 text-sm text-hcx-green">
          Featured image attached to draft successfully.
        </p>
      ) : null}

      {image ? (
        <div className="mt-5 space-y-4">
          <div className="overflow-hidden rounded-lg border border-hcx-border bg-black/20">
            <Image
              src={image.url}
              alt={image.alt || draft.title}
              width={image.width}
              height={image.height}
              className="h-auto w-full"
              unoptimized
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Dimensions
              </p>
              <p className="mt-1 text-sm text-hcx-text">
                {image.width} × {image.height}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Alt text
              </p>
              <p className="mt-1 text-sm text-hcx-text-secondary">{image.alt}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={draft.editUrl}
          className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
        >
          Open Draft
        </Link>
        {draft.previewUrl ? (
          <Link
            href={draft.previewUrl}
            className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
          >
            Preview Draft
          </Link>
        ) : null}
      </div>
    </div>
  );
}
