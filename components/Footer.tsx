import Link from "next/link";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import {
  footerCompanyLinks,
  footerExploreLinks,
  footerLegalLinks,
} from "@/lib/footer-links";
import { focusRing } from "@/lib/page-data";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";

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

  return (
    <footer className="border-t border-hcx-border bg-hcx-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className={`inline-block text-xl font-bold tracking-tight ${focusRing}`}
              aria-label={`${settings.siteName} home`}
            >
              <SiteNameDisplay name={settings.siteName} />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary">
              {settings.siteTagline}
            </p>
            {settings.footerDescription &&
              settings.footerDescription !== settings.siteTagline && (
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary/80">
                  {settings.footerDescription}
                </p>
              )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerExploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Company / Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerCompanyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(socialLinks.length > 0 || settings.contactEmail) && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
                Connect
              </h3>
              {socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-hcx-border text-hcx-text-secondary transition-all hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                        aria-label={social.label}
                      >
                        <Icon />
                      </a>
                    );
                  })}
                </div>
              )}
              {settings.contactEmail && (
                <p className="mt-4 text-sm text-hcx-text-secondary">
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className={`text-hcx-cyan hover:underline ${focusRing}`}
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hcx-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-hcx-text-secondary">
            &copy; {currentYear} {settings.siteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
