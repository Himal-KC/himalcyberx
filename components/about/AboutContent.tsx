import Link from "next/link";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";
import { focusRing } from "@/lib/page-data";

const coverageAreas = [
  {
    title: "Threat Intelligence",
    description:
      "Analysis of emerging threats, attacker activity and defensive intelligence.",
    href: "/threats",
  },
  {
    title: "Cybersecurity Research",
    description:
      "Independent security research, vulnerability context and practical analysis.",
    href: "/news",
  },
  {
    title: "Digital Forensics",
    description:
      "Investigation-focused content covering evidence handling and forensic workflows.",
    href: "/forensics",
  },
  {
    title: "Network Security",
    description:
      "Network visibility, monitoring concepts and defensive network practices.",
    href: "/cyber-lab",
  },
  {
    title: "Cyber Labs",
    description:
      "Hands-on lab environments for learning security tools and techniques safely.",
    href: "/cyber-lab",
  },
  {
    title: "Security Tutorials",
    description:
      "Step-by-step technical tutorials for practical security skill development.",
    href: "/tutorials",
  },
  {
    title: "AI Security",
    description:
      "Research and guidance on AI-related security risks, misuse and defenses.",
    href: "/ai-security",
  },
] as const;

interface AboutContentProps {
  settings: PublicSiteSettings;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
      {children}
    </h2>
  );
}

export function AboutContent({ settings }: AboutContentProps) {
  const authorName = settings.publicAuthorName;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-4">
        <SectionHeading>Who We Are</SectionHeading>
        <p className="text-base leading-relaxed text-hcx-text-secondary">
          {settings.siteName} is an independent cybersecurity research and
          learning platform focused on making security knowledge practical,
          understandable and useful.
        </p>
      </div>

      <section className="mt-14">
        <SectionHeading>What We Cover</SectionHeading>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coverageAreas.map((area) => (
            <article
              key={area.title}
              className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6"
            >
              <h3 className="text-lg font-semibold text-hcx-text">
                {area.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                {area.description}
              </p>
              <Link
                href={area.href}
                className={`mt-4 inline-flex text-sm font-medium text-hcx-cyan hover:underline ${focusRing}`}
              >
                Explore
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 max-w-3xl">
        <SectionHeading>Our Approach</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary">
          {settings.siteName} combines security research, threat analysis,
          practical labs, technical tutorials and defensive security education.
          Content is designed to help learners, defenders and security
          practitioners build practical skills while maintaining an ethical,
          authorized approach to cybersecurity practice.
        </p>
      </section>

      <section className="mt-14 rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <SectionHeading>Research &amp; Analysis</SectionHeading>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-hcx-text-secondary">
          {settings.siteName} publishes independent analysis covering emerging
          threats, vulnerabilities, attacker techniques and defensive security
          practices. Research is presented for education, awareness and
          defensive improvement.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/news"
            className={`inline-flex items-center justify-center rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
          >
            Explore Articles
          </Link>
          <Link
            href="/cyber-lab"
            className={`inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-bg-secondary px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
          >
            Explore Cyber Labs
          </Link>
          <Link
            href="/tutorials"
            className={`inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-bg-secondary px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
          >
            Browse Tutorials
          </Link>
        </div>
      </section>

      <section className="mt-14 max-w-3xl">
        <SectionHeading>About the Researcher</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary">
          {authorName} contributes to {settings.siteName} with a focus on
          cybersecurity research, digital forensics, threat intelligence and
          practical security learning. The platform emphasizes clear technical
          communication and responsible security practice.
        </p>
      </section>

      <section className="mt-14 max-w-3xl rounded-xl border border-hcx-orange/20 bg-hcx-card p-6 sm:p-8">
        <SectionHeading>Ethical Security</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary">
          Labs, tutorials and technical content on {settings.siteName} are
          intended for education, defensive security, authorized testing and
          controlled lab environments.
        </p>
        <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary">
          Only test systems you own or have explicit permission to assess.
          Unauthorized access, disruption or misuse of security techniques is
          not supported or encouraged.
        </p>
      </section>
    </div>
  );
}
