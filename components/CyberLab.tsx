import { cyberLabModules } from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";
import { LabCard } from "@/components/cyber-lab/LabCard";
import { FeaturedLab } from "@/components/cyber-lab/FeaturedLab";
import { LearningPaths } from "@/components/cyber-lab/LearningPaths";
import {
  CtfIcon,
  ForensicsIcon,
  LinuxIcon,
  NetworkIcon,
  SocIcon,
  WebIcon,
} from "@/components/icons";

const iconMap = {
  network: NetworkIcon,
  forensics: ForensicsIcon,
  soc: SocIcon,
  web: WebIcon,
  linux: LinuxIcon,
  ctf: CtfIcon,
};

export function CyberLab() {
  return (
    <section
      id="cyber-lab"
      className="border-b border-hcx-border bg-hcx-bg-secondary py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Learn • Test • Defend"
          title="HCX Cyber Lab"
          description="Hands-on cybersecurity labs, technical walkthroughs and practical security learning."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {cyberLabModules.map((module) => {
            const Icon = iconMap[module.icon];
            return (
              <LabCard key={module.labId} module={module} icon={Icon} />
            );
          })}
        </div>

        <FeaturedLab />
        <LearningPaths />
      </div>
    </section>
  );
}
