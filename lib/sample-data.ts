export const navLinks = [
  { label: "Home", href: "#" },
  { label: "News", href: "#latest-news" },
  { label: "Threats", href: "#threat-intelligence" },
  { label: "Vulnerabilities", href: "#vulnerability-watch" },
  { label: "Cyber Lab", href: "#cyber-lab" },
  { label: "Forensics", href: "#cyber-lab" },
  { label: "Tutorials", href: "#cyber-lab" },
  { label: "AI Security", href: "#ai-security" },
] as const;

export const breakingHeadline =
  "Critical zero-day actively exploited in enterprise VPN appliances — security teams urged to review vendor guidance.";

export const trendingStories = [
  {
    category: "Threat Intelligence",
    headline: "Ransomware Groups Shift Toward Identity-Based Attacks",
    summary:
      "Threat actors are increasingly targeting credentials, cloud identities and remote access systems instead of relying only on traditional malware.",
    author: "HimalCyberX Research",
    date: "Aug 13, 2026",
    readTime: "6 min read",
    pattern: "network" as const,
  },
  {
    category: "Vulnerabilities",
    headline: "Why Zero-Day Response Speed Matters More Than Ever",
    summary:
      "Security teams face growing pressure to identify exposure, prioritize patches and reduce the time attackers have to exploit critical flaws.",
    author: "HimalCyberX Research",
    date: "Aug 13, 2026",
    readTime: "5 min read",
    pattern: "grid" as const,
  },
  {
    category: "AI Security",
    headline: "AI Is Changing Both Cyber Attacks and Cyber Defense",
    summary:
      "Generative AI is giving attackers new capabilities while also helping defenders detect threats, investigate incidents and automate response.",
    author: "HimalCyberX Research",
    date: "Aug 13, 2026",
    readTime: "7 min read",
    pattern: "circuit" as const,
  },
];

export const featuredStory = {
  category: "Cybersecurity News",
  headline:
    "Security Teams Face a Faster and More Complex Threat Landscape",
  description:
    "Cloud adoption, identity-based attacks, ransomware operations and AI-assisted threats are creating new challenges for defenders.",
  author: "HimalCyberX",
  date: "Aug 13, 2026",
  readTime: "8 min read",
};

export const latestStories = [
  {
    category: "Malware",
    headline: "Malware Campaigns Increasingly Target Browser Credentials",
    readTime: "4 min",
  },
  {
    category: "Cloud Security",
    headline: "Misconfigured Cloud Services Remain a Major Security Risk",
    readTime: "5 min",
  },
  {
    category: "Phishing",
    headline: "Modern Phishing Campaigns Are Becoming Harder to Detect",
    readTime: "4 min",
  },
  {
    category: "Incident Response",
    headline:
      "Why Faster Detection Can Dramatically Reduce Breach Impact",
    readTime: "6 min",
  },
];

export const threatCategories = [
  {
    category: "Ransomware",
    title: "Ransomware Operations",
    description:
      "Analysis of ransomware campaigns, extortion tactics, infrastructure and defensive strategies.",
    status: "High Activity",
    accent: "red" as const,
    icon: "ransomware" as const,
  },
  {
    category: "Malware",
    title: "Malware Research",
    description:
      "Technical analysis of malicious software, delivery techniques and evolving malware families.",
    status: "Monitored",
    accent: "cyan" as const,
    icon: "malware" as const,
  },
  {
    category: "Phishing",
    title: "Phishing & Social Engineering",
    description:
      "Research into credential theft, impersonation, social engineering and modern phishing campaigns.",
    status: "Active",
    accent: "orange" as const,
    icon: "phishing" as const,
  },
  {
    category: "APT Groups",
    title: "Advanced Persistent Threats",
    description:
      "Analysis of sophisticated threat actors, long-term campaigns and targeted cyber operations.",
    status: "Tracked",
    accent: "green" as const,
    icon: "apt" as const,
  },
] as const;

export const threatLandscapeSummary = [
  { label: "Ransomware", value: "High", accent: "red" as const },
  { label: "Malware", value: "Monitored", accent: "cyan" as const },
  { label: "Phishing", value: "Active", accent: "orange" as const },
  { label: "APT", value: "Tracked", accent: "green" as const },
] as const;

export const vulnerabilitySummary = [
  { label: "Critical", value: "03", accent: "red" as const },
  { label: "High", value: "08", accent: "orange" as const },
  { label: "Medium", value: "14", accent: "yellow" as const },
  { label: "Monitored", value: "25", accent: "cyan" as const },
] as const;

export const demoVulnerabilities = [
  {
    cve: "CVE-2026-DEMO-001",
    product: "Enterprise VPN Gateway",
    type: "Remote Code Execution",
    severity: "CRITICAL" as const,
    cvss: "9.8",
    status: "Review",
  },
  {
    cve: "CVE-2026-DEMO-002",
    product: "Cloud Identity Platform",
    type: "Authentication Bypass",
    severity: "CRITICAL" as const,
    cvss: "9.1",
    status: "Review",
  },
  {
    cve: "CVE-2026-DEMO-003",
    product: "Web Application Framework",
    type: "Privilege Escalation",
    severity: "HIGH" as const,
    cvss: "8.4",
    status: "Monitoring",
  },
  {
    cve: "CVE-2026-DEMO-004",
    product: "Enterprise Email Server",
    type: "Information Disclosure",
    severity: "HIGH" as const,
    cvss: "7.5",
    status: "Monitoring",
  },
  {
    cve: "CVE-2026-DEMO-005",
    product: "Linux Service Component",
    type: "Denial of Service",
    severity: "MEDIUM" as const,
    cvss: "6.5",
    status: "Tracked",
  },
];

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

export const aiSecurityArticles = [
  {
    category: "AI Threats",
    headline:
      "How Adversaries Are Weaponizing LLMs for Automated Social Engineering at Scale",
    description:
      "Threat actors are integrating generative models into phishing pipelines, producing highly contextualized lures that evade traditional detection.",
    date: "Aug 12, 2026",
    readTime: "9 min read",
  },
  {
    category: "Defensive AI",
    headline:
      "Building an AI-Augmented SOC: Practical Architecture for Security Teams",
    description:
      "A framework for deploying machine learning-assisted triage without sacrificing analyst oversight or explainability requirements.",
    date: "Aug 9, 2026",
    readTime: "11 min read",
  },
  {
    category: "Research",
    headline:
      "Model Poisoning Risks in Enterprise ML Pipelines: What CISOs Need to Know",
    description:
      "New research highlights supply-chain vulnerabilities in training data workflows that could compromise downstream security decisions.",
    date: "Aug 7, 2026",
    readTime: "7 min read",
  },
];

export const footerLinks = {
  explore: [
    { label: "Latest News", href: "#latest-news" },
    { label: "Threat Intelligence", href: "#threat-intelligence" },
    { label: "Vulnerability Watch", href: "#vulnerability-watch" },
    { label: "Trending", href: "#trending" },
  ],
  cyberLab: [
    { label: "Network Security", href: "#cyber-lab" },
    { label: "Digital Forensics", href: "#cyber-lab" },
    { label: "SOC Training", href: "#cyber-lab" },
    { label: "Web Security", href: "#cyber-lab" },
  ],
  resources: [
    { label: "Tutorials", href: "#cyber-lab" },
    { label: "Research Papers", href: "#" },
    { label: "Threat Reports", href: "#threat-intelligence" },
    { label: "Newsletter", href: "#newsletter" },
  ],
  company: [
    { label: "About HCX", href: "#" },
    { label: "Editorial Standards", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};
