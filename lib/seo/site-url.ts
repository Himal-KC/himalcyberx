/**
 * Canonical site URL for sitemaps, robots, and Open Graph metadata.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://himalcyberx.com).
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
