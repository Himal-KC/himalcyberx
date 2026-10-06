"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { buildAgentRunNewTopicHref } from "@/lib/agent/resume/resume-core";

/** Same navigation contract as resume-run switching: push URL then refresh RSC. */
export function useNavigateToNewAgentRun() {
  const router = useRouter();

  return useCallback(() => {
    const href = buildAgentRunNewTopicHref();
    router.push(href);
    router.refresh();
  }, [router]);
}
