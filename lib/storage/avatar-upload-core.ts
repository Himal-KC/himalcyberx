import {
  AVATAR_EMPTY_ERROR,
  AVATAR_SIZE_ERROR,
  AVATAR_TYPE_ERROR,
  avatarFolderPrefix,
  buildAvatarStoragePath,
  buildStoredAvatarUrl,
  isAllowedAvatarStoragePath,
  isAvatarFileLike,
  isAvatarOwnerId,
  sanitizeStoredAvatarUrl,
  validateAvatarBytes,
  validateAvatarMetadata,
  type AvatarFileLike,
} from "./avatars.ts";

export type AvatarOpError =
  | "unauthenticated"
  | "empty_file"
  | "invalid_type"
  | "too_large"
  | "unauthorized_path"
  | "storage_failed"
  | "profile_failed";

export type AvatarOpResult =
  | { ok: true; avatarUrl: string | null; replaced: boolean }
  | { ok: false; error: AvatarOpError; message: string };

export type AvatarUploadInput = {
  file: AvatarFileLike | null;
  claimedUserId?: unknown;
  claimedPath?: unknown;
  claimedAvatarUrl?: unknown;
};

export type AvatarUploadStore = {
  now: () => Date;
  getSessionUser: () => Promise<{ id: string } | null>;
  getSupabaseUrl: () => string;
  uploadAvatar: (
    path: string,
    bytes: Uint8Array,
    contentType: string,
  ) => Promise<{ error: string | null }>;
  listOwnAvatarPaths: (
    userId: string,
  ) => Promise<{ paths: string[]; error: string | null }>;
  removePaths: (paths: string[]) => Promise<{ error: string | null }>;
  updateProfileAvatar: (
    userId: string,
    avatarUrl: string | null,
  ) => Promise<{ error: string | null }>;
};

const UNAUTHENTICATED_MESSAGE = "Please sign in to continue.";
const STORAGE_FAILED_MESSAGE =
  "Unable to upload your avatar. You can still save your name, username, and bio.";
const PROFILE_FAILED_MESSAGE =
  "Avatar uploaded, but the profile could not be updated. Please try again.";
const UNAUTHORIZED_PATH_MESSAGE = "Unable to save that image. Please try again.";
const REMOVE_FAILED_MESSAGE = "Unable to remove your avatar. Please try again.";

function fail(error: AvatarOpError, message: string): AvatarOpResult {
  return { ok: false, error, message };
}

function sessionOwnerId(userId: string | undefined): string | null {
  return userId && isAvatarOwnerId(userId) ? userId : null;
}

function ignoreClaimedIdentity(input: AvatarUploadInput): void {
  void input.claimedUserId;
  void input.claimedPath;
  void input.claimedAvatarUrl;
}

export function mapAvatarValidationError(
  error: string | undefined,
): Extract<AvatarOpError, "empty_file" | "invalid_type" | "too_large"> {
  if (error === AVATAR_SIZE_ERROR) {
    return "too_large";
  }
  if (error === AVATAR_EMPTY_ERROR) {
    return "empty_file";
  }
  return "invalid_type";
}

export async function uploadOwnAvatar(
  store: AvatarUploadStore,
  input: AvatarUploadInput,
): Promise<AvatarOpResult> {
  ignoreClaimedIdentity(input);

  const user = await store.getSessionUser();
  const ownerId = sessionOwnerId(user?.id);
  if (!ownerId) {
    return fail("unauthenticated", UNAUTHENTICATED_MESSAGE);
  }

  const file = isAvatarFileLike(input.file) ? input.file : null;
  if (!file || file.size <= 0) {
    return fail("empty_file", AVATAR_EMPTY_ERROR);
  }

  const metadata = validateAvatarMetadata(file);
  if (!metadata.valid) {
    const error = mapAvatarValidationError(metadata.error);
    return fail(error, metadata.error ?? AVATAR_TYPE_ERROR);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateAvatarBytes(bytes, file.type);
  if (!validation.valid || !validation.mimeType) {
    const error = mapAvatarValidationError(validation.error);
    return fail(error, validation.error ?? AVATAR_TYPE_ERROR);
  }

  const path = buildAvatarStoragePath(ownerId, validation.mimeType);
  if (!path || !isAllowedAvatarStoragePath(path, ownerId)) {
    return fail("unauthorized_path", UNAUTHORIZED_PATH_MESSAGE);
  }

  const upload = await store.uploadAvatar(path, bytes, validation.mimeType);
  if (upload.error) {
    return fail("storage_failed", STORAGE_FAILED_MESSAGE);
  }

  const listed = await store.listOwnAvatarPaths(ownerId);
  const stalePaths = (listed.paths ?? []).filter(
    (objectPath) =>
      objectPath !== path && isAllowedAvatarStoragePath(objectPath, ownerId),
  );
  if (stalePaths.length > 0) {
    await store.removePaths(stalePaths);
  }

  const avatarUrl = buildStoredAvatarUrl(
    store.getSupabaseUrl(),
    ownerId,
    validation.mimeType,
    store.now().getTime(),
  );
  if (!avatarUrl) {
    return fail("unauthorized_path", UNAUTHORIZED_PATH_MESSAGE);
  }

  const profileUpdate = await store.updateProfileAvatar(ownerId, avatarUrl);
  if (profileUpdate.error) {
    return fail("profile_failed", PROFILE_FAILED_MESSAGE);
  }

  return {
    ok: true,
    avatarUrl,
    replaced: stalePaths.length > 0,
  };
}

export async function removeOwnAvatar(
  store: AvatarUploadStore,
): Promise<AvatarOpResult> {
  const user = await store.getSessionUser();
  const ownerId = sessionOwnerId(user?.id);
  if (!ownerId) {
    return fail("unauthenticated", UNAUTHENTICATED_MESSAGE);
  }

  const prefix = avatarFolderPrefix(ownerId);
  if (!prefix) {
    return fail("unauthorized_path", REMOVE_FAILED_MESSAGE);
  }

  const listed = await store.listOwnAvatarPaths(ownerId);
  const removable = (listed.paths ?? []).filter((path) =>
    isAllowedAvatarStoragePath(path, ownerId),
  );
  if (removable.length > 0) {
    await store.removePaths(removable);
  }

  const profileUpdate = await store.updateProfileAvatar(ownerId, null);
  if (profileUpdate.error) {
    return fail("profile_failed", REMOVE_FAILED_MESSAGE);
  }

  return { ok: true, avatarUrl: null, replaced: removable.length > 0 };
}

export function sanitizeProfileAvatarUrl(
  avatarUrl: string | null,
  supabaseUrl: string,
  userId: string,
): string | null {
  return sanitizeStoredAvatarUrl(avatarUrl, supabaseUrl, userId);
}
