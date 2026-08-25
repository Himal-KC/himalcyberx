import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";

export const HIMALCYBERX_EMAIL_LOGO_URL =
  "https://himalcyberx.com/brand/hcx-email-logo.png";

export const HIMALCYBERX_EMAIL_SIGNATURE_BANNER_URL =
  "https://himalcyberx.com/brand/himalcyberx-email-signature.png";

export const HIMALCYBERX_EMAIL_LOGO_SIZE_PX = 60;

export const EMAIL_BRAND = {
  siteName: "HimalCyberX",
  tagline: "Cybersecurity Research & Learning",
  signatureTagline: "Threat Intelligence • Tutorials • Cyber Labs",
  siteUrl: HIMALCYBERX_SITE_URL,
  colors: {
    pageBg: "#070b14",
    cardBg: "#111a2c",
    cardBorder: "rgba(148,163,184,0.18)",
    divider: "rgba(148,163,184,0.12)",
    text: "#f4f7fb",
    textMuted: "#94a3b8",
    textSubtle: "#64748b",
    accent: "#00d9ff",
    accentDark: "#070b14",
    success: "#00e89d",
    signatureBg: "#0d1424",
  },
  fonts: {
    base: "Arial,Helvetica,sans-serif",
    mono: "Consolas,Monaco,'Courier New',monospace",
  },
  layout: {
    maxWidth: 600,
    contentPadding: "28px 32px",
  },
} as const;
