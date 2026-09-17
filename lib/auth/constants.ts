export const LEARNER_LOGIN_PATH = "/login";
export const LEARNER_SIGNUP_PATH = "/signup";
export const LEARNER_FORGOT_PASSWORD_PATH = "/forgot-password";
export const LEARNER_RESET_PASSWORD_PATH = "/reset-password";
export const LEARNER_PROFILE_PATH = "/profile";
export const LEARNER_AUTH_CALLBACK_PATH = "/auth/callback";

export const LEARNER_DEFAULT_POST_AUTH_PATH = LEARNER_PROFILE_PATH;

export const MIN_LEARNER_PASSWORD_LENGTH = 8;

export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;
export const PROFILE_USERNAME_MIN_LENGTH = 3;
export const PROFILE_USERNAME_MAX_LENGTH = 32;
export const PROFILE_BIO_MAX_LENGTH = 500;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "hcx_admin",
  "hcxadmin",
  "root",
  "support",
  "security",
  "himalcyberx",
  "himal",
  "cyberx",
  "api",
  "www",
  "help",
  "moderator",
  "staff",
  "system",
  "null",
  "undefined",
]);

export const AVATARS_BUCKET = "avatars";
export const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];
