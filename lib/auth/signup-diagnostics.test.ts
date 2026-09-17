import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const { safeRedirectOrigin } = (await import(
  pathToFileURL(join(testDir, "signup-diagnostics.ts")).href
)) as typeof import("./signup-diagnostics");

describe("signup diagnostics", () => {
  it("extracts redirect origin without leaking query params", () => {
    assert.equal(
      safeRedirectOrigin("https://himalcyberx.com/auth/callback?next=/profile"),
      "https://himalcyberx.com",
    );
    assert.equal(safeRedirectOrigin("not-a-url"), null);
  });
});
