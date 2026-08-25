import {
  EMAIL_BRAND,
  HIMALCYBERX_EMAIL_LOGO_SIZE_PX,
  HIMALCYBERX_EMAIL_LOGO_URL,
  HIMALCYBERX_EMAIL_SIGNATURE_BANNER_URL,
} from "@/lib/email/templates/email-brand";
import { escapeHtml } from "@/lib/email/templates/email-html";

export interface EmailDocumentOptions {
  title: string;
  bodyHtml: string;
  outerFooterHtml?: string;
}

export interface EmailCtaOptions {
  label: string;
  href: string;
}

export interface EmailFeaturedImageOptions {
  imageUrl: string | null | undefined;
  altText: string;
}

export interface EmailSubscriberFooterOptions {
  unsubscribeUrl?: string | null;
  recipientEmail?: string;
}

export interface EmailSignatureOptions {
  compact?: boolean;
}

function isSafeHttpsImageUrl(url: string | null | undefined): url is string {
  return Boolean(url && /^https?:\/\//i.test(url.trim()));
}

export function buildEmailDocument({
  title,
  bodyHtml,
  outerFooterHtml = "",
}: EmailDocumentOptions): string {
  const { colors, fonts } = EMAIL_BRAND;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:${colors.pageBg};color:${colors.text};font-family:${fonts.base};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${escapeHtml(title)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${colors.pageBg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:${EMAIL_BRAND.layout.maxWidth}px;background-color:${colors.cardBg};border:1px solid ${colors.cardBorder};border-radius:12px;overflow:hidden;">
            ${bodyHtml}
          </table>
          ${outerFooterHtml}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildEmailBrandHeader(options?: { compact?: boolean }): string {
  const compact = options?.compact ?? false;
  const { colors, siteName, tagline } = EMAIL_BRAND;
  const padding = compact ? "20px 28px 16px" : "28px 32px 20px";
  const logoSize = compact ? 48 : HIMALCYBERX_EMAIL_LOGO_SIZE_PX;
  const logoHtml = isSafeHttpsImageUrl(HIMALCYBERX_EMAIL_LOGO_URL)
    ? `<img src="${escapeHtml(HIMALCYBERX_EMAIL_LOGO_URL)}" alt="HimalCyberX" width="${logoSize}" height="${logoSize}" style="display:block;width:${logoSize}px;height:${logoSize}px;border:0;outline:none;text-decoration:none;" />`
    : `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="${logoSize}" height="${logoSize}" align="center" valign="middle" style="width:${logoSize}px;height:${logoSize}px;border:1px solid rgba(0,217,255,0.35);border-radius:8px;background-color:${colors.signatureBg};font-size:13px;font-weight:700;color:${colors.accent};font-family:${EMAIL_BRAND.fonts.mono};">
            HCX
          </td>
        </tr>
      </table>`;

  const logoCellWidth = logoSize + 8;

  return `<tr>
    <td style="padding:${padding};border-bottom:1px solid ${colors.divider};background-color:${colors.cardBg};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="${logoCellWidth}" valign="middle" style="padding-right:12px;">
            ${logoHtml}
          </td>
          <td valign="middle">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${colors.accent};">
              ${escapeHtml(siteName)}
            </p>
            <p style="margin:6px 0 0;font-size:12px;line-height:1.5;color:${colors.textMuted};">
              ${escapeHtml(tagline)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function buildContentTypeBadge(label: string): string {
  const { colors } = EMAIL_BRAND;

  return `<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${colors.accent};">
    ${escapeHtml(label)}
  </p>`;
}

export function buildFeaturedImageBanner({
  imageUrl,
  altText,
}: EmailFeaturedImageOptions): string {
  if (!isSafeHttpsImageUrl(imageUrl)) {
    return "";
  }

  const { layout } = EMAIL_BRAND;

  return `<tr>
    <td style="padding:0 ${layout.contentPadding.split(" ")[1]} 0;">
      <img src="${escapeHtml(imageUrl.trim())}" alt="${escapeHtml(altText)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:1px solid rgba(148,163,184,0.18);border-radius:8px;outline:none;text-decoration:none;" />
    </td>
  </tr>`;
}

export function buildEmailCtaButton({ label, href }: EmailCtaOptions): string {
  const { colors } = EMAIL_BRAND;

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="border-radius:8px;background-color:${colors.accent};">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${colors.accentDark};text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function buildEmailSignatureBanner(): string {
  if (!isSafeHttpsImageUrl(HIMALCYBERX_EMAIL_SIGNATURE_BANNER_URL)) {
    return "";
  }

  const { layout, siteName, tagline } = EMAIL_BRAND;
  const horizontalPadding = layout.contentPadding.split(" ")[1];

  return `<tr>
    <td style="padding:20px ${horizontalPadding} 0;">
      <img src="${escapeHtml(HIMALCYBERX_EMAIL_SIGNATURE_BANNER_URL.trim())}" alt="${escapeHtml(`${siteName} — ${tagline}`)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;outline:none;text-decoration:none;" />
    </td>
  </tr>`;
}

export function buildEmailSignature(
  options: EmailSignatureOptions = {},
): string {
  const compact = options.compact ?? false;
  const { colors, siteName, signatureTagline, siteUrl } = EMAIL_BRAND;
  const padding = compact ? "20px 28px" : "24px 32px";

  return `<tr>
    <td style="padding:${padding};border-top:1px solid ${colors.divider};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${colors.signatureBg};border:1px solid rgba(0,217,255,0.12);border-radius:8px;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:${colors.text};">
              ${escapeHtml(siteName)}
            </p>
            <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${colors.textMuted};">
              ${escapeHtml(EMAIL_BRAND.tagline)}
            </p>
            ${
              compact
                ? ""
                : `<p style="margin:8px 0 0;font-size:11px;line-height:1.6;color:${colors.textSubtle};">
              ${escapeHtml(signatureTagline)}
            </p>`
            }
            <p style="margin:10px 0 0;font-size:12px;line-height:1.6;">
              <a href="${escapeHtml(siteUrl)}" style="color:${colors.accent};text-decoration:underline;">
                ${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}
              </a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function buildSubscriberOuterFooter({
  unsubscribeUrl,
  recipientEmail,
}: EmailSubscriberFooterOptions): string {
  const { colors } = EMAIL_BRAND;
  const year = new Date().getFullYear();
  const unsubscribeHtml = unsubscribeUrl
    ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${colors.textMuted};text-decoration:underline;">Unsubscribe</a>`
    : "";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:${EMAIL_BRAND.layout.maxWidth}px;margin-top:20px;">
    <tr>
      <td style="font-size:12px;line-height:1.7;color:${colors.textSubtle};text-align:center;">
        <p style="margin:0;">
          You are receiving this email because you subscribed to HimalCyberX updates.
        </p>
        ${
          unsubscribeHtml
            ? `<p style="margin:10px 0 0;">${unsubscribeHtml}</p>`
            : ""
        }
        ${
          recipientEmail
            ? `<p style="margin:10px 0 0;">Sent to ${escapeHtml(recipientEmail)}</p>`
            : ""
        }
        <p style="margin:14px 0 0;">&copy; ${year} ${escapeHtml(EMAIL_BRAND.siteName)}</p>
      </td>
    </tr>
  </table>`;
}

export function buildTransactionalOuterFooter(message: string): string {
  const { colors } = EMAIL_BRAND;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:${EMAIL_BRAND.layout.maxWidth}px;margin-top:20px;">
    <tr>
      <td style="font-size:12px;line-height:1.7;color:${colors.textSubtle};text-align:center;">
        <p style="margin:0;">${escapeHtml(message)}</p>
        <p style="margin:12px 0 0;">
          <a href="${escapeHtml(EMAIL_BRAND.siteUrl)}" style="color:${colors.textMuted};text-decoration:underline;">
            ${escapeHtml(EMAIL_BRAND.siteUrl)}
          </a>
        </p>
      </td>
    </tr>
  </table>`;
}

export function buildEmailBodySection(innerHtml: string): string {
  return `<tr>
    <td style="padding:${EMAIL_BRAND.layout.contentPadding};">
      ${innerHtml}
    </td>
  </tr>`;
}

export function buildEmailHeading(
  text: string,
  level: 1 | 2 = 1,
): string {
  const fontSize = level === 1 ? "26px" : "22px";
  const marginTop = level === 1 ? "0" : "8px";

  return `<h${level} style="margin:${marginTop} 0 16px;font-size:${fontSize};line-height:1.25;font-weight:700;color:${EMAIL_BRAND.colors.text};">
    ${escapeHtml(text)}
  </h${level}>`;
}

export function buildEmailParagraph(
  text: string,
  options?: { muted?: boolean },
): string {
  const color = options?.muted
    ? EMAIL_BRAND.colors.textMuted
    : EMAIL_BRAND.colors.text;

  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${color};">
    ${escapeHtml(text)}
  </p>`;
}
