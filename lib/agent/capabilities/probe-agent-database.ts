import "server-only";

import {
  resolveDatabaseProbeCapabilityState,
  type AgentCapabilityState,
} from "@/lib/agent/capabilities/capabilities-core";
import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export interface AgentDatabaseCapabilityProbe {
  phase4: AgentCapabilityState;
  phase5: AgentCapabilityState;
}

async function probePhase4Schema(
  supabase: AdminSupabase,
): Promise<AgentCapabilityState> {
  const { error } = await supabase
    .from("agent_runs")
    .select("id, research_payload, generation_metadata")
    .limit(0);

  if (error) {
    logQueryError("probeAgentPhase4Schema", error);
  }

  return resolveDatabaseProbeCapabilityState(error);
}

async function probePhase5Schema(
  supabase: AdminSupabase,
): Promise<AgentCapabilityState> {
  const { error } = await supabase.from("agent_reviews").select("id").limit(0);

  if (error) {
    logQueryError("probeAgentPhase5Schema", error);
  }

  return resolveDatabaseProbeCapabilityState(error);
}

export async function probeAgentDatabaseCapabilities(
  supabase: AdminSupabase,
): Promise<AgentDatabaseCapabilityProbe> {
  const [phase4, phase5] = await Promise.all([
    probePhase4Schema(supabase),
    probePhase5Schema(supabase),
  ]);

  return { phase4, phase5 };
}
