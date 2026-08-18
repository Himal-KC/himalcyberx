export type ArticlePattern = "network" | "grid" | "circuit" | "featured";

export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface ArticleTechnicalDetails {
  threatType: string;
  affectedTechnology: string;
  severity: string;
  attackVector: string;
  mitigationStatus: string;
}

export interface ArticleHcxAnalysis {
  whyItMatters: string;
  whatToWatch: string;
  defensiveFocus: string;
}

export type ArticleContentType = "real" | "demo";

export type ArticleLabel =
  | "HCX ANALYSIS"
  | "THREAT INTELLIGENCE"
  | "SECURITY RESEARCH"
  | "GUIDE"
  | "TUTORIAL";

export interface ArticleSource {
  name?: string;
  title: string;
  url: string;
  publisher: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryHref: string;
  author: string;
  publishedAt: string;
  publishedAtIso: string;
  readTime: string;
  tags: string[];
  contentType: ArticleContentType;
  label?: ArticleLabel;
  featured: boolean;
  pattern: ArticlePattern;
  sections: ArticleSection[];
  keyTakeaways: string[];
  hcxAnalysis: ArticleHcxAnalysis;
  technicalDetails?: ArticleTechnicalDetails;
  sources?: ArticleSource[];
}

export function articlePath(slug: string): string {
  return `/articles/${slug}`;
}

export function formatArticleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function section(
  id: string,
  title: string,
  paragraphs: string[],
): ArticleSection {
  return { id, title, paragraphs };
}

