export interface Ga4ServiceAccountCredentials {
  type: "service_account";
  project_id: string;
  private_key: string;
  client_email: string;
}

export type ParseGa4ServiceAccountResult =
  | { ok: true; credentials: Ga4ServiceAccountCredentials }
  | { ok: false; error: string };

const REQUIRED_STRING_FIELDS = [
  "type",
  "project_id",
  "private_key",
  "client_email",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse service-account JSON without logging secret fields. */
export function parseGa4ServiceAccountJson(
  raw: string | undefined | null,
): ParseGa4ServiceAccountResult {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return { ok: false, error: "Service account JSON is not configured." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Service account JSON is not valid JSON." };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: "Service account JSON must be an object." };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = parsed[field];
    if (typeof value !== "string" || value.trim() === "") {
      return {
        ok: false,
        error: `Service account JSON is missing required field: ${field}.`,
      };
    }
  }

  if (parsed.type !== "service_account") {
    return {
      ok: false,
      error: 'Service account JSON must have type "service_account".',
    };
  }

  return {
    ok: true,
    credentials: {
      type: "service_account",
      project_id: parsed.project_id as string,
      private_key: parsed.private_key as string,
      client_email: parsed.client_email as string,
    },
  };
}

export function resolveGa4PropertyId(
  raw: string | undefined | null,
): { ok: true; propertyId: string } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return { ok: false, error: "GA4 property ID is not configured." };
  }

  let normalized = raw.trim();
  if (normalized.startsWith("properties/")) {
    normalized = normalized.slice("properties/".length);
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      ok: false,
      error: "GA4 property ID must be a numeric property identifier.",
    };
  }

  return { ok: true, propertyId: normalized };
}

export function resolveGa4AdminConfig(input: {
  propertyIdRaw: string | undefined | null;
  serviceAccountJsonRaw: string | undefined | null;
}):
  | {
      ok: true;
      propertyId: string;
      credentials: Ga4ServiceAccountCredentials;
    }
  | { ok: false; error: string } {
  const property = resolveGa4PropertyId(input.propertyIdRaw);
  if (!property.ok) {
    return property;
  }

  const account = parseGa4ServiceAccountJson(input.serviceAccountJsonRaw);
  if (!account.ok) {
    return account;
  }

  return {
    ok: true,
    propertyId: property.propertyId,
    credentials: account.credentials,
  };
}
