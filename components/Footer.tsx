import { footerLinks } from "@/lib/sample-data";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";

const socialLinks = [
  { label: "GitHub", href: "#", icon: GitHubIcon },
  { label: "LinkedIn", href: "#", icon: LinkedInIcon },
  { label: "X", href: "#", icon: XIcon },
];

export function Footer() {
  return (
    <footer className="bg-hcx-bg-secondary py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a
              href="#"
              className="text-xl font-bold tracking-tight"
              aria-label="HimalCyberX home"
            >
              <span className="text-hcx-text">Himal</span>
              <span className="text-hcx-cyan">CyberX</span>
            </a>
            <p className="mt-3 text-sm text-hcx-text-secondary">
              Decode Threats. Defend the Future.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-hcx-border text-hcx-text-secondary transition-all hover:border-hcx-cyan/30 hover:text-hcx-cyan"
                    aria-label={social.label}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Cyber Lab
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.cyberLab.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hcx-text">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-hcx-border pt-8">
          <p className="text-sm text-hcx-text-secondary">
            &copy; 2026 HimalCyberX
          </p>
        </div>
      </div>
    </footer>
  );
}
