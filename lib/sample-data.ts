import {
  articleToCard,
  getArticleBySlug,
  getPublicArticles,
} from "@/lib/articles";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Threats", href: "/threats" },
  { label: "Vulnerabilities", href: "/vulnerabilities" },
  { label: "Cyber Lab", href: "/cyber-lab" },
  { label: "Forensics", href: "/forensics" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "About", href: "/about" },
  { label: "AI Security", href: "/ai-security" },
] as const;

export const securityUpdateMessage =
  "Follow HimalCyberX for cybersecurity research, vulnerability analysis and defensive security guidance.";

const publicArticleSlugs = [
  "ransomware-groups-target-identity-remote-access",
  "understanding-multi-factor-authentication",
  "how-the-cve-program-works",
] as const;

const trendingPatterns = ["network", "grid", "circuit"] as const;

export const trendingStories = publicArticleSlugs.map((slug, index) => ({
  ...articleToCard(getArticleBySlug(slug)!),
  pattern: trendingPatterns[index],
}));

export const featuredStory = articleToCard(
  getArticleBySlug("ransomware-groups-target-identity-remote-access")!,
);

export const latestStories = publicArticleSlugs.map((slug) => {
  const article = getArticleBySlug(slug)!;
  const card = articleToCard(article);
  return {
    slug: article.slug,
    category: article.category,
    headline: article.title,
    readTime: article.readTime.replace(" read", ""),
    label: article.label,
    date: card.date,
    dateIso: article.publishedAtIso,
  };
});

export const threatCategories = [
  {
    category: "Ransomware",
    title: "Ransomware Operations",
    description:
      "Analysis of ransomware campaigns, extortion tactics, infrastructure and defensive strategies.",
    label: "Threat Research",
    accent: "red" as const,
    icon: "ransomware" as const,
    href: "/threats",
  },
  {
    category: "Malware",
    title: "Malware Research",
    description:
      "Technical analysis of malicious software, delivery techniques and evolving malware families.",
    label: "Malware Analysis",
    accent: "cyan" as const,
    icon: "malware" as const,
    href: "/threats",
  },
  {
    category: "Phishing",
    title: "Phishing & Social Engineering",
    description:
      "Research into credential theft, impersonation, social engineering and modern phishing campaigns.",
    label: "Social Engineering",
    accent: "orange" as const,
    icon: "phishing" as const,
    href: "/threats",
  },
  {
    category: "APT Groups",
    title: "Advanced Persistent Threats",
    description:
      "Analysis of sophisticated threat actors, long-term campaigns and targeted cyber operations.",
    label: "Threat Actor Research",
    accent: "green" as const,
    icon: "apt" as const,
    href: "/threats",
  },
] as const;

export const intelligenceCoverage = [
  { label: "Ransomware", accent: "red" as const },
  { label: "Malware", accent: "cyan" as const },
  { label: "Phishing", accent: "orange" as const },
  { label: "Threat Actors", accent: "green" as const },
] as const;

export const vulnerabilitySources =
  "CISA KEV • NVD • Vendor Advisories";

export const vulnerabilityNavCards = [
  {
    title: "CISA KEV",
    subtitle: "Known Exploited Vulnerabilities",
    href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    external: true,
  },
  {
    title: "NVD",
    subtitle: "Vulnerability Reference",
    href: "https://nvd.nist.gov/",
    external: true,
  },
  {
    title: "Critical Vulnerabilities",
    subtitle: "HCX Analysis",
    href: "/vulnerabilities",
    external: false,
  },
  {
    title: "Recent CVEs",
    subtitle: "Security Research",
    href: "/articles/how-the-cve-program-works",
    external: false,
  },
] as const;

