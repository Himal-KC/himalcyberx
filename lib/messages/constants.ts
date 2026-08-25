export const MESSAGE_STATUSES = ["new", "read", "archived", "spam"] as const;

export const CONTACT_NAME_MAX_LENGTH = 100;
export const CONTACT_SUBJECT_MAX_LENGTH = 200;
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;
export const MESSAGE_REPLY_MIN_LENGTH = 2;
export const MESSAGE_REPLY_MAX_LENGTH = 5000;

export const MESSAGE_REPLY_DELIVERY_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;
