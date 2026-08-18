import Link from "next/link";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import { focusRing } from "@/lib/page-data";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";

const topics = [
  "Cybersecurity Research",
  "Threat Intelligence",
  "Digital Forensics",
  "Cyber Labs",
  "Website Feedback",
] as const;

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

interface ContactInfoPanelProps {
  settings: PublicSiteSettings;
}

export function ContactInfoPanel({ settings }: ContactInfoPanelProps) {
  const siteName = settings.siteName || DEFAULT_SITE_SETTINGS.siteName;
  const siteTagline = settings.siteTagline || DEFAULT_SITE_SETTINGS.siteTagline;
  const contactEmail = settings.contactEmail.trim();
  const locationDisplay = settings.locationDisplay.trim();
  const socialLinks = buildSocialLinks(settings);

  return (
    <aside className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <p className="text-xl font-bold text-hcx-text">{siteName}</p>
      <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
        {siteTagline}
      </p>

      {(contactEmail || locationDisplay) && (
        <div className="mt-8 space-y-3">
          {contactEmail && (
            <p className="text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text">Email: </span>
              <a
                href={`mailto:${contactEmail}`}
                className={`text-hcx-cyan hover:underline ${focusRing}`}
              >
                {contactEmail}
              </a>
            </p>
          )}
          {locationDisplay && (
            <p className="text-sm text-hcx-text-secondary">
              <span className="font-medium text-hcx-text">Location: </span>
              {locationDisplay}
            </p>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Topics
        </h2>
        <ul className="mt-4 space-y-2.5">
          {topics.map((topic) => (
            <li
              key={topic}
              className="flex items-center gap-2 text-sm text-hcx-text-secondary"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-hcx-cyan"
                aria-hidden="true"
              />
              {topic}
            </li>
          ))}
        </ul>
      </div>

      {socialLinks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Connect
          </h2>
          <div className="mt-4 flex items-center gap-3">
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
        </div>
      )}

      <p className="mt-8 text-sm leading-relaxed text-hcx-text-secondary">
        For privacy-related requests, see our{" "}
        <Link
          href="/privacy"
          className={`text-hcx-cyan hover:underline ${focusRing}`}
        >
          Privacy Policy
        </Link>
        .
      </p>
    </aside>
  );
}
