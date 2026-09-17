import sanitizeHtml from "sanitize-html";
import { isValidEmail } from "../form-validation.ts";
import {
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
} from "./constants.ts";

export interface ProfileFieldInput {
  displayName: string;
  username: string;
  bio: string;
}

export interface ValidatedProfileFields {
  display_name: string | null;
  username: string | null;
  bio: string | null;
}

export interface ProfileValidationResult {
  ok: boolean;
  fieldErrors: Record<string, string>;
  values: ValidatedProfileFields;
}

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

function stripHtmlToPlainText(value: string): string {
  const withoutBlocks = value.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );

  return sanitizeHtml(withoutBlocks, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/[<>]/g, "");
}

export function sanitizeProfileText(value: string, maxLength: number): string {
  return stripHtmlToPlainText(stripControlChars(value))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeProfileBio(value: string): string {
  return stripHtmlToPlainText(stripControlChars(value))
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, PROFILE_BIO_MAX_LENGTH);
}

export function normalizeUsername(value: string): string {
  return sanitizeProfileText(value, PROFILE_USERNAME_MAX_LENGTH)
    .toLowerCase()
    .replace(/\s+/g, "");
}

function looksLikeEmail(value: string): boolean {
  return value.includes("@") || isValidEmail(value);
}

export interface ProfileUpdatePayload {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url?: string | null;
  updated_at: string;
}

export function buildProfileUpdatePayload(
  fields: ValidatedProfileFields,
  options?: { avatarUrl?: string | null; includeAvatar?: boolean },
): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {
    display_name: fields.display_name,
    username: fields.username,
    bio: fields.bio,
    updated_at: new Date().toISOString(),
  };

  if (options?.includeAvatar) {
    payload.avatar_url = options.avatarUrl ?? null;
  }

  return payload;
}

export function validateProfileFields(input: ProfileFieldInput): ProfileValidationResult {
  const fieldErrors: Record<string, string> = {};

  const displayName = sanitizeProfileText(
    input.displayName,
    PROFILE_DISPLAY_NAME_MAX_LENGTH,
  );
  const username = normalizeUsername(input.username);
  const bio = sanitizeProfileBio(input.bio);

  if (displayName && looksLikeEmail(displayName)) {
    fieldErrors.displayName =
      "Display name cannot be an email address. Use a public name instead.";
  }

  if (username) {
    if (
      username.length < PROFILE_USERNAME_MIN_LENGTH ||
      username.length > PROFILE_USERNAME_MAX_LENGTH
    ) {
      fieldErrors.username = `Username must be ${PROFILE_USERNAME_MIN_LENGTH}–${PROFILE_USERNAME_MAX_LENGTH} characters.`;
    } else if (!USERNAME_PATTERN.test(username)) {
      fieldErrors.username =
        "Username may only include lowercase letters, numbers, and underscores.";
    } else if (RESERVED_USERNAMES.has(username)) {
      fieldErrors.username = "That username is reserved. Please choose another.";
    } else if (looksLikeEmail(username)) {
      fieldErrors.username = "Username cannot be an email address.";
    }
  }

  if (bio && looksLikeEmail(bio.trim()) && !bio.includes(" ")) {
    fieldErrors.bio = "Bio cannot be an email address.";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    values: {
      display_name: displayName || null,
      username: username || null,
      bio: bio || null,
    },
  };
}
