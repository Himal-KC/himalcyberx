"use client";

import { useCallback } from "react";
import { buildAgentRunNewTopicHref } from "@/lib/agent/resume/resume-core";

/** Full document navigation so ?new=1 always re-runs server hydration (avoids push/refresh races). */
export function useNavigateToNewAgentRun() {
  return useCallback(() => {
    window.location.assign(buildAgentRunNewTopicHref());
  }, []);
}
