import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MAX_AVATAR_SIZE_BYTES } from "../auth/constants.ts";
import type { AvatarFileLike } from "./avatars.ts";
import type { AvatarUploadStore } from "./avatar-upload-core.ts";

const testDir = dirname(fileURLToPath(import.meta.url));

const { removeOwnAvatar, uploadOwnAvatar } = (await import(
  pathToFileURL(join(testDir, "avatar-upload-core.ts")).href
)) as typeof import("./avatar-upload-core");

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SUPABASE_URL = "https://xyz.supabase.co";
const NOW = new Date("2026-09-17T10:00:00.000Z");

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
  return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
}

function fakeFile(bytes: Uint8Array, type: string, name = "avatar.bin"): AvatarFileLike {
  const copy = bytes.slice();
  return {
    name,
    type,
    size: copy.byteLength,
    arrayBuffer: async () =>
      copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
  };
}

function createMemoryStore(options: {
  sessionUserId: string | null;
  existingPaths?: string[];
  uploadFails?: boolean;
  profileFails?: boolean;
}): AvatarUploadStore & {
  objects: Map<string, { contentType: string; size: number }>;
  uploadedPaths: string[];
  removedPaths: string[];
  profileWrites: Array<string | null>;
  ownerIdsSeen: string[];
} {
  const objects = new Map<string, { contentType: string; size: number }>();
  for (const path of options.existingPaths ?? []) {
    objects.set(path, { contentType: "image/jpeg", size: 12 });
  }

  const uploadedPaths: string[] = [];
  const removedPaths: string[] = [];
  const profileWrites: Array<string | null> = [];
  const ownerIdsSeen: string[] = [];

  function requireOwnPath(path: string): string | null {
    if (!options.sessionUserId) {
      return "unauthenticated";
    }
    if (!path.startsWith(`${options.sessionUserId}/`)) {
      return "row-level security";
    }
    return null;
  }

  const store: AvatarUploadStore & {
    objects: Map<string, { contentType: string; size: number }>;
    uploadedPaths: string[];
    removedPaths: string[];
    profileWrites: Array<string | null>;
    ownerIdsSeen: string[];
  } = {
    objects,
    uploadedPaths,
    removedPaths,
    profileWrites,
    ownerIdsSeen,
    now: () => NOW,
    getSessionUser: async () =>
      options.sessionUserId ? { id: options.sessionUserId } : null,
    getSupabaseUrl: () => SUPABASE_URL,
    uploadAvatar: async (path, bytes, contentType) => {
      const denied = requireOwnPath(path);
      if (denied) {
        return { error: denied };
      }
      if (options.uploadFails) {
        return { error: "storage failed" };
      }
      uploadedPaths.push(path);
      objects.set(path, { contentType, size: bytes.byteLength });
      return { error: null };
    },
    listOwnAvatarPaths: async (userId) => {
      ownerIdsSeen.push(userId);
      if (!options.sessionUserId || userId !== options.sessionUserId) {
        return { paths: [], error: "row-level security" };
      }
      return {
        paths: [...objects.keys()].filter((path) =>
          path.startsWith(`${userId}/`),
        ),
        error: null,
      };
    },
    removePaths: async (paths) => {
      for (const path of paths) {
        const denied = requireOwnPath(path);
        if (denied) {
          return { error: denied };
        }
        removedPaths.push(path);
        objects.delete(path);
      }
      return { error: null };
    },
    updateProfileAvatar: async (userId, avatarUrl) => {
      ownerIdsSeen.push(userId);
      if (!options.sessionUserId || userId !== options.sessionUserId) {
        return { error: "row-level security" };
      }
      if (options.profileFails) {
        return { error: "profile update failed" };
      }
      profileWrites.push(avatarUrl);
      return { error: null };
    },
  };

  return store;
}