export const cyberLabModules = [
  {
    labId: "HCX-001",
    category: "Network Security",
    title: "Network Security Lab",
    description:
      "Learn network reconnaissance, traffic analysis, port scanning and defensive network monitoring.",
    tags: ["Nmap", "Wireshark", "tcpdump"],
    tagType: "tools" as const,
    difficulty: "Beginner → Intermediate",
    difficultyLevel: "beginner-intermediate" as const,
    buttonText: "Explore Network Labs",
    icon: "network" as const,
  },
  {
    labId: "HCX-002",
    category: "Digital Forensics",
    title: "Digital Forensics Lab",
    description:
      "Investigate disk images, file systems, deleted files and digital evidence using forensic tools.",
    tags: ["Autopsy", "FTK Imager", "HxD"],
    tagType: "tools" as const,
    difficulty: "Beginner → Advanced",
    difficultyLevel: "beginner-advanced" as const,
    buttonText: "Explore Forensics",
    icon: "forensics" as const,
  },
  {
    labId: "HCX-003",
    category: "SOC & Incident Response",
    title: "SOC & Incident Response",
    description:
      "Practice log analysis, alert investigation, incident triage and security monitoring workflows.",
    tags: ["SIEM", "Logs", "Incident Response"],
    tagType: "topics" as const,
    difficulty: "Intermediate",
    difficultyLevel: "intermediate" as const,
    buttonText: "Explore SOC Labs",
    icon: "soc" as const,
  },
  {
    labId: "HCX-004",
    category: "Web Security",
    title: "Web Security Lab",
    description:
      "Understand common web application vulnerabilities and defensive testing techniques.",
    tags: ["OWASP", "Burp Suite", "Web Security"],
    tagType: "topics" as const,
    difficulty: "Intermediate",
    difficultyLevel: "intermediate" as const,
    buttonText: "Explore Web Labs",
    icon: "web" as const,
  },
  {
    labId: "HCX-005",
    category: "Linux Security",
    title: "Linux Security",
    description:
      "Learn Linux hardening, permissions, system monitoring and command-line security.",
    tags: ["Linux", "Permissions", "Hardening"],
    tagType: "topics" as const,
    difficulty: "Beginner → Intermediate",
    difficultyLevel: "beginner-intermediate" as const,
    buttonText: "Explore Linux Labs",
    icon: "linux" as const,
  },
  {
    labId: "HCX-006",
    category: "CTF Write-ups",
    title: "Capture The Flag",
    description:
      "Step-by-step explanations of cybersecurity challenges and practical problem-solving techniques.",
    tags: ["Recon", "Web", "Forensics", "Crypto"],
    tagType: "topics" as const,
    difficulty: "Various",
    difficultyLevel: "various" as const,
    buttonText: "View CTF Write-ups",
    icon: "ctf" as const,
  },
] as const;

export const featuredLab = {
  title: "Network Reconnaissance with Nmap",
  description:
    "Learn how security professionals identify hosts, ports and services during an authorized network assessment.",
  difficulty: "Beginner",
  estimatedTime: "20 minutes",
  tools: ["Nmap"],
  environment: "Local Lab",
};

export const learningPaths = [
  {
    title: "Foundations",
    topics: [
      "Networking",
      "Linux",
      "Security Basics",
      "Digital Forensics Basics",
    ],
  },
  {
    title: "Blue Team",
    topics: [
      "SOC Fundamentals",
      "Log Analysis",
      "Threat Detection",
      "Incident Response",
    ],
  },
  {
    title: "Security Research",
    topics: [
      "Vulnerability Research",
      "Threat Intelligence",
      "Malware Analysis",
      "Digital Forensics",
    ],
  },
] as const;

export const aiSecurityTopics = [
  {
    id: "llm-security",
    category: "LLM Security",
    title: "Securing Large Language Model Deployments",
    description:
      "Understanding prompt injection, data leakage and access controls in enterprise LLM workflows.",
  },
  {
    id: "ai-social-engineering",
    category: "AI-Powered Social Engineering",
    title: "Recognizing AI-Assisted Phishing and Impersonation",
    description:
      "How generative tools may influence social engineering techniques and defensive awareness training.",
  },
  {
    id: "deepfake-risk",
    category: "Deepfake Risk",
    title: "Synthetic Media and Identity Verification Challenges",
    description:
      "Educational overview of deepfake risks and verification practices for organizations.",
  },
  {
    id: "prompt-injection",
    category: "Prompt Injection",
    title: "Defending Applications Against Prompt Injection",
    description:
      "Input validation, output filtering and architectural controls for LLM-integrated applications.",
  },
  {
    id: "ai-governance",
    category: "AI Governance",
    title: "Governance Frameworks for Security Teams",
    description:
      "Policy, risk assessment and oversight models for responsible AI adoption in security operations.",
  },
  {
    id: "defensive-ai",
    category: "Defensive AI",
    title: "AI-Assisted Security Operations",
    description:
      "Using machine learning and AI tools responsibly for detection, triage and investigation support.",
  },
] as const;

export const publicArticles = getPublicArticles();

export const footerLinks = {
  explore: [
    { label: "Latest from HCX", href: "/news" },
    { label: "Threat Intelligence", href: "/threats" },
    { label: "Vulnerability Watch", href: "/vulnerabilities" },
    { label: "Trending", href: "/#latest-news" },
  ],
  cyberLab: [
    { label: "Network Security", href: "/cyber-lab" },
    { label: "Digital Forensics", href: "/forensics" },
    { label: "SOC Training", href: "/cyber-lab" },
    { label: "Web Security", href: "/cyber-lab" },
  ],
  resources: [
    { label: "Tutorials", href: "/tutorials" },
    { label: "Research", href: "/threats" },
    { label: "Guides", href: "/tutorials" },
    { label: "Newsletter", href: "/#newsletter" },
  ],
  company: [
    { label: "About HCX", href: "/about" },
    { label: "Editorial Standards", href: "#" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};
