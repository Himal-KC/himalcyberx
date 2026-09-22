import {
  ALLOWED_AVATAR_EXTENSIONS,
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_FORM_FIELD,
  AVATARS_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
  type AllowedAvatarExtension,
  type AllowedAvatarMimeType,
} from "../auth/constants.ts";

const EXTENSION_BY_MIME: Record<AllowedAvatarMimeType, AllowedAvatarExtension> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_BY_EXTENSION: Record<AllowedAvatarExtension, AllowedAvatarMimeType> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const OWNER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export const AVATAR_EMPTY_ERROR = "Choose an image to upload.";
export const AVATAR_TYPE_ERROR = "Avatar must be a JPEG, PNG, or WebP image.";
export const AVATAR_SIZE_ERROR = "Avatar must be 1 MB or smaller.";

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: AllowedAvatarMimeType;
}

export interface AvatarFileLike {
  name?: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export function isAvatarOwnerId(value: unknown): value is string {
  return typeof value === "string" && OWNER_ID_PATTERN.test(value);
}

export function isAllowedAvatarMimeType(
  value: string,
): value is AllowedAvatarMimeType {
  return (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(value);
}

export function isAllowedAvatarExtension(
  value: string,
): value is AllowedAvatarExtension {
  return (ALLOWED_AVATAR_EXTENSIONS as readonly string[]).includes(value);
}

export function normalizeDeclaredAvatarMime(value: string): string {
  const declared = value.trim().toLowerCase();
  if (declared === "image/jpg") {
    return "image/jpeg";
  }
  return declared;
}

export function isAvatarFileLike(value: unknown): value is AvatarFileLike {
  // Next.js server actions may reconstruct uploads with a different File/Blob
  // realm, so `instanceof File` is not a reliable presence check.
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    size?: unknown;
    type?: unknown;
    arrayBuffer?: unknown;
  };

  return (
    typeof candidate.size === "number" &&
    Number.isFinite(candidate.size) &&
    typeof candidate.type === "string" &&
    typeof candidate.arrayBuffer === "function"
  );
}

export function getAvatarFileFromFormData(
  formData: FormData,
): AvatarFileLike | null {
  const value = formData.get(AVATAR_FORM_FIELD);
  if (!isAvatarFileLike(value) || value.size <= 0) {
    return null;
  }
  return value;
}

export function validateAvatarMetadata(input: {
  type?: string;
  size: number;
}): AvatarValidationResult {
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { valid: false, error: AVATAR_EMPTY_ERROR };
  }

  if (input.size > MAX_AVATAR_SIZE_BYTES) {
    return { valid: false, error: AVATAR_SIZE_ERROR };
  }

  const declared = normalizeDeclaredAvatarMime(input.type ?? "");
  if (
    declared &&
    declared !== "application/octet-stream" &&
    !isAllowedAvatarMimeType(declared)
  ) {
    return { valid: false, error: AVATAR_TYPE_ERROR };
  }

  return {
    valid: true,
    mimeType: isAllowedAvatarMimeType(declared) ? declared : undefined,
  };
}

export function validateAvatarFile(
  file: Pick<AvatarFileLike, "type" | "size">,
): AvatarValidationResult {
  return validateAvatarMetadata(file);
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }
  return prefix.every((value, index) => bytes[index] === value);
}