const articles: Article[] = [
  {
    id: "art-001",
    slug: "ransomware-groups-shift-toward-identity-based-attacks",
    title: "Ransomware Groups Shift Toward Identity-Based Attacks",
    excerpt:
      "Threat actors are increasingly targeting credentials, cloud identities and remote access systems instead of relying only on traditional malware.",
    category: "Threat Intelligence",
    categoryHref: "/threats",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "6 min read",
    tags: ["Ransomware", "Identity", "Credentials", "Threat Intelligence"],
    contentType: "demo",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "Ransomware operators are refining their intrusion models to prioritize identity compromise over noisy endpoint malware deployment. This shift reflects a broader industry trend toward stealthier initial access and faster path-to-impact within enterprise environments.",
        "HimalCyberX analysis indicates that credential theft, session hijacking and abuse of remote management tooling now appear consistently across multiple ransomware families observed in demonstration research datasets.",
      ]),
      section("what-happened", "What Happened?", [
        "Across multiple demonstration case studies, attackers gained footholds through phishing, stolen credentials and compromised remote access accounts before deploying encryption tooling. In several modeled scenarios, lateral movement relied on native administration utilities rather than custom malware.",
        "Extortion workflows increasingly include data theft and public leak threats prior to encryption, amplifying pressure on victim organizations during negotiation phases.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Identity-centric attacks reduce reliance on detectable malware payloads and can bypass traditional perimeter defenses when credentials are valid. Security teams must treat identity systems as critical infrastructure rather than auxiliary controls.",
        "Organizations with weak MFA coverage, stale privileged access reviews and limited session monitoring face disproportionate exposure in this threat model.",
      ]),
      section("how-it-works", "How the Threat Works", [
        "A typical demonstration sequence begins with credential harvesting or purchase, followed by authentication to VPN or remote management portals. Attackers then enumerate admin roles, deploy backup removal tooling and stage data for exfiltration before triggering encryption.",
      ]),
      section("who-affected", "Who May Be Affected?", [
        "Enterprises with distributed workforces, hybrid cloud identity providers and legacy remote access infrastructure are commonly represented in demonstration scenarios. Healthcare, manufacturing and professional services sectors appear frequently in sample datasets.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Enforce phishing-resistant MFA for privileged and remote access accounts. Review conditional access policies and monitor for impossible-travel and session-anomaly signals.",
        "Reduce standing admin privileges, segment remote management tools and maintain tested incident response playbooks focused on identity containment.",
      ]),
    ],
    keyTakeaways: [
      "Identity attacks are increasing across demonstration ransomware datasets.",
      "Credentials remain a major attack target for initial access.",
      "MFA alone may not stop session theft without continuous monitoring.",
      "Organizations should monitor identity activity and privileged sessions.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "Identity compromise compresses attacker timelines and reduces malware-dependent detection opportunities.",
      whatToWatch:
        "Unusual VPN logins, new device registrations and privilege escalation chains in identity provider logs.",
      defensiveFocus:
        "Prioritize identity threat detection, privileged access governance and rapid credential revocation workflows.",
    },
    technicalDetails: {
      threatType: "Ransomware / Identity Compromise",
      affectedTechnology: "Enterprise Identity & Remote Access",
      severity: "High",
      attackVector: "Credential Abuse",
      mitigationStatus: "Monitoring Recommended",
    },
  },
  {
    id: "art-002",
    slug: "why-zero-day-response-speed-matters-more-than-ever",
    title: "Why Zero-Day Response Speed Matters More Than Ever",
    excerpt:
      "Security teams face growing pressure to identify exposure, prioritize patches and reduce the time attackers have to exploit critical flaws.",
    category: "Vulnerabilities",
    categoryHref: "/vulnerabilities",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "5 min read",
    tags: ["Vulnerabilities", "Zero-Day", "Patching", "Risk Management"],
    contentType: "demo",
    featured: false,
    pattern: "grid",
    sections: [
      section("overview", "Overview", [
        "The window between vulnerability disclosure and widespread exploitation continues to shrink. Security organizations must balance emergency patching with operational stability while maintaining accurate asset visibility.",
      ]),
      section("what-happened", "What Happened?", [
        "Demonstration datasets show fictional critical flaws moving from advisory publication to active scanning activity within hours. Teams without accurate asset inventories struggle to determine exposure scope quickly.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Delayed remediation increases likelihood of compromise, regulatory scrutiny and business disruption. Response speed is now a core measure of security program maturity.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Maintain continuously updated asset inventories, virtual patching where available and severity-based response SLAs aligned to business risk.",
      ]),
    ],
    keyTakeaways: [
      "Exposure visibility is foundational to zero-day response.",
      "Patch prioritization should reflect asset criticality and exploitability.",
      "Compensating controls can bridge gaps during emergency change windows.",
      "Tabletop exercises improve coordination across IT and security teams.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "Attackers operationalize new flaws faster than many organizations can assess exposure.",
      whatToWatch:
        "Vendor advisories, proof-of-concept releases and internet-wide scanning spikes in demonstration telemetry.",
      defensiveFocus:
        "Invest in vulnerability management workflows that emphasize speed, accuracy and executive communication.",
    },
    technicalDetails: {
      threatType: "Vulnerability Exploitation",
      affectedTechnology: "Enterprise Software Stack",
      severity: "Critical",
      attackVector: "Remote Code Execution",
      mitigationStatus: "Patch Review Required",
    },
  },
  {
    id: "art-003",
    slug: "ai-is-changing-cyber-attacks-and-defense",
    title: "AI Is Changing Both Cyber Attacks and Cyber Defense",
    excerpt:
      "Generative AI is giving attackers new capabilities while also helping defenders detect threats, investigate incidents and automate response.",
    category: "AI Security",
    categoryHref: "/ai-security",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "7 min read",
    tags: ["AI Security", "Generative AI", "Defense", "Automation"],
    contentType: "demo",
    featured: false,
    pattern: "circuit",
    sections: [
      section("overview", "Overview", [
        "Artificial intelligence is reshaping both offensive tradecraft and defensive operations. Demonstration research explores how generative models influence social engineering scale and how security teams adopt AI-assisted triage responsibly.",
      ]),
      section("what-happened", "What Happened?", [
        "Sample threat models include AI-assisted phishing content generation and automated reconnaissance summarization. Defensive demonstrations show AI used for alert enrichment and investigation note drafting under analyst supervision.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "AI lowers barriers for content generation while raising expectations for detection fidelity. Security leaders must govern AI adoption with clear policies and human oversight.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Establish AI usage policies, validate model outputs in security workflows and monitor for data leakage in internal AI tooling.",
      ]),
    ],
    keyTakeaways: [
      "AI can accelerate both attacks and defensive analysis.",
      "Human review remains essential for high-risk security decisions.",
      "Governance frameworks should address internal and external AI risks.",
      "Security awareness must evolve for AI-generated deception.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "AI adoption changes the speed and scale of both threats and defensive workflows.",
      whatToWatch:
        "AI-generated lures, model abuse in phishing kits and unsanctioned internal AI tool usage.",
      defensiveFocus:
        "Blend automation with analyst oversight and invest in AI literacy across security teams.",
    },
  },
  {
    id: "art-004",
    slug: "security-teams-face-faster-complex-threat-landscape",
    title: "Security Teams Face a Faster and More Complex Threat Landscape",
    excerpt:
      "Cloud adoption, identity-based attacks, ransomware operations and AI-assisted threats are creating new challenges for defenders.",
    category: "Cybersecurity News",
    categoryHref: "/news",
    author: "HimalCyberX",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "8 min read",
    tags: ["Threat Landscape", "Cloud Security", "Ransomware", "AI"],
    contentType: "demo",
    featured: true,
    pattern: "featured",
    sections: [
      section("overview", "Overview", [
        "Security programs are navigating simultaneous pressures: cloud transformation, identity-centric intrusions, ransomware extortion models and emerging AI-enabled tradecraft. Demonstration analysis synthesizes these trends into a unified defensive outlook.",
      ]),
      section("what-happened", "What Happened?", [
        "Sample incident narratives across demo datasets show overlapping techniques—credential abuse, cloud misconfiguration exploitation and data theft preceding encryption events.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Point solutions alone cannot address interconnected risk domains. Integrated visibility across identity, cloud and endpoint telemetry is increasingly necessary.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Adopt cross-domain detection strategies, executive risk reporting and scenario-based preparedness exercises.",
      ]),
    ],
    keyTakeaways: [
      "Threat complexity is increasing across identity, cloud and AI domains.",
      "Integrated visibility outperforms siloed monitoring.",
      "Executive alignment accelerates remediation investment.",
      "Preparedness exercises reveal gaps before real incidents occur.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "Defenders must operate across converging threat surfaces rather than isolated control domains.",
      whatToWatch:
        "Identity anomalies, cloud policy drift and AI-related social engineering in demonstration feeds.",
      defensiveFocus:
        "Build programs that connect detection, response and governance across the modern attack surface.",
    },
  },
  {
    id: "art-005",
    slug: "malware-campaigns-target-browser-credentials",
    title: "Malware Campaigns Increasingly Target Browser Credentials",
    excerpt:
      "Security researchers observe a rise in infostealer activity focused on session tokens and saved credentials within major browsers.",
    category: "Malware",
    categoryHref: "/news",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "6 min read",
    tags: ["Malware", "Infostealers", "Browsers", "Credentials"],
    contentType: "demo",
    featured: true,
    pattern: "grid",
    sections: [
      section("overview", "Overview", [
        "Browser-focused infostealers represent a persistent demonstration threat category, targeting saved passwords, cookies and session artifacts to bypass authentication controls.",
      ]),
      section("what-happened", "What Happened?", [
        "Modeled campaigns distribute loaders through malicious downloads and compromised software bundles, harvesting browser credential stores upon execution.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Valid session tokens can provide access even when MFA is enabled, making browser hygiene and endpoint protection critical.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Deploy endpoint detection, restrict local admin rights and educate users on download hygiene.",
      ]),
    ],
    keyTakeaways: [
      "Browser data stores are high-value targets.",
      "Session theft can bypass MFA in some scenarios.",
      "Endpoint visibility is essential for infostealer detection.",
      "User education reduces initial infection risk.",
    ],
    hcxAnalysis: {
      whyItMatters: "Credential and session theft enables rapid account abuse.",
      whatToWatch: "New loader families and unusual browser profile access patterns.",
      defensiveFocus: "Combine EDR, session monitoring and least-privilege endpoint policies.",
    },
    technicalDetails: {
      threatType: "Infostealer",
      affectedTechnology: "Web Browsers",
      severity: "High",
      attackVector: "Malicious Downloads",
      mitigationStatus: "Active Monitoring",
    },
  },
  {
    id: "art-006",
    slug: "misconfigured-cloud-services-major-security-risk",
    title: "Misconfigured Cloud Services Remain a Major Security Risk",
    excerpt:
      "Exposure assessments continue to highlight identity misconfigurations and overly permissive storage policies as leading cloud risks.",
    category: "Cloud Security",
    categoryHref: "/news",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "5 min read",
    tags: ["Cloud Security", "Misconfiguration", "IAM", "Data Exposure"],
    contentType: "demo",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "Cloud misconfigurations remain a leading category in demonstration risk assessments, particularly around storage permissions and identity policy sprawl.",
      ]),
      section("what-happened", "What Happened?", [
        "Sample audits reveal publicly accessible storage buckets and over-privileged service accounts in fictional enterprise environments.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Misconfigurations can lead to data exposure without traditional malware involvement, complicating detection timelines.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Implement continuous cloud security posture management and enforce infrastructure-as-code policy checks.",
      ]),
    ],
    keyTakeaways: [
      "Cloud misconfiguration is a recurring demo risk theme.",
      "Identity policies require continuous review.",
      "Automation reduces configuration drift.",
      "CSPM tools support ongoing visibility.",
    ],
    hcxAnalysis: {
      whyItMatters: "Cloud errors can instantly expand organizational blast radius.",
      whatToWatch: "Public resource exposure and dormant privileged roles.",
      defensiveFocus: "Embed security into cloud deployment pipelines and IAM lifecycle processes.",
    },
  },
  {
    id: "art-007",
    slug: "modern-phishing-campaigns-harder-to-detect",
    title: "Modern Phishing Campaigns Are Becoming Harder to Detect",
    excerpt:
      "Brand impersonation and MFA fatigue techniques are making traditional email filtering less effective for enterprise defenders.",
    category: "Phishing",
    categoryHref: "/news",
    author: "HimalCyberX Editorial",
    publishedAt: "2026-08-12",
    publishedAtIso: "2026-08-12",
    readTime: "4 min read",
    tags: ["Phishing", "Social Engineering", "MFA", "Email Security"],
    contentType: "demo",
    featured: false,
    pattern: "grid",
    sections: [
      section("overview", "Overview", [
        "Phishing demonstrations increasingly feature polished branding, lookalike domains and adversary-in-the-middle workflows designed to harvest credentials and MFA tokens.",
      ]),
      section("what-happened", "What Happened?", [
        "Sample campaigns mimic trusted SaaS login portals and leverage urgency themes to pressure users into approving push notifications.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Email filters alone cannot stop all modern phishing paths; user reporting and identity monitoring provide additional layers.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Deploy phishing-resistant authentication, domain monitoring and regular awareness training with realistic simulations.",
      ]),
    ],
    keyTakeaways: [
      "Phishing lures are increasingly convincing in demo datasets.",
      "MFA fatigue attacks target human behavior.",
      "Layered controls outperform single-point email filtering.",
      "User reporting accelerates containment.",
    ],
    hcxAnalysis: {
      whyItMatters: "Social engineering remains a reliable initial access vector.",
      whatToWatch: "Lookalike domains and repeated MFA push attempts.",
      defensiveFocus: "Combine technical controls with continuous user education.",
    },
  },
  {
    id: "art-008",
    slug: "faster-detection-reduces-breach-impact",
    title: "Why Faster Detection Can Dramatically Reduce Breach Impact",
    excerpt:
      "Incident response teams are refining playbooks to shorten dwell time and limit lateral movement during active intrusions.",
    category: "Incident Response",
    categoryHref: "/news",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-11",
    publishedAtIso: "2026-08-11",
    readTime: "8 min read",
    tags: ["Incident Response", "Detection", "SOC", "Playbooks"],
    contentType: "demo",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "Detection speed is a defining factor in demonstration breach outcomes. Organizations with practiced response workflows contain fictional incidents more effectively than those relying on ad hoc processes.",
      ]),
      section("what-happened", "What Happened?", [
        "Tabletop scenarios show delayed escalation increasing simulated data loss volumes and recovery timelines.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Dwell time correlates with attacker opportunity for persistence, exfiltration and ransomware deployment.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Invest in SOC workflows, alert tuning and cross-team communication protocols with defined severity thresholds.",
      ]),
    ],
    keyTakeaways: [
      "Early detection limits attacker operational freedom.",
      "Playbooks reduce decision latency during incidents.",
      "Cross-team coordination is critical under pressure.",
      "Metrics like MTTD and MTTR guide program improvement.",
    ],
    hcxAnalysis: {
      whyItMatters: "Response velocity directly influences business impact in demo scenarios.",
      whatToWatch: "Escalation delays and alert queue backlogs.",
      defensiveFocus: "Practice detection-to-containment workflows through regular exercises.",
    },
  },
  {
    id: "art-009",
    slug: "adversaries-weaponizing-llms-social-engineering",
    title: "How Adversaries Are Weaponizing LLMs for Automated Social Engineering at Scale",
    excerpt:
      "Threat actors are integrating generative models into phishing pipelines, producing highly contextualized lures that evade traditional detection.",
    category: "AI Threats",
    categoryHref: "/ai-security",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-12",
    publishedAtIso: "2026-08-12",
    readTime: "9 min read",
    tags: ["AI Threats", "LLM", "Phishing", "Social Engineering"],
    contentType: "demo",
    featured: false,
    pattern: "circuit",
    sections: [
      section("overview", "Overview", [
        "Demonstration research explores how large language models may assist attackers in drafting convincing phishing content at scale while maintaining thematic consistency across campaigns.",
      ]),
      section("what-happened", "What Happened?", [
        "Sample threat models include automated personalization based on public professional profiles and industry-specific terminology injection.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Higher-quality lures increase click-through likelihood and may reduce traditional spam indicators used by email gateways.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Enhance user awareness for AI-generated content, strengthen email authentication and monitor for anomalous login patterns following message delivery.",
      ]),
    ],
    keyTakeaways: [
      "LLMs may lower the cost of convincing phishing content.",
      "Contextual lures are harder for users to identify.",
      "Technical and human controls must work together.",
      "AI literacy is becoming a security awareness priority.",
    ],
    hcxAnalysis: {
      whyItMatters: "Generative AI changes the economics of social engineering campaigns.",
      whatToWatch: "Sudden increases in grammatically polished phishing templates.",
      defensiveFocus: "Update awareness programs and detection logic for AI-assisted deception.",
    },
  },
  {
    id: "art-010",
    slug: "building-ai-augmented-soc-workflow",
    title: "Building an AI-Augmented SOC: Practical Architecture for Security Teams",
    excerpt:
      "A framework for deploying machine learning-assisted triage without sacrificing analyst oversight or explainability requirements.",
    category: "Defensive AI",
    categoryHref: "/ai-security",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-09",
    publishedAtIso: "2026-08-09",
    readTime: "11 min read",
    tags: ["Defensive AI", "SOC", "Automation", "ML"],
    contentType: "demo",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "Security operations centers are evaluating AI-assisted workflows for alert summarization, entity enrichment and playbook suggestion while maintaining analyst accountability.",
      ]),
      section("what-happened", "What Happened?", [
        "Demonstration architectures integrate AI at triage layers with explicit human approval gates before containment actions execute.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Unchecked automation can amplify false positives or leak sensitive data to external models without proper governance.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Define approved use cases, log model interactions and validate outputs against ground-truth investigation records.",
      ]),
    ],
    keyTakeaways: [
      "AI should augment analysts, not replace judgment.",
      "Governance is essential for internal AI tooling.",
      "Explainability supports audit and trust requirements.",
      "Start with low-risk enrichment use cases.",
    ],
    hcxAnalysis: {
      whyItMatters: "Responsible AI adoption can reduce analyst toil without increasing risk.",
      whatToWatch: "Unsanctioned AI tools processing sensitive alert data.",
      defensiveFocus: "Design SOC AI workflows with oversight, logging and clear escalation paths.",
    },
  },
  {
    id: "art-013",
    slug: "ransomware-groups-target-identity-remote-access",
    title:
      "Ransomware Groups Are Increasingly Targeting Identity and Remote Access Systems",
    excerpt:
      "Modern ransomware operations increasingly rely on compromised credentials, VPN access, remote services and identity abuse to gain an initial foothold before deploying ransomware or stealing sensitive data.",
    category: "Threat Intelligence",
    categoryHref: "/threats",
    author: "HimalCyberX Research",
    publishedAt: "2026-08-13",
    publishedAtIso: "2026-08-13",
    readTime: "8 min read",
    tags: [
      "Ransomware",
      "Identity",
      "VPN",
      "Remote Access",
      "Threat Intelligence",
    ],
    contentType: "real",
    label: "HCX ANALYSIS",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "Ransomware is no longer associated only with malicious email attachments or the direct deployment of encryption malware on a single endpoint. In many publicly documented cases, operators have pursued a broader sequence of activity that may include obtaining valid credentials, accessing VPNs or other remote services, moving within an environment, stealing data and only later deploying ransomware.",
        "This article summarizes themes reported in public threat intelligence and government advisories. It does not suggest that every ransomware incident follows the same pattern, nor does it describe a single universal playbook used by all groups.",
      ]),
      section(
        "why-identity-target",
        "Why Identity Has Become a Major Target",
        [
          "Valid credentials can allow attackers to authenticate in ways that more closely resemble legitimate users, which may reduce reliance on noisy malware delivery and can complicate detection if identity activity is not monitored carefully.",
          "Public reporting and industry analysis have highlighted several identity-related factors that appear frequently in modern investigations, including compromised usernames and passwords, credentials obtained through infostealer malware, password spraying, credential reuse across services, weak or missing multi-factor authentication and compromise of privileged accounts.",
          "Stolen credentials have become an important initial-access technique discussed in contemporary threat investigations and defensive guidance from government and industry sources.",
        ],
      ),
      section(
        "remote-access-vpn",
        "Remote Access and VPN Abuse",
        [
          "Remote access systems are attractive targets because they can provide a pathway into corporate environments through mechanisms that organizations intentionally expose for business operations.",
          "Public reporting has discussed abuse involving VPN accounts, remote desktop services, exposed remote management interfaces, stolen authentication credentials and poorly secured remote-access configurations.",
          "This section is intended to support defensive awareness. It does not provide instructions for exploiting remote-access technologies.",
        ],
      ),
      section("example-akira", "Example: Akira Ransomware", [
        "The Cybersecurity and Infrastructure Security Agency (CISA) has reported that Akira ransomware actors have, in some incidents, gained access through compromised VPN credentials, among other techniques described in public advisories.",
        "Microsoft has also documented Akira actors using stolen credentials and vulnerable VPN appliances as initial access methods in its public threat encyclopedia materials.",
        "These references describe activity reported by government and vendor researchers. HimalCyberX did not discover or independently confirm any specific incident discussed in those public sources.",
      ]),
      section(
        "why-defenders",
        "Why This Matters for Defenders",
        [
          "Traditional antivirus and endpoint protection remain important, but they may not be sufficient on their own when attackers authenticate with valid credentials or abuse remote-access services.",
          "Organizations should also monitor identity activity, authentication logs, unusual VPN access, privileged account changes, remote service activity and indicators consistent with lateral movement.",
          "A ransomware prevention strategy that ignores identity and remote access may leave significant gaps in visibility and control.",
        ],
      ),
      section(
        "defensive-recommendations",
        "Defensive Recommendations",
        [
          "Require phishing-resistant multi-factor authentication where practical, especially for remote access and privileged accounts.",
          "Disable unused accounts, rotate credentials when compromise is suspected and review remote-access exposure regularly.",
          "Restrict unnecessary Remote Desktop Protocol exposure, enforce least privilege and monitor for unusual authentication activity.",
          "Patch VPN and remote-access appliances promptly, maintain centralized logging and security monitoring, and preserve tested offline backups as part of recovery planning.",
          "These recommendations are defensive and educational. They are intended to support risk reduction rather than describe offensive techniques.",
        ],
      ),
    ],
    keyTakeaways: [
      "Identity security is increasingly important in ransomware defense.",
      "Compromised credentials can provide attackers with legitimate-looking access.",
      "VPN and remote-access security should be treated as part of ransomware prevention.",
      "Identity monitoring, least privilege and strong authentication can reduce exposure.",
      "Ransomware defense requires prevention, detection, response and recovery controls.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "The attack surface is shifting beyond endpoints. Identity systems, cloud accounts and remote-access services have become critical security boundaries.",
      whatToWatch:
        "Look for unusual authentication patterns, impossible travel, unexpected VPN activity, repeated failed logins, privilege escalation and suspicious remote-access sessions.",
      defensiveFocus:
        "Prioritize identity security, MFA, least privilege, remote-access hardening, centralized logging and rapid credential revocation.",
    },
    sources: [
      {
        name: "CISA",
        title: "#StopRansomware: Akira Ransomware",
        url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-109a",
        publisher: "CISA",
      },
      {
        name: "CISA",
        title: "StopRansomware Guide",
        url: "https://www.cisa.gov/stopransomware/ransomware-guide",
        publisher: "CISA",
      },
      {
        name: "Google Cloud / Mandiant",
        title:
          "Ransomware Tactics, Techniques, and Procedures in a Shifting Threat Landscape",
        url: "https://cloud.google.com/blog/topics/threat-intelligence/ransomware-ttps-shifting-threat-landscape",
        publisher: "Google Cloud / Mandiant",
      },
      {
        name: "Google Cloud",
        title: "Cloud Threat Horizons Report H1 2026",
        url: "https://cloud.google.com/security/report/resources/cloud-threat-horizons-report-h1-2026",
        publisher: "Google Cloud",
      },
      {
        name: "Microsoft",
        title: "Akira ransomware threat description",
        url: "https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?Name=Ransom%3AWin32%2FAkira",
        publisher: "Microsoft",
      },
    ],
  },
  {
    id: "art-011",
    slug: "understanding-multi-factor-authentication",
    title: "Understanding Multi-Factor Authentication (MFA)",
    excerpt:
      "Multi-factor authentication adds layers beyond passwords to verify user identity. Learn how MFA works and why security frameworks recommend it for reducing account compromise.",
    category: "Security Fundamentals",
    categoryHref: "/tutorials",
    author: "HimalCyberX Editorial",
    publishedAt: "2026-08-10",
    publishedAtIso: "2026-08-10",
    readTime: "8 min read",
    tags: ["MFA", "Authentication", "Identity", "Security Basics"],
    contentType: "real",
    label: "GUIDE",
    featured: false,
    pattern: "grid",
    sections: [
      section("overview", "Overview", [
        "Multi-factor authentication (MFA) requires users to present two or more verification factors before access is granted. Factors are commonly grouped as something you know (password), something you have (security key or authenticator app), and something you are (biometric).",
        "Major cybersecurity frameworks treat MFA as a baseline control for protecting accounts against credential theft and phishing.",
      ]),
      section("what-happened", "What Happened?", [
        "Over the past decade, widespread password reuse and phishing have made single-factor authentication insufficient for many systems. Governments and standards bodies have published guidance encouraging MFA adoption, especially for privileged and remote access.",
        "Phishing-resistant MFA methods—such as FIDO2 security keys—are increasingly recommended where high-value accounts are at risk.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Stolen or guessed passwords remain a leading cause of unauthorized access. MFA reduces the likelihood that a compromised password alone results in account takeover.",
        "However, not all MFA methods provide equal protection. SMS-based codes and push notifications can be targeted by social engineering or adversary-in-the-middle techniques in some scenarios.",
      ]),
      section("how-it-works", "How the Threat Works", [
        "Attackers frequently obtain passwords through phishing, credential stuffing, or data breaches. Without a second factor, a valid password may be sufficient for login. MFA introduces an additional verification step that attackers must bypass.",
        "Organizations should match MFA strength to account risk—for example, requiring stronger factors for administrators and remote access.",
      ]),
      section("who-affected", "Who May Be Affected?", [
        "Any organization or individual using password-only authentication for email, cloud services, VPNs, or administrative consoles can benefit from MFA. High-risk roles—including IT administrators and finance approvers—should be prioritized.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Enable MFA on email, identity providers, cloud consoles, and remote access systems. Prefer phishing-resistant options where supported.",
        "Combine MFA with conditional access policies, device health checks, and user training on recognizing MFA fatigue and push-bombing attacks.",
      ]),
    ],
    keyTakeaways: [
      "MFA requires two or more verification factors before granting access.",
      "Password-only authentication remains vulnerable to theft and reuse.",
      "Phishing-resistant MFA provides stronger protection than SMS in many cases.",
      "Privileged and remote access accounts should be prioritized for MFA rollout.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "MFA is one of the most cost-effective controls for reducing account takeover risk.",
      whatToWatch:
        "MFA fatigue attacks, legacy SMS-only deployments, and exceptions granted to privileged accounts.",
      defensiveFocus:
        "Adopt framework-aligned MFA policies and migrate high-risk users to phishing-resistant methods.",
    },
    sources: [
      {
        name: "NIST",
        title: "Digital Identity Guidelines (NIST SP 800-63)",
        url: "https://pages.nist.gov/800-63-3/",
        publisher: "National Institute of Standards and Technology (NIST)",
      },
      {
        name: "CISA",
        title: "More than a Password (MFA guidance)",
        url: "https://www.cisa.gov/MFA",
        publisher: "Cybersecurity and Infrastructure Security Agency (CISA)",
      },
      {
        name: "CISA",
        title: "Phishing-Resistant MFA Fact Sheet",
        url: "https://www.cisa.gov/resources-tools/resources/phishing-resistant-multi-factor-authentication-fact-sheet",
        publisher: "CISA",
      },
    ],
  },
  {
    id: "art-012",
    slug: "how-the-cve-program-works",
    title: "How the CVE Program Works",
    excerpt:
      "The Common Vulnerabilities and Exposures (CVE) program provides standardized identifiers for publicly known cybersecurity vulnerabilities. Here is how CVE IDs are assigned, published, and used by defenders.",
    category: "Vulnerabilities",
    categoryHref: "/vulnerabilities",
    author: "HimalCyberX Editorial",
    publishedAt: "2026-08-08",
    publishedAtIso: "2026-08-08",
    readTime: "7 min read",
    tags: ["CVE", "Vulnerability Management", "NVD", "Disclosure"],
    contentType: "real",
    label: "SECURITY RESEARCH",
    featured: false,
    pattern: "network",
    sections: [
      section("overview", "Overview", [
        "The CVE Program assigns unique identifiers (CVE IDs) to publicly disclosed vulnerabilities so organizations can track, discuss, and remediate them consistently across tools and vendors.",
        "CVE records are maintained by CVE Numbering Authorities (CNAs) and published through the CVE Program, while enriched metadata such as CVSS scores often appears in the National Vulnerability Database (NVD).",
      ]),
      section("what-happened", "What Happened?", [
        "When a vendor or researcher discloses a vulnerability, a CNA may assign a CVE ID and publish a record describing the issue at a high level. Security teams use these identifiers in patch management, threat intelligence, and risk assessments.",
        "The NVD, operated by NIST, provides additional analysis—including severity scores and reference links—for many CVE entries.",
      ]),
      section("why-it-matters", "Why It Matters", [
        "Without standardized identifiers, the same vulnerability might be referenced differently by vendors, scanners, and analysts—slowing coordination and remediation.",
        "CVE IDs are widely integrated into vulnerability scanners, SIEM content, and vendor advisories, making them essential vocabulary for security operations.",
      ]),
      section("defensive-guidance", "Defensive Guidance", [
        "Map CVE IDs to asset inventories, prioritize based on exposure and severity, and track remediation status through ticketing workflows.",
        "Consult vendor advisories and NVD entries together—CVE records provide identification, while vendors provide authoritative patch guidance.",
      ]),
    ],
    keyTakeaways: [
      "CVE IDs uniquely identify publicly known vulnerabilities.",
      "CNAs assign and publish CVE records through the CVE Program.",
      "NVD enriches many CVEs with scores and references.",
      "Defenders use CVE IDs to prioritize patching and track remediation.",
    ],
    hcxAnalysis: {
      whyItMatters:
        "Consistent vulnerability identification underpins effective patch and risk management.",
      whatToWatch:
        "New CVE publications affecting technologies in your asset inventory.",
      defensiveFocus:
        "Integrate CVE tracking into vulnerability management and change-control processes.",
    },
    sources: [
      {
        name: "CVE Program",
        title: "CVE Program Overview",
        url: "https://www.cve.org/About/Overview",
        publisher: "CVE Program",
      },
      {
        name: "NIST",
        title: "National Vulnerability Database (NVD)",
        url: "https://nvd.nist.gov/",
        publisher: "National Institute of Standards and Technology (NIST)",
      },
      {
        name: "CVE Program",
        title: "CVE List Downloads",
        url: "https://www.cve.org/Downloads",
        publisher: "CVE Program",
      },
    ],
  },
];

