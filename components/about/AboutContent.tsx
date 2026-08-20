import Link from "next/link";
import { ArrowRightIcon, GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import { SectionHeading } from "@/components/SectionHeading";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";
import { focusRing } from "@/lib/page-data";

const coverageAreas = [
  {
    title: "Threat Intelligence",
    description:
      "Ransomware, phishing, malware, threat actors and emerging cyber threats.",
    href: "/threats",
  },
  {
    title: "Vulnerability Research",
    description:
      "CVEs, exploitation risk, patching priorities and defensive remediation.",
    href: "/vulnerabilities",
  },
  {
    title: "Digital Forensics & DFIR",
    description:
      "Digital evidence, forensic analysis and incident-response techniques.",
    href: "/forensics",
  },
  {
    title: "Cyber Labs",
    description:
      "Hands-on exercises for building practical cybersecurity skills.",
    href: "/cyber-lab",
  },
  {
    title: "Tutorials",
    description:
      "Step-by-step technical security guides and walkthroughs.",
    href: "/tutorials",
  },
  {
    title: "AI Security",
    description:
      "LLM security, AI-assisted threats, prompt injection, deepfakes and defensive AI.",
    href: "/ai-security",
  },
] as const;

const principles = [
  {
    title: "Practical",
    description:
      "Focus on knowledge that can be applied in real technical environments.",
  },
  {
    title: "Evidence-Based",
    description:
      "Research should rely on credible public sources, technical documentation and verifiable information.",
  },
  {
    title: "Defensive",
    description:
      "Security education should promote authorized, ethical and responsible practice.",
  },
  {
    title: "Accessible",
    description:
      "Complex cybersecurity topics should be explained clearly without removing important technical detail.",
  },
] as const;

const editorialPoints = [
  "Public and reputable sources are preferred when researching and publishing content.",
  "Technical claims should be verifiable and grounded in credible documentation.",
  "Content may be updated as threats, vulnerabilities and technologies change.",
  "Labs and tutorials are intended for authorized, educational and controlled environments.",
] as const;

interface AboutContentProps {
  settings: PublicSiteSettings;
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

export function AboutContent({ settings }: AboutContentProps) {
  const socialLinks = buildSocialLinks(settings);

  return (
    <>
      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="The Platform"
            title="About HimalCyberX"
            compact
          />
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-hcx-text-secondary">
            <p>
              HimalCyberX brings together cybersecurity research, practical
              tutorials and hands-on labs in one place. The platform focuses on
              understanding real security threats, learning defensive techniques
              and developing practical technical skills through clear, structured
              content.
            </p>
            <p>
              Content is designed for students, security learners, IT
              professionals and anyone interested in developing a stronger
              understanding of modern cybersecurity.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Coverage"
            title="What HimalCyberX Covers"
            description="Core areas of research, learning and practical security content across the platform."
            compact
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coverageAreas.map((area) => (
              <Link
                key={area.title}
                href={area.href}
                className={`group flex h-full flex-col rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25 sm:p-6 ${focusRing}`}
              >
                <h3 className="text-base font-semibold text-hcx-text transition-colors group-hover:text-hcx-cyan">
                  {area.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
                  {area.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan">
                  Explore
                  <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hcx-border bg-hcx-bg-secondary/40 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Mission" title="Our Approach" compact />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-cyan">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Behind HimalCyberX" compact />

          <div className="max-w-3xl">
            <p className="text-base leading-relaxed text-hcx-text-secondary">
              {settings.siteName} is developed and maintained by{" "}
              {settings.publicAuthorName}, with a focus on cybersecurity
              research, digital forensics, practical security labs and technical
              learning.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/news"
                className={`inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Explore Articles
              </Link>
              <Link
                href="/cyber-lab"
                className={`inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Cyber Lab
              </Link>
              <Link
                href="/tutorials"
                className={`inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Tutorials
              </Link>
            </div>

            {socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-4 py-2 text-sm font-medium text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                    >
                      <Icon />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Editorial Standards"
            title="Research & Editorial Principles"
            compact
          />

          <ul className="max-w-3xl space-y-3 text-sm leading-relaxed text-hcx-text-secondary">
            {editorialPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hcx-cyan"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-hcx-border bg-hcx-card/60 p-6 sm:p-8">
            <SectionHeading
              title="Explore HimalCyberX"
              description="Browse published research, hands-on labs and practical security tutorials."
              compact
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/news"
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
              >
                Read Latest Research
                <ArrowRightIcon />
              </Link>
              <Link
                href="/cyber-lab"
                className={`inline-flex items-center justify-center gap-2 rounded-lg border border-hcx-border bg-hcx-bg-secondary px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Explore Cyber Labs
                <ArrowRightIcon />
              </Link>
              <Link
                href="/tutorials"
                className={`inline-flex items-center justify-center gap-2 rounded-lg border border-hcx-border bg-hcx-bg-secondary px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Browse Tutorials
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
