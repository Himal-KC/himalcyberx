import { logQueryError } from "@/lib/supabase/errors";
import type {
  AgentReviewInsert,
  AgentReviewRow,
  AgentReviewUpdate,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getLatestAgentReviewByFingerprint(
  supabase: AdminSupabase,
  agentRunId: string,
  draftFingerprint: string,
): Promise<{ data: AgentReviewRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("*")
    .eq("agent_run_id", agentRunId)
    .eq("draft_fingerprint", draftFingerprint)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logQueryError("getLatestAgentReviewByFingerprint", error);
    return { data: null, error: "Unable to load review." };
  }

  return { data: (data as AgentReviewRow | null) ?? null, error: null };
}

export async function getLatestAgentReviewForRun(
  supabase: AdminSupabase,
  agentRunId: string,
): Promise<{ data: AgentReviewRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("*")
    .eq("agent_run_id", agentRunId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logQueryError("getLatestAgentReviewForRun", error);
    return { data: null, error: "Unable to load review." };
  }

  return { data: (data as AgentReviewRow | null) ?? null, error: null };
}

export async function insertAgentReview(
  supabase: AdminSupabase,
  payload: AgentReviewInsert,
): Promise<{ data: AgentReviewRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    logQueryError("insertAgentReview", error);
    return { data: null, error: "Unable to save review." };
  }

  return { data: data as AgentReviewRow, error: null };
}

export async function updateAgentReview(
  supabase: AdminSupabase,
  reviewId: string,
  payload: AgentReviewUpdate,
): Promise<{ data: AgentReviewRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("*")
    .single();

  if (error) {
    logQueryError("updateAgentReview", error);
    return { data: null, error: "Unable to update review." };
  }

  return { data: data as AgentReviewRow, error: null };
}