describe("avatar upload authorization", () => {
  it("rejects signed-out uploads", async () => {
    const store = createMemoryStore({ sessionUserId: null });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(jpegBytes(), "image/jpeg", "me.jpg"),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "unauthenticated");
    }
    assert.equal(store.uploadedPaths.length, 0);
  });

  it("never uploads to another user's path", async () => {
    const store = createMemoryStore({ sessionUserId: USER_A });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(pngBytes(), "image/png", "me.png"),
      claimedUserId: USER_B,
      claimedPath: `${USER_B}/avatar.png`,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(store.uploadedPaths, [`${USER_A}/avatar.png`]);
    assert.equal(
      store.objects.has(`${USER_B}/avatar.png`),
      false,
    );
  });

  it("ignores a forged user_id and claimed external URL", async () => {
    const store = createMemoryStore({ sessionUserId: USER_A });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(webpBytes(), "image/webp", "me.webp"),
      claimedUserId: USER_B,
      claimedAvatarUrl: "https://evil.example/avatar.webp",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.avatarUrl ?? "", new RegExp(`${USER_A}/avatar\\.webp`));
      assert.doesNotMatch(result.avatarUrl ?? "", /evil\.example/);
      assert.doesNotMatch(result.avatarUrl ?? "", new RegExp(USER_B));
    }
    assert.deepEqual(store.uploadedPaths, [`${USER_A}/avatar.webp`]);
  });
});

describe("avatar upload validation and persistence", () => {
  it("accepts JPEG, PNG, and WebP uploads", async () => {
    for (const [bytes, type, path] of [
      [jpegBytes(), "image/jpeg", `${USER_A}/avatar.jpg`],
      [pngBytes(), "image/png", `${USER_A}/avatar.png`],
      [webpBytes(), "image/webp", `${USER_A}/avatar.webp`],
    ] as const) {
      const store = createMemoryStore({ sessionUserId: USER_A });
      const result = await uploadOwnAvatar(store, {
        file: fakeFile(bytes, type),
      });
      assert.equal(result.ok, true);
      assert.deepEqual(store.uploadedPaths, [path]);
    }
  });

  it("rejects unsupported MIME, oversized, and empty files", async () => {
    const store = createMemoryStore({ sessionUserId: USER_A });

    const gif = await uploadOwnAvatar(store, {
      file: fakeFile(gifBytes(), "image/gif", "x.gif"),
    });
    assert.equal(gif.ok, false);
    if (!gif.ok) {
      assert.equal(gif.error, "invalid_type");
    }

    const oversized = jpegBytes(MAX_AVATAR_SIZE_BYTES);
    const large = await uploadOwnAvatar(store, {
      file: fakeFile(oversized, "image/jpeg", "big.jpg"),
    });
    assert.equal(large.ok, false);
    if (!large.ok) {
      assert.equal(large.error, "too_large");
    }

    const empty = await uploadOwnAvatar(store, { file: null });
    assert.equal(empty.ok, false);
    if (!empty.ok) {
      assert.equal(empty.error, "empty_file");
    }

    assert.equal(store.uploadedPaths.length, 0);
  });

  it("replaces a previous avatar and removes the stale object", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      existingPaths: [`${USER_A}/avatar.jpg`],
    });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(pngBytes(), "image/png", "me.png"),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.replaced, true);
    }
    assert.equal(store.objects.has(`${USER_A}/avatar.jpg`), false);
    assert.equal(store.objects.has(`${USER_A}/avatar.png`), true);
    assert.deepEqual(store.removedPaths, [`${USER_A}/avatar.jpg`]);
  });

  it("handles storage failure without writing a profile URL", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      uploadFails: true,
    });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(jpegBytes(), "image/jpeg", "me.jpg"),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "storage_failed");
    }
    assert.deepEqual(store.profileWrites, []);
  });

  it("handles profile update failure after a successful upload", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      profileFails: true,
    });
    const result = await uploadOwnAvatar(store, {
      file: fakeFile(jpegBytes(), "image/jpeg", "me.jpg"),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "profile_failed");
    }
    assert.deepEqual(store.uploadedPaths, [`${USER_A}/avatar.jpg`]);
    assert.deepEqual(store.profileWrites, []);
  });

  it("removes the stored object and clears the profile reference", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      existingPaths: [`${USER_A}/avatar.jpg`],
    });
    const result = await removeOwnAvatar(store);
    assert.equal(result.ok, true);
    assert.deepEqual(store.removedPaths, [`${USER_A}/avatar.jpg`]);
    assert.deepEqual(store.profileWrites, [null]);
  });
});
