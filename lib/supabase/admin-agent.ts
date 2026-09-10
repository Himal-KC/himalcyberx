import { logQueryError } from "@/lib/supabase/errors";
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
): Promise<{ data: AgentRun | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agent_runs")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .select("*")
    .single();

  if (error) {
    logQueryError("updateAgentRun", error);
    return { data: null, error: "Unable to update agent research run." };
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
