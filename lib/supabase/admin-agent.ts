import { logQueryError } from "@/lib/supabase/errors";
import { isTransientSupabaseError } from "@/lib/agent/generation/save-log-core";
import { stripUndefinedValues } from "@/lib/agent/generation/save-draft-core";
import { createClient } from "@/lib/supabase/server";
import type {
  AgentRun,
  AgentRunInsert,
  AgentRunUpdate,
  AgentSource,
  AgentSourceInsert,
} from "@/lib/supabase/types";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export async function createAgentRun(
  supabase: AdminSupabase,
  payload: AgentRunInsert,
): Promise<{ data: AgentRun | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_runs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    logQueryError("createAgentRun", error);
    return { data: null, error: "Unable to create agent research run." };
  }

  return { data: data as AgentRun, error: null };
}

export async function updateAgentRun(
  supabase: AdminSupabase,
  runId: string,
  payload: AgentRunUpdate,
): Promise<{ data: AgentRun | null; error: string | null; transient?: boolean }> {
  const sanitizedPayload = stripUndefinedValues({
    ...payload,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>) as AgentRunUpdate;

  const attemptUpdate = async () =>
    supabase
      .from("agent_runs")
      .update(sanitizedPayload)
      .eq("id", runId)
      .select("*")
      .single();

  let { data, error } = await attemptUpdate();

  if (error && isTransientSupabaseError(error)) {
    ({ data, error } = await attemptUpdate());
  }

  if (error) {
    logQueryError("updateAgentRun", error);
    return {
      data: null,
      error: "Unable to update agent research run.",
      transient: isTransientSupabaseError(error),
    };
  }

  return { data: data as AgentRun, error: null };
}

export async function getAgentRun(
  supabase: AdminSupabase,
  runId: string,
): Promise<{ data: AgentRun | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    logQueryError("getAgentRun", error);
    return { data: null, error: "Unable to load agent research run." };
  }

  return { data: (data as AgentRun | null) ?? null, error: null };
}

export async function listResumableAgentRuns(
  supabase: AdminSupabase,
  limit = 10,
): Promise<{ data: AgentRun[]; error: string | null }> {
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .not("research_payload", "is", null)
    .or(
      "article_id.not.is.null,tutorial_id.not.is.null,lab_id.not.is.null",
    )
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    logQueryError("listResumableAgentRuns", error);
    return { data: [], error: "Unable to load agent research runs." };
  }

  return { data: (data ?? []) as AgentRun[], error: null };
}

export async function insertAgentSources(
  supabase: AdminSupabase,
  sources: AgentSourceInsert[],
): Promise<{ data: AgentSource[]; error: string | null }> {
  if (sources.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("agent_sources")
    .insert(sources)
    .select("*");

  if (error) {
    logQueryError("insertAgentSources", error);
    return { data: [], error: "Unable to save research sources." };
  }

  return { data: (data ?? []) as AgentSource[], error: null };
}

export async function getAgentSources(
  supabase: AdminSupabase,
  runId: string,
): Promise<{ data: AgentSource[]; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_sources")
    .select("*")
    .eq("agent_run_id", runId)
    .order("sort_order", { ascending: true });

  if (error) {
    logQueryError("getAgentSources", error);
    return { data: [], error: "Unable to load research sources." };
  }

  return { data: (data ?? []) as AgentSource[], error: null };
}
