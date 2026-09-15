import "server-only";

import {
  getPersistedArticleCategoryRecommendation,
  mapCategoryRowsToInventory,
  resolveApplicableArticleCategory,
  resolveValidatedArticleCategoryId,
  type CategoryRowForMatching,
} from "@/lib/agent/category/article-category-core";
import { parsePersistedResearchPayload } from "@/lib/agent/generation/research-payload";
import type { AgentRun } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

async function loadCategoryRows(
  supabase: AdminSupabase,
): Promise<CategoryRowForMatching[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as CategoryRowForMatching[];
}

export async function resolveArticleCategoryIdForAgentSave(input: {
  supabase: AdminSupabase;
  run: AgentRun;
}): Promise<string | null> {
  if (input.run.content_type !== "article") {
    return null;
  }

  const payload = parsePersistedResearchPayload(input.run.research_payload);
  const categories = mapCategoryRowsToInventory(
    await loadCategoryRows(input.supabase),
  );

  return resolveValidatedArticleCategoryId({
    topic: input.run.topic,
    categories,
    persistedRecommendation: getPersistedArticleCategoryRecommendation(payload),
  });
}

export async function applyRecommendedArticleCategoryToDraft(input: {
  supabase: AdminSupabase;
  agentRunId: string;
}): Promise<
  | { ok: true; categoryId: string; categoryName: string; articleId: string }
  | { ok: false; error: string }
> {
  const trimmedRunId = input.agentRunId.trim();
  const { data: run, error: runError } = await input.supabase
    .from("agent_runs")
    .select("*")
    .eq("id", trimmedRunId)
    .maybeSingle();

  if (runError || !run) {
    return { ok: false, error: "Unable to load agent research run." };
  }

  if (run.content_type !== "article" || !run.article_id) {
    return { ok: false, error: "This action applies to article drafts only." };
  }

  const { data: article, error: articleError } = await input.supabase
    .from("articles")
    .select("id, category_id, status, agent_run_id")
    .eq("id", run.article_id)
    .maybeSingle();

  if (articleError || !article) {
    return { ok: false, error: "Unable to load linked article draft." };
  }

  if (article.agent_run_id !== run.id) {
    return { ok: false, error: "Linked draft does not belong to this agent run." };
  }

  if (article.status !== "draft") {
    return { ok: false, error: "Only draft articles can receive a recommended category." };
  }

  if (article.category_id) {
    return { ok: false, error: "This article already has a category assigned." };
  }

  const payload = parsePersistedResearchPayload(run.research_payload);
  const categories = mapCategoryRowsToInventory(
    await loadCategoryRows(input.supabase),
  );
  const applicable = resolveApplicableArticleCategory({
    topic: run.topic,
    categories,
    persistedRecommendation: getPersistedArticleCategoryRecommendation(payload),
  });

  if (!applicable?.id) {
    return {
      ok: false,
      error: "No confident existing category recommendation is available for this run.",
    };
  }

  const { data: updated, error: updateError } = await input.supabase
    .from("articles")
    .update({ category_id: applicable.id })
    .eq("id", article.id)
    .eq("agent_run_id", run.id)
    .is("category_id", null)
    .select("id, category_id")
    .maybeSingle();

  if (updateError || !updated?.category_id) {
    return { ok: false, error: "Unable to apply recommended category." };
  }

  return {
    ok: true,
    categoryId: updated.category_id,
    categoryName: applicable.name,
    articleId: article.id,
  };
}
