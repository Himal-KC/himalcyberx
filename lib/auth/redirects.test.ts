import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const { getSafeRedirectPath, buildLoginRedirectPath } = (await import(
  pathToFileURL(join(testDir, "redirects.ts")).href
)) as typeof import("./redirects");

describe("learner safe redirects", () => {
  it("allows same-origin relative profile paths", () => {
    assert.equal(getSafeRedirectPath("/profile"), "/profile");
    assert.equal(getSafeRedirectPath("/tutorials"), "/tutorials");
  });

  it("rejects open redirects and protocol-relative URLs", () => {
    assert.equal(getSafeRedirectPath("https://evil.example"), "/profile");
    assert.equal(getSafeRedirectPath("//evil.example"), "/profile");
    assert.equal(getSafeRedirectPath("/\\evil.example"), "/profile");
    assert.equal(getSafeRedirectPath("\\evil.example"), "/profile");
    assert.equal(getSafeRedirectPath("%2F%2Fevil.example"), "/profile");
  });

  it("rejects admin destinations", () => {
    assert.equal(getSafeRedirectPath("/admin"), "/profile");
    assert.equal(getSafeRedirectPath("/admin/articles"), "/profile");
    assert.equal(getSafeRedirectPath("/admin/login"), "/profile");
  });

  it("rejects login as a post-auth destination", () => {
    assert.equal(getSafeRedirectPath("/login"), "/profile");
  });

  it("builds a login next param without opening a redirect", () => {
    assert.equal(buildLoginRedirectPath("/profile"), "/login");
    assert.equal(
      buildLoginRedirectPath("//evil.example"),
      "/login",
    );
    assert.match(buildLoginRedirectPath("/articles/example"), /\?next=/);
    assert.doesNotMatch(buildLoginRedirectPath("/admin"), /admin/);
  });
});
