export const RATE_LIMIT_MESSAGES = {
  newsletter:
    "Too many subscription attempts. Please try again in a few minutes.",
  contact:
    "Too many messages were sent recently. Please try again in a few minutes.",
  adminLogin:
    "Too many sign-in attempts. Please wait a few minutes and try again.",
  learnerLogin:
    "Too many sign-in attempts. Please wait a few minutes and try again.",
  learnerSignup:
    "Too many account creation attempts. Please wait a few minutes and try again.",
  learnerPasswordReset:
    "Too many password reset requests. Please wait a few minutes and try again.",
  agentResearch:
    "Too many research runs were started recently. Please wait before trying again.",
  agentGeneration:
    "Too many draft generations were started recently. Please wait before trying again.",
  agentReview:
    "Too many independent reviews were started recently. Please wait before trying again.",
  agentRevision:
    "Too many automatic revisions were started recently. Please wait before trying again.",
  agentImageGeneration:
    "Too many featured image generations were started recently. Please wait before trying again.",
} as const;
