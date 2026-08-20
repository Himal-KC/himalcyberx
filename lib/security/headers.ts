type Header = { key: string; value: string };

const GOOGLE_ANALYTICS_SCRIPT_ORIGINS = [
  "https://www.googletagmanager.com",
] as const;

const GOOGLE_ANALYTICS_CONNECT_ORIGINS = [
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
  "https://analytics.google.com",
  "https://www.googletagmanager.com",
] as const;

const GOOGLE_ANALYTICS_IMAGE_ORIGINS = [
  "https://www.google-analytics.com",
  "https://www.googletagmanager.com",
] as const;

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function getSupabaseOrigin(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
}

function joinDirective(name: string, values: string[]): string {
  return `${name} ${values.join(" ")}`;
}

/**
 * Report-Only CSP for gradual rollout.
 *
 * Notes on required relaxations:
 * - style-src 'unsafe-inline': React components use inline style objects throughout
 *   the UI (gradients, grid patterns, hero visuals). Tailwind is compiled to static
 *   CSS, but inline styles remain necessary without a nonce pipeline.
 * - script-src 'unsafe-inline': Next.js App Router injects small inline bootstrap
 *   scripts for hydration/RSC. GA4 is loaded from googletagmanager.com via
 *   @next/third-parties. unsafe-eval is intentionally omitted for production.
 */
export function buildContentSecurityPolicyReportOnly(): string {
  const supabaseOrigin = getSupabaseOrigin();

  const scriptSrc = ["'self'", "'unsafe-inline'", ...GOOGLE_ANALYTICS_SCRIPT_ORIGINS];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    ...GOOGLE_ANALYTICS_IMAGE_ORIGINS,
    ...(supabaseOrigin ? [supabaseOrigin] : []),
  ];
  const fontSrc = ["'self'"];
  const connectSrc = [
    "'self'",
    ...GOOGLE_ANALYTICS_CONNECT_ORIGINS,
    ...(supabaseOrigin ? [supabaseOrigin] : []),
  ];

  const directives = [
    joinDirective("default-src", ["'self'"]),
    joinDirective("base-uri", ["'self'"]),
    joinDirective("form-action", ["'self'"]),
    joinDirective("frame-ancestors", ["'none'"]),
    joinDirective("object-src", ["'none'"]),
    joinDirective("script-src", scriptSrc),
    joinDirective("style-src", styleSrc),
    joinDirective("img-src", imgSrc),
    joinDirective("font-src", fontSrc),
    joinDirective("connect-src", connectSrc),
    joinDirective("frame-src", ["'none'"]),
    joinDirective("worker-src", ["'self'"]),
    joinDirective("manifest-src", ["'self'"]),
  ];

  if (isVercelProduction()) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function buildPermissionsPolicy(): string {
  return [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "bluetooth=()",
    "display-capture=()",
    "interest-cohort=()",
  ].join(", ");
}

export function buildSecurityHeaders(): Header[] {
  const headers: Header[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: buildPermissionsPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicyReportOnly(),
    },
  ];

  if (isVercelProduction()) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

export function getSupabaseImageRemotePatterns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return [];
  }

  try {
    const { hostname, protocol } = new URL(supabaseUrl);

    if (protocol !== "https:" && protocol !== "http:") {
      return [];
    }

    return [
      {
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}
