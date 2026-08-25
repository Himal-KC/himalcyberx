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
      "Content should help readers understand real threats and apply defensive techniques in technical environments.",
  },
  {
    title: "Evidence-Based",
    description:
      "Claims are grounded in credible public sources, technical documentation and verifiable information where possible.",
  },
  {
    title: "Defensive",
    description:
      "Research and education should support authorized testing, risk reduction and responsible security practice.",
  },
  {
    title: "Accessible",
    description:
      "Complex topics are explained clearly without removing the technical detail readers need to learn effectively.",
  },
] as const;

const researchStandards = [
  "Primary and reputable sources are prioritised, including official vendor advisories, government cybersecurity agencies, NIST and NVD references, security research organisations and technical documentation.",
  "Verified facts are distinguished from analysis, commentary and informed opinion.",
  "Speculation is not presented as confirmed evidence.",
  "Articles may be updated when significant technical facts, exploitation status or mitigation guidance changes.",
  "Primary references are linked where practical so readers can review source material.",
  "Labs and tutorials are framed for authorised, educational and controlled environments.",
] as const;

const correctionTriggers = [
  "a vendor publishes new advisory or remediation information;",
  "exploitation status or threat activity changes materially;",
  "patches, mitigations or defensive guidance are updated; or",
  "a factual error is identified and confirmed.",
] as const;

const trustLinks = [
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
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

function TrustLinks() {
  return (
    <nav aria-label="Trust and policy links" className="mt-6">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-hcx-text-secondary">
        {trustLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`transition-colors hover:text-hcx-cyan ${focusRing}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AboutContent({ settings }: AboutContentProps) {
  const socialLinks = buildSocialLinks(settings);

  return (
    <>
      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="The Platform"
            title="What is HimalCyberX?"
            compact
          />
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-hcx-text-secondary">
            <p>
              {settings.siteName} is an independent cybersecurity research and
              learning platform. It brings together practical security education,
              threat research and hands-on technical content in one place.
            </p>
            <p>
              The platform covers threat intelligence, vulnerability research,
              digital forensics, cyber labs, tutorials, AI security and defensive
              security education. Content is designed to help readers understand
              real-world threats, evaluate risk and develop practical defensive
              skills through clear, structured material.
            </p>
            <p>
              {settings.siteName} is intended for students, security learners,
              IT professionals and anyone building a stronger understanding of
              modern cybersecurity—without marketing hype or exaggerated claims.
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
          <SectionHeading
            label="Editorial Approach"
            title="Content Principles"
            description="How HimalCyberX approaches research, education and published material."
            compact
          />

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
          <SectionHeading
            label="Editorial Identity"
            title="Who Creates the Content"
            compact
          />

          <div className="max-w-3xl">
            <p className="text-base leading-relaxed text-hcx-text-secondary">
              {settings.publicAuthorName} researches, writes and curates content
              for {settings.siteName}, including articles, threat intelligence
              summaries, cyber labs and tutorials. The platform is independently
              maintained with a focus on practical, defensive cybersecurity
              education.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-hcx-text-secondary">
              Editorial work prioritises clarity, technical accuracy and
              responsible presentation of security information. Public contact
              details are not displayed here; use the{" "}
              <Link
                href="/contact"
                className={`text-hcx-cyan hover:underline ${focusRing}`}
              >
                Contact page
              </Link>{" "}
              for enquiries or correction requests.
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

      <section className="border-b border-hcx-border bg-hcx-bg-secondary/40 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Editorial Standards"
            title="How We Research and Publish"
            description="HimalCyberX aims to publish useful, defensible cybersecurity information with clear sourcing and responsible framing."
            compact
          />

          <ul className="max-w-3xl space-y-3 text-sm leading-relaxed text-hcx-text-secondary">
            {researchStandards.map((point) => (
              <li key={point} className="flex gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hcx-cyan"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <TrustLinks />
        </div>
      </section>

      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Corrections & Updates" compact />

          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-hcx-text-secondary">
            <p>
              Cybersecurity information changes quickly. Articles, labs and
              tutorials on {settings.siteName} may be corrected or updated when
              significant technical facts change or when new reliable
              information becomes available.
            </p>
            <p>Updates may be made when, for example:</p>
            <ul className="list-disc space-y-2 pl-5">
              {correctionTriggers.map((trigger) => (
                <li key={trigger}>{trigger}</li>
              ))}
            </ul>
            <p>
              If you believe published content contains a factual error, please
              reach out through the{" "}
              <Link
                href="/contact"
                className={`text-hcx-cyan hover:underline ${focusRing}`}
              >
                Contact page
              </Link>{" "}
              with relevant references where possible.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-hcx-border bg-hcx-bg-secondary/40 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Responsible Use"
            title="Ethical Security Research"
            compact
          />

          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-hcx-text-secondary">
            <p>
              {settings.siteName} supports ethical and responsible security
              research. Labs, tutorials and technical guidance are intended for
              systems you own, systems where you have explicit authorization to
              test, or dedicated training environments.
            </p>
            <p>
              The site does not encourage unauthorized access, malicious
              activity or misuse of security techniques. For more detail, see the{" "}
              <Link
                href="/disclaimer"
                className={`text-hcx-cyan hover:underline ${focusRing}`}
              >
                Disclaimer
              </Link>
              .
            </p>
          </div>
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
