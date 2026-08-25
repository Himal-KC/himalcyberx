export const HCX_TEXT_COLORS = [
  { id: "default", label: "Default", className: "" },
  { id: "muted", label: "Muted", className: "hcx-text-muted" },
  { id: "accent", label: "Cyan", className: "hcx-text-accent" },
  { id: "success", label: "Green", className: "hcx-text-success" },
  { id: "warning", label: "Amber", className: "hcx-text-warning" },
  { id: "danger", label: "Red", className: "hcx-text-danger" },
] as const;

export const HCX_TEXT_VARIANTS = [
  { id: "normal", label: "Normal", tag: "paragraph" as const },
  { id: "small", label: "Small", className: "hcx-text-small" },
  { id: "lead", label: "Lead", className: "hcx-text-lead" },
  { id: "h2", label: "H2", tag: "heading" as const, level: 2 },
  { id: "h3", label: "H3", tag: "heading" as const, level: 3 },
  { id: "h4", label: "H4", tag: "heading" as const, level: 4 },
] as const;

export const HCX_FONT_FAMILIES = [
  { id: "sans", label: "Sans", className: "hcx-font-sans" },
  { id: "mono", label: "Mono", className: "hcx-font-mono" },
  { id: "tech", label: "Tech", className: "hcx-font-tech" },
] as const;

export const HCX_CODE_LANGUAGES = [
  { id: "plain", label: "Plain text" },
  { id: "bash", label: "Bash" },
  { id: "powershell", label: "PowerShell" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "sql", label: "SQL" },
  { id: "json", label: "JSON" },
] as const;

export const HCX_ALLOWED_SPAN_CLASSES = [
  "hcx-text-muted",
  "hcx-text-accent",
  "hcx-text-success",
  "hcx-text-warning",
  "hcx-text-danger",
  "hcx-text-small",
  "hcx-text-lead",
  "hcx-font-sans",
  "hcx-font-mono",
  "hcx-font-tech",
] as const;

export const HCX_ALLOWED_CODE_CLASSES = HCX_CODE_LANGUAGES.map(
  (language) => `language-${language.id}`,
).filter((className) => className !== "language-plain");
