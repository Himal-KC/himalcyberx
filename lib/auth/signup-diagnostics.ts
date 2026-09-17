type AuthFailureLike = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

/**
 * Logs Supabase Auth failures for server-side diagnosis (Vercel logs).
 * Never log passwords, tokens, keys, or full session payloads.
 */
export function logLearnerAuthFailure(
  operation: string,
  error: AuthFailureLike,
  context?: Record<string, string | number | boolean | null | undefined>,
): void {
  console.error(`[learner-auth:${operation}]`, {
    operation,
    code: error.code ?? null,
    name: error.name ?? null,
    status: typeof error.status === "number" ? error.status : null,
    message: error.message ?? "unknown",
    ...context,
  });
}

export function safeRedirectOrigin(emailRedirectTo: string): string | null {
  try {
    return new URL(emailRedirectTo).origin;
  } catch {
    return null;
  }
}
