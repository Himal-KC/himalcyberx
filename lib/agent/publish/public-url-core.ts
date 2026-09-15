import type { AgentContentType } from "../../supabase/types";

export function buildAgentContentPublicUrl(
  contentType: AgentContentType,
  slug: string,
): string {
  switch (contentType) {
    case "article":
      return `/articles/${slug}`;
    case "tutorial":
      return `/tutorials/${slug}`;
    case "lab":
      return `/cyber-lab/${slug}`;
  }
}

export function buildAgentContentTypeLabel(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}
