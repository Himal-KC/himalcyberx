import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MAX_AVATAR_SIZE_BYTES } from "../auth/constants.ts";
import type { AvatarFileLike } from "./avatars.ts";

const testDir = dirname(fileURLToPath(import.meta.url));

const avatars = (await import(
  pathToFileURL(join(testDir, "avatars.ts")).href
)) as typeof import("./avatars");

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SUPABASE_URL = "https://xyz.supabase.co";

function jpegBytes(extra = 0): Uint8Array {
  const bytes = new Uint8Array(14 + extra);
  bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  bytes[bytes.length - 2] = 0xff;
  bytes[bytes.length - 1] = 0xd9;
  return bytes;
}

function pngBytes(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
}

function webpBytes(): Uint8Array {
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x18, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x00, 0x00,
  ]);
}

function gifBytes(): Uint8Array {
  return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
}

function fakeFile(
  bytes: Uint8Array,
  type: string,
  name = "avatar.bin",
): AvatarFileLike {
  const copy = bytes.slice();
  return {
    name,
    type,
    size: copy.byteLength,
    arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
  };
}

describe("avatar file extraction and metadata", () => {
  it("accepts File-like objects that are not instanceof File", () => {
    const bytes = jpegBytes();
    const blobLike = fakeFile(bytes, "image/jpeg", "photo.jpg");
    assert.equal(blobLike instanceof File, false);
    assert.equal(avatars.isAvatarFileLike(blobLike), true);

    const file = new File([new Uint8Array(bytes)], "photo.jpg", { type: "image/jpeg" });
    assert.equal(file instanceof File, true);
    assert.equal(avatars.isAvatarFileLike(file), true);

    const formData = new FormData();
    formData.set("avatar", file);
    const extracted = avatars.getAvatarFileFromFormData(formData);
    assert.ok(extracted);
    assert.equal(extracted.size, bytes.byteLength);
    assert.equal(extracted.type, "image/jpeg");
  });

  it("treats empty and missing files as no selection", () => {
    const emptyForm = new FormData();
    assert.equal(avatars.getAvatarFileFromFormData(emptyForm), null);

    const stringForm = new FormData();
    stringForm.set("avatar", "https://evil.example/avatar.jpg");
    assert.equal(avatars.getAvatarFileFromFormData(stringForm), null);

    const emptyFileForm = new FormData();
    emptyFileForm.set(
      "avatar",
      new File([], "empty.jpg", { type: "image/jpeg" }),
    );
    assert.equal(avatars.getAvatarFileFromFormData(emptyFileForm), null);

    assert.equal(
      avatars.validateAvatarMetadata({ type: "image/jpeg", size: 0 }).error,
      avatars.AVATAR_EMPTY_ERROR,
    );
  });

  it("rejects unsupported MIME types and files larger than 1 MB", () => {
    assert.equal(
      avatars.validateAvatarMetadata({ type: "image/gif", size: 12 }).error,
      avatars.AVATAR_TYPE_ERROR,
    );
    assert.equal(
      avatars.validateAvatarMetadata({ type: "application/pdf", size: 12 }).error,
      avatars.AVATAR_TYPE_ERROR,
    );
    assert.equal(
      avatars.validateAvatarMetadata({
        type: "image/jpeg",
        size: MAX_AVATAR_SIZE_BYTES + 1,
      }).error,
      avatars.AVATAR_SIZE_ERROR,
    );
    assert.equal(avatars.validateAvatarFile({ type: "image/png", size: 80 }).valid, true);
  });
});

describe("avatar magic-byte validation", () => {
  it("accepts JPEG, PNG, and WebP bytes", () => {
    assert.equal(avatars.sniffAvatarMime(jpegBytes()), "image/jpeg");
    assert.equal(avatars.sniffAvatarMime(pngBytes()), "image/png");
    assert.equal(avatars.sniffAvatarMime(webpBytes()), "image/webp");
    assert.equal(avatars.validateAvatarBytes(jpegBytes(), "image/jpeg").valid, true);
    assert.equal(avatars.validateAvatarBytes(pngBytes(), "image/png").valid, true);
    assert.equal(avatars.validateAvatarBytes(webpBytes(), "image/webp").valid, true);
    assert.equal(avatars.validateAvatarBytes(jpegBytes(), "image/jpg").valid, true);
  });

  it("rejects GIF, empty buffers, oversized buffers, and MIME/magic mismatches", () => {
    assert.equal(avatars.validateAvatarBytes(gifBytes(), "image/gif").valid, false);
    assert.equal(avatars.validateAvatarBytes(gifBytes(), "image/jpeg").valid, false);
    assert.equal(avatars.validateAvatarBytes(new Uint8Array(), "image/jpeg").valid, false);
    assert.equal(
      avatars.validateAvatarBytes(jpegBytes(), "image/png").error,
      avatars.AVATAR_TYPE_ERROR,
    );

    const oversized = jpegBytes(MAX_AVATAR_SIZE_BYTES);
    assert.ok(oversized.byteLength > MAX_AVATAR_SIZE_BYTES);
    assert.equal(
      avatars.validateAvatarBytes(oversized, "image/jpeg").error,
      avatars.AVATAR_SIZE_ERROR,
    );
  });

  it("validates uploads using bytes rather than filename extensions", async () => {
    const jpegNamedGif = fakeFile(jpegBytes(), "image/jpeg", "photo.gif");
    const result = await avatars.validateAvatarUpload(jpegNamedGif);
    assert.equal(result.valid, true);
    assert.equal(result.mimeType, "image/jpeg");

    const gifNamedJpg = fakeFile(gifBytes(), "image/jpeg", "photo.jpg");
    const rejected = await avatars.validateAvatarUpload(gifNamedJpg);
    assert.equal(rejected.valid, false);
  });
});