export function sniffAvatarMime(bytes: Uint8Array): AllowedAvatarMimeType | null {
  if (hasPrefix(bytes, JPEG_MAGIC)) {
    return "image/jpeg";
  }

  if (hasPrefix(bytes, PNG_MAGIC)) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function validateAvatarBytes(
  bytes: Uint8Array,
  declaredType = "",
): AvatarValidationResult {
  if (bytes.byteLength <= 0) {
    return { valid: false, error: AVATAR_EMPTY_ERROR };
  }

  if (bytes.byteLength > MAX_AVATAR_SIZE_BYTES) {
    return { valid: false, error: AVATAR_SIZE_ERROR };
  }

  const sniffed = sniffAvatarMime(bytes);
  if (!sniffed) {
    return { valid: false, error: AVATAR_TYPE_ERROR };
  }

  const declared = normalizeDeclaredAvatarMime(declaredType);
  if (
    declared &&
    declared !== "application/octet-stream" &&
    declared !== sniffed
  ) {
    return { valid: false, error: AVATAR_TYPE_ERROR };
  }

  return { valid: true, mimeType: sniffed };
}

export async function validateAvatarUpload(
  file: AvatarFileLike,
): Promise<AvatarValidationResult> {
  const metadata = validateAvatarMetadata(file);
  if (!metadata.valid) {
    return metadata;
  }

  const buffer = await file.arrayBuffer();
  return validateAvatarBytes(new Uint8Array(buffer), file.type);
}

export function extensionForAvatarMime(
  mimeType: string,
): AllowedAvatarExtension | null {
  const normalized = normalizeDeclaredAvatarMime(mimeType);
  if (!isAllowedAvatarMimeType(normalized)) {
    return null;
  }
  return EXTENSION_BY_MIME[normalized];
}

export function mimeForAvatarExtension(
  extension: string,
): AllowedAvatarMimeType | null {
  const normalized = extension.trim().toLowerCase();
  if (!isAllowedAvatarExtension(normalized)) {
    return null;
  }
  return MIME_BY_EXTENSION[normalized];
}

function containsUnsafePathSegment(value: string): boolean {
  return (
    value.includes("..") ||
    value.includes("\\") ||
    value.includes("%2e") ||
    value.includes("%2f") ||
    value.includes("%5c")
  );
}

export function buildAvatarStoragePath(
  userId: string,
  mimeType: string,
): string | null {
  if (!isAvatarOwnerId(userId) || containsUnsafePathSegment(userId)) {
    return null;
  }

  const extension = extensionForAvatarMime(mimeType);
  if (!extension) {
    return null;
  }

  return `${userId}/avatar.${extension}`;
}

export function isAllowedAvatarStoragePath(
  path: string,
  ownerId: string,
): boolean {
  if (!isAvatarOwnerId(ownerId) || containsUnsafePathSegment(path)) {
    return false;
  }

  if (path.startsWith("/") || path.includes("//")) {
    return false;
  }

  return (
    path === `${ownerId}/avatar.jpg` ||
    path === `${ownerId}/avatar.png` ||
    path === `${ownerId}/avatar.webp`
  );
}

export function avatarFolderPrefix(ownerId: string): string | null {
  if (!isAvatarOwnerId(ownerId)) {
    return null;
  }
  return `${ownerId}/`;
}

export function isOwnAvatarObjectName(
  objectName: string,
  ownerId: string,
): boolean {
  return isAllowedAvatarStoragePath(objectName, ownerId);
}

export function buildPublicAvatarUrl(
  supabaseUrl: string,
  userId: string,
  mimeType: string,
): string | null {
  const path = buildAvatarStoragePath(userId, mimeType);
  if (!path) {
    return null;
  }

  let origin: string;
  try {
    origin = new URL(supabaseUrl).origin;
  } catch {
    return null;
  }

  return `${origin}/storage/v1/object/public/${AVATARS_BUCKET}/${path}`;
}

export function buildStoredAvatarUrl(
  supabaseUrl: string,
  userId: string,
  mimeType: string,
  version: string | number = Date.now(),
): string | null {
  const url = buildPublicAvatarUrl(supabaseUrl, userId, mimeType);
  if (!url) {
    return null;
  }

  const parsed = new URL(url);
  parsed.searchParams.set("v", String(version));
  return parsed.toString();
}

function expectedAvatarPathnames(userId: string): string[] {
  return ALLOWED_AVATAR_EXTENSIONS.map(
    (extension) =>
      `/storage/v1/object/public/${AVATARS_BUCKET}/${userId}/avatar.${extension}`,
  );
}

export function isOwnedAvatarUrl(
  avatarUrl: string,
  supabaseUrl: string,
  userId: string,
): boolean {
  if (!avatarUrl || !isAvatarOwnerId(userId)) {
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

  if (parsed.origin !== allowedOrigin || parsed.username || parsed.password) {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return false;
  }

  if (containsUnsafePathSegment(pathname) || pathname.includes("//")) {
    return false;
  }

  return expectedAvatarPathnames(userId).includes(pathname);
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

export function rejectExternalAvatarUrl(
  avatarUrl: string,
  supabaseUrl: string,
  userId: string,
): boolean {
  return !isOwnedAvatarUrl(avatarUrl, supabaseUrl, userId);
}
