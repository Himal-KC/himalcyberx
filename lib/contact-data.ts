export const CONTACT_REASONS = [
  "General Enquiry",
  "Research Suggestion",
  "Cyber Lab Feedback",
  "Technical Issue",
  "Collaboration",
  "Other",
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number];