describe("avatar path generation and traversal", () => {
  it("generates a deterministic owner-scoped path", () => {
    assert.equal(
      avatars.buildAvatarStoragePath(USER_A, "image/png"),
      `${USER_A}/avatar.png`,
    );
    assert.equal(
      avatars.buildAvatarStoragePath(USER_A, "image/jpeg"),
      `${USER_A}/avatar.jpg`,
    );
    assert.equal(
      avatars.buildAvatarStoragePath(USER_A, "image/webp"),
      `${USER_A}/avatar.webp`,
    );
    assert.equal(
      avatars.buildAvatarStoragePath(USER_A, "image/jpg"),
      `${USER_A}/avatar.jpg`,
    );
  });

  it("rejects path traversal, non-UUID owners, and unknown MIME types", () => {
    assert.equal(avatars.buildAvatarStoragePath("../etc/passwd", "image/jpeg"), null);
    assert.equal(
      avatars.buildAvatarStoragePath(`${USER_A}/../${USER_B}`, "image/jpeg"),
      null,
    );
    assert.equal(avatars.buildAvatarStoragePath("user-1", "image/png"), null);
    assert.equal(avatars.buildAvatarStoragePath(USER_A, "image/gif"), null);
    assert.equal(
      avatars.isAllowedAvatarStoragePath(`${USER_A}/../${USER_B}/avatar.jpg`, USER_A),
      false,
    );
    assert.equal(
      avatars.isAllowedAvatarStoragePath(`${USER_B}/avatar.jpg`, USER_A),
      false,
    );
    assert.equal(
      avatars.isAllowedAvatarStoragePath(`${USER_A}/nested/avatar.jpg`, USER_A),
      false,
    );
    assert.equal(
      avatars.isAllowedAvatarStoragePath(`${USER_A}/avatar.jpg`, USER_A),
      true,
    );
  });
});

describe("stored avatar URL safety", () => {
  it("accepts only public avatars URLs owned by the session user", () => {
    const owned = `https://xyz.supabase.co/storage/v1/object/public/avatars/${USER_A}/avatar.png?v=1`;
    assert.equal(avatars.isOwnedAvatarUrl(owned, SUPABASE_URL, USER_A), true);
    assert.equal(
      avatars.sanitizeStoredAvatarUrl(owned, SUPABASE_URL, USER_A),
      owned,
    );
  });

  it("rejects arbitrary external avatar URLs and other users' paths", () => {
    const external = "https://evil.example/avatar.jpg";
    const otherUser = `https://xyz.supabase.co/storage/v1/object/public/avatars/${USER_B}/avatar.jpg`;
    const articleImage =
      "https://xyz.supabase.co/storage/v1/object/public/article-images/articles/pic.jpg";
    const traversal = `https://xyz.supabase.co/storage/v1/object/public/avatars/${USER_A}/../${USER_B}/avatar.jpg`;

    assert.equal(avatars.rejectExternalAvatarUrl(external, SUPABASE_URL, USER_A), true);
    assert.equal(avatars.isOwnedAvatarUrl(external, SUPABASE_URL, USER_A), false);
    assert.equal(avatars.isOwnedAvatarUrl(otherUser, SUPABASE_URL, USER_A), false);
    assert.equal(avatars.isOwnedAvatarUrl(articleImage, SUPABASE_URL, USER_A), false);
    assert.equal(avatars.isOwnedAvatarUrl("javascript:alert(1)", SUPABASE_URL, USER_A), false);
    assert.equal(avatars.isOwnedAvatarUrl(traversal, SUPABASE_URL, USER_A), false);
    assert.equal(
      avatars.sanitizeStoredAvatarUrl(external, SUPABASE_URL, USER_A),
      null,
    );
    assert.equal(
      avatars.buildPublicAvatarUrl(SUPABASE_URL, USER_A, "image/png"),
      `https://xyz.supabase.co/storage/v1/object/public/avatars/${USER_A}/avatar.png`,
    );
  });
});
