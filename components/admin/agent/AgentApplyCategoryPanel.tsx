"use client";

import { useActionState } from "react";
import {
  applyRecommendedArticleCategory,
  type ApplyRecommendedArticleCategoryState,
} from "@/lib/actions/agent";
import type { RecommendedCategory } from "@/lib/agent/types";
import { focusRing } from "@/lib/page-data";

const initialState: ApplyRecommendedArticleCategoryState = {};

export function AgentApplyCategoryPanel({
  agentRunId,
  applicableCategory,
  currentCategoryId = null,
}: {
  agentRunId: string;
  applicableCategory: RecommendedCategory | null;
  currentCategoryId?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    applyRecommendedArticleCategory,
    initialState,
  );

  if (currentCategoryId || !applicableCategory?.id) {
    return null;
  }

  const appliedCategoryName =
    state.success && state.categoryName ? state.categoryName : null;

  return (
    <div className="mt-4 rounded-lg border border-hcx-orange/30 bg-hcx-orange/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-hcx-orange">
        Article category missing
      </p>
      <p className="mt-2 text-sm text-hcx-text-secondary">
        Phase 2 recommended{" "}
        <span className="font-semibold text-hcx-text">
          {applicableCategory.name}
        </span>
        . This draft was saved before automatic category assignment. Click below
        to apply that existing recommendation to the CMS draft. Nothing will be
        published.
      </p>

      {state.error ? (
        <p className="mt-3 text-sm text-hcx-red">{state.error}</p>
      ) : null}

      {appliedCategoryName ? (
        <p className="mt-3 text-sm text-hcx-green">
          Applied category: {appliedCategoryName}
        </p>
      ) : (
        <form action={formAction} className="mt-4">
          <input type="hidden" name="agentRunId" value={agentRunId} />
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
          >
            {isPending
              ? "Applying category..."
              : `Apply Recommended Category: ${applicableCategory.name}`}
          </button>
        </form>
      )}
    </div>
  );
}
