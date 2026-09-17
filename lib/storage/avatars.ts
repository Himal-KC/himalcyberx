import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATARS_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
  type AllowedAvatarMimeType,
} from "../auth/constants.ts";

const EXTENSION_BY_MIME: Record<AllowedAvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const AVATAR_TYPE_ERROR = "Avatar must be a JPEG, PNG, or WebP image.";
export const AVATAR_SIZE_ERROR = "Avatar must be 1 MB or smaller.";

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAvatarFile(file: File): AvatarValidationResult {
  if (
    !ALLOWED_AVATAR_MIME_TYPES.includes(file.type as AllowedAvatarMimeType)
  ) {
    return { valid: false, error: AVATAR_TYPE_ERROR };
  }

  if (file.size <= 0 || file.size > MAX_AVATAR_SIZE_BYTES) {
    return { valid: false, error: AVATAR_SIZE_ERROR };
  }

  return { valid: true };
}

export function buildAvatarStoragePath(userId: string, mimeType: string): string {
  const extension =
    EXTENSION_BY_MIME[mimeType as AllowedAvatarMimeType] ?? "jpg";
  return `${userId}/avatar.${extension}`;
}

export function buildPublicAvatarUrl(
  supabaseUrl: string,
  userId: string,
  mimeType: string,
): string {
  const origin = supabaseUrl.replace(/\/$/, "");
  const path = buildAvatarStoragePath(userId, mimeType);
  return `${origin}/storage/v1/object/public/${AVATARS_BUCKET}/${path}`;
}

export function isOwnedAvatarUrl(
  avatarUrl: string,
  supabaseUrl: string,
  userId: string,
): boolean {
  if (!avatarUrl || !userId) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(avatarUrl);
  } catch {
    return false;
  }

  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(supabaseUrl).origin;
  } catch {
    return false;
  }

  if (parsed.origin !== allowedOrigin) {
    return false;
  }

  const expectedPrefix = `/storage/v1/object/public/${AVATARS_BUCKET}/${userId}/`;
  return parsed.pathname.startsWith(expectedPrefix);
}

export function sanitizeStoredAvatarUrl(
  avatarUrl: string | null,
  supabaseUrl: string,
  userId: string,
): string | null {
  if (!avatarUrl) {
    return null;
  }

  return isOwnedAvatarUrl(avatarUrl, supabaseUrl, userId) ? avatarUrl : null;
}
