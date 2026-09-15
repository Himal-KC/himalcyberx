"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AgentReviewPanel } from "@/components/admin/agent/AgentReviewPanel";
import {
  generateAgentDraft,
  type GenerateAgentDraftState,
} from "@/lib/actions/agent";
import type { ResearchResult } from "@/lib/agent/types";
import { focusRing } from "@/lib/page-data";

const generationStageMessages = [
  "Understanding research…",
  "Planning content…",
  "Writing grounded draft…",
  "Generating SEO…",
  "Checking source grounding…",
  "Saving draft…",
];

const initialState: GenerateAgentDraftState = {};

export function AgentGenerateDraft({ research }: { research: ResearchResult }) {
  const [state, formAction, isPending] = useActionState(
    generateAgentDraft,
    initialState,
  );
  const [stageIndex, setStageIndex] = useState(0);
  const activeStageIndex = isPending ? stageIndex : 0;

  const canGenerate =
    research.canGenerateDraft && research.researchQuality !== "failed";

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const interval = window.setInterval(() => {
      setStageIndex((current) =>
        current < generationStageMessages.length - 1 ? current + 1 : current,
      );
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isPending]);

  return (
    <div className="mt-8 border-t border-hcx-border pt-6">
      {research.researchQuality === "needs_review" && canGenerate ? (
        <p className="mb-4 text-sm text-hcx-orange">
          Draft generation is allowed, but this research needs review before any
          publication.
        </p>
      ) : null}

      {state.error ? (
        <div className="mb-4 rounded-lg border border-hcx-red/30 bg-hcx-red/5 p-4 text-sm text-hcx-red">
          {state.error}
        </div>
      ) : null}

      {state.success && state.draft ? (
        <div className="mb-4 rounded-lg border border-hcx-green/30 bg-hcx-green/5 p-4">
          <p className="text-sm font-semibold text-hcx-green">Draft Created</p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            {state.draft.existingDraft
              ? "A draft already exists for this research run."
              : `"${state.draft.title}" was saved as a draft.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={state.draft.editUrl}
              className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
            >
              Edit Draft
            </Link>
            {state.draft.previewUrl ? (
              <Link
                href={state.draft.previewUrl}
                className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
              >
                Preview Draft
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="agentRunId" value={research.agentRunId} />
        <button
          type="submit"
          disabled={!canGenerate || isPending}
          className={`inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors ${
            canGenerate && !isPending
              ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan hover:bg-hcx-cyan/20"
              : "cursor-not-allowed border-hcx-border text-hcx-text-secondary opacity-70"
          } ${focusRing}`}
        >
          {isPending ? "Generating Draft…" : "Generate Draft"}
        </button>
      </form>

      {isPending ? (
        <p className="mt-2 text-sm text-hcx-text-secondary">
          {generationStageMessages[activeStageIndex]}
        </p>
      ) : !canGenerate ? (
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Draft generation is unavailable because research did not meet the
          minimum evidence threshold.
        </p>
      ) : (
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Creates a grounded draft in the existing HimalCyberX editor. Nothing is
          published automatically.
        </p>
      )}

      {state.success && state.draft ? (
        <AgentReviewPanel
          agentRunId={research.agentRunId}
          draft={state.draft}
        />
      ) : null}
    </div>
  );
}
