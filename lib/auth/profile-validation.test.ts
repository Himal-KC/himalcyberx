import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const validation = (await import(
  pathToFileURL(join(testDir, "profile-validation.ts")).href
)) as typeof import("./profile-validation");

describe("learner profile validation", () => {
  it("strips HTML and control characters to prevent stored XSS", () => {
    const result = validation.validateProfileFields({
      displayName: "<script>alert(1)</script>Ada",
      username: "ada_lovelace",
      bio: "Hello <img src=x onerror=alert(1)> world",
    });

    assert.equal(result.ok, true);
    assert.equal(result.values.display_name, "Ada");
    assert.equal(result.values.bio, "Hello  world");
    assert.doesNotMatch(JSON.stringify(result.values), /<script/i);
  });

  it("rejects email addresses as public profile fields", () => {
    const result = validation.validateProfileFields({
      displayName: "learner@example.com",
      username: "user@example.com",
      bio: "learner@example.com",
    });

    assert.equal(result.ok, false);
    assert.ok(result.fieldErrors.displayName);
    assert.ok(result.fieldErrors.username);
    assert.ok(result.fieldErrors.bio);
  });

  it("rejects reserved and invalid usernames", () => {
    const reserved = validation.validateProfileFields({
      displayName: "Ada",
      username: "hcx_admin",
      bio: "",
    });
    assert.equal(reserved.ok, false);

    const invalid = validation.validateProfileFields({
      displayName: "Ada",
      username: "Ada Lovelace!",
      bio: "",
    });
    assert.equal(invalid.ok, false);
  });

  it("normalizes usernames to lowercase", () => {
    const result = validation.validateProfileFields({
      displayName: "Ada",
      username: "Ada_Lovelace",
      bio: "Defender.",
    });
    assert.equal(result.ok, true);
    assert.equal(result.values.username, "ada_lovelace");
  });

  it("does not include email, role, or user_id in update payloads", () => {
    const payload = validation.buildProfileUpdatePayload({
      display_name: "Ada",
      username: "ada",
      bio: "Labs learner",
    });

    const keys = Object.keys(payload);
    assert.deepEqual(keys.sort(), ["bio", "display_name", "updated_at", "username"].sort());
    assert.equal("email" in payload, false);
    assert.equal("user_id" in payload, false);
    assert.equal("role" in payload, false);
    assert.doesNotMatch(JSON.stringify(payload), /hcx_admin/);
  });
});
