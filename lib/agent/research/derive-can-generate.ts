import type { ResearchQuality, ResearchSource } from "@/lib/agent/types";

export function deriveCanGenerateDraft(
  researchQuality: ResearchQuality,
  sources: ResearchSource[],
): boolean {
  if (researchQuality === "passed") {
    return true;
  }

  if (researchQuality === "failed") {
    return false;
  }

  return sources.some(
    (source) =>
      source.sourceType === "official" || source.sourceType === "primary",
  );
}
