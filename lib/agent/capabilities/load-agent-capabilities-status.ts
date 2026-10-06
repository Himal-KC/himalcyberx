import "server-only";

import {
  buildAgentCapabilitiesStatusSnapshot,
  type AgentCapabilitiesStatusSnapshot,
} from "@/lib/agent/capabilities/capabilities-core";
import { probeAgentDatabaseCapabilities } from "@/lib/agent/capabilities/probe-agent-database";
import { hasOpenAiApiKey } from "@/lib/agent/openai/env";
import { hasNvdApiKey, hasTavilyApiKey } from "@/lib/agent/research/env";
import { createClient } from "@/lib/supabase/server";

type AdminSupabase = Awaited<ReturnType<typeof createClient>>;

export async function loadAgentCapabilitiesStatus(
  supabase?: AdminSupabase,
): Promise<AgentCapabilitiesStatusSnapshot> {
  const client = supabase ?? (await createClient());
  const database = await probeAgentDatabaseCapabilities(client);

  return buildAgentCapabilitiesStatusSnapshot({
    tavilyConfigured: hasTavilyApiKey(),
    openAiConfigured: hasOpenAiApiKey(),
    nvdConfigured: hasNvdApiKey(),
    phase4Database: database.phase4,
    phase5Database: database.phase5,
  });
}