export function getAllArticles(): Article[] {
  return articles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getAllArticleSlugs(): string[] {
  return articles.map((a) => a.slug);
}

export function isDemoArticle(article: Article): boolean {
  return article.contentType === "demo";
}

export function getPublicArticles(): Article[] {
  return articles.filter((a) => a.contentType === "real");
}

export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticleBySlug(slug);
  const pool = getPublicArticles();
  if (!current) return pool.slice(0, limit);

  const sameCategory = pool.filter(
    (a) => a.slug !== slug && a.category === current.category,
  );
  const others = pool.filter(
    (a) => a.slug !== slug && a.category !== current.category,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getTocSections(article: Article): ArticleSection[] {
  const bodySections = article.sections;
  const tail: ArticleSection[] = [
    { id: "key-takeaways", title: "Key Takeaways", paragraphs: [] },
    { id: "hcx-analysis", title: "HCX Analysis", paragraphs: [] },
  ];

  if (article.sources && article.sources.length > 0) {
    tail.push({
      id: "sources",
      title: "Sources & References",
      paragraphs: [],
    });
  }

  return [...bodySections, ...tail];
}

export function articleToCard(article: Article) {
  return {
    slug: article.slug,
    category: article.category,
    headline: article.title,
    title: article.title,
    summary: article.excerpt,
    description: article.excerpt,
    author: article.author,
    date: formatArticleDate(article.publishedAtIso),
    dateIso: article.publishedAtIso,
    readTime: article.readTime,
    pattern: article.pattern,
    contentType: article.contentType,
    label: article.label,
  };
}
