import Link from "next/link";
import { CookiePreferencesLink } from "@/components/consent/CookiePreferencesLink";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import {
  footerCompanyLinks,
  footerExploreLinks,
  footerLegalLinks,
} from "@/lib/footer-links";
import { focusRing } from "@/lib/page-data";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";

const footerLinkClass = `inline-flex min-h-11 items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`;

function SiteNameDisplay({ name }: { name: string }) {
  if (name === "HimalCyberX") {
    return (
      <>
        <span className="text-hcx-text">Himal</span>
        <span className="text-hcx-cyan">CyberX</span>
      </>
    );
  }

  const cyberIndex = name.indexOf("Cyber");
  if (cyberIndex > 0) {
    return (
      <>
        <span className="text-hcx-text">{name.slice(0, cyberIndex)}</span>
        <span className="text-hcx-cyan">{name.slice(cyberIndex)}</span>
      </>
    );
  }

  return <span className="text-hcx-text">{name}</span>;
}

function buildSocialLinks(settings: PublicSiteSettings) {
  const links: Array<{
    label: string;
    href: string;
    icon: typeof GitHubIcon;
  }> = [];

  if (settings.githubUrl) {
    links.push({
      label: "GitHub",
      href: settings.githubUrl,
      icon: GitHubIcon,
    });
  }

  if (settings.linkedinUrl) {
    links.push({
      label: "LinkedIn",
      href: settings.linkedinUrl,
      icon: LinkedInIcon,
    });
  }

  if (settings.xUrl) {
    links.push({ label: "X", href: settings.xUrl, icon: XIcon });
  }

  return links;
}

function resolveSettings(settings?: PublicSiteSettings): PublicSiteSettings {
  return (
    settings ?? {
      siteName: DEFAULT_SITE_SETTINGS.siteName,
      siteTagline: DEFAULT_SITE_SETTINGS.siteTagline,
      publicAuthorName: DEFAULT_SITE_SETTINGS.publicAuthorName,
      contactEmail: DEFAULT_SITE_SETTINGS.contactEmail,
      footerDescription: DEFAULT_SITE_SETTINGS.footerDescription,
      githubUrl: DEFAULT_SITE_SETTINGS.githubUrl,
      linkedinUrl: DEFAULT_SITE_SETTINGS.linkedinUrl,
      xUrl: DEFAULT_SITE_SETTINGS.xUrl,
      seoTitle: DEFAULT_SITE_SETTINGS.seoTitle,
      seoDescription: DEFAULT_SITE_SETTINGS.seoDescription,
      seoKeywords: DEFAULT_SITE_SETTINGS.seoKeywords,
      locationDisplay: DEFAULT_SITE_SETTINGS.locationDisplay,
    }
  );
}

interface FooterProps {
  settings?: PublicSiteSettings;
}

export function Footer({ settings: settingsProp }: FooterProps) {
  const settings = resolveSettings(settingsProp);
  const socialLinks = buildSocialLinks(settings);
  const currentYear = new Date().getFullYear();
  const showFooterDescription =
    settings.footerDescription &&
    settings.footerDescription !== settings.siteTagline;

  return (
    <footer className="border-t border-hcx-border bg-hcx-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))] lg:gap-x-10 lg:gap-y-0">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className={`inline-flex min-h-11 items-center text-xl font-bold tracking-tight ${focusRing}`}
              aria-label={`${settings.siteName} home`}
            >
              <SiteNameDisplay name={settings.siteName} />
            </Link>
            <p className="mt-2 text-sm font-medium text-hcx-text-secondary">
              {settings.siteTagline}
            </p>
            {showFooterDescription ? (
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-hcx-text-secondary/85">
                {settings.footerDescription}
              </p>
            ) : null}
          </div>

          <nav aria-label="Explore">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Explore
            </h3>
            <ul className="mt-3 space-y-0.5">
              {footerExploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company and platform">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Company / Platform
            </h3>
            <ul className="mt-3 space-y-0.5">
              {footerCompanyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Connect
            </h3>

            {socialLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border border-hcx-border text-hcx-text-secondary transition-all hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                      aria-label={social.label}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            ) : null}

            {settings.contactEmail ? (
              <p className="mt-3 text-sm text-hcx-text-secondary">
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className={`break-all text-hcx-cyan hover:underline ${focusRing}`}
                >
                  {settings.contactEmail}
                </a>
              </p>
            ) : null}

            <p className="mt-3">
              <Link
                href="/contact"
                className={`inline-flex min-h-11 items-center text-sm font-medium text-hcx-cyan transition-colors hover:underline ${focusRing}`}
              >
                Contact Us →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-hcx-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-hcx-text-secondary">
            &copy; {currentYear} {settings.siteName}. All rights reserved.
          </p>
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
          >
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-11 items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
              >
                {link.label}
              </Link>
            ))}
            <CookiePreferencesLink />
          </nav>
        </div>
      </div>
    </footer>
  );
}
