import type { PostgrestError } from "@supabase/supabase-js";

type QueryErrorLike = {
  code?: string;
  message: string;
};

export function isRlsError(error: QueryErrorLike): boolean {
  const message = error.message.toLowerCase();

  return (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  );
}

export function logQueryError(scope: string, error: PostgrestError): void {
  if (isRlsError(error)) {
    return;
  }

  console.error(`[supabase:${scope}]`, error.code ?? "unknown", error.message);
}
