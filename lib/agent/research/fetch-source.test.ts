import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const { classifyWebClaimType } = (await import(
  pathToFileURL(join(testDir, "claim-classifier.ts")).href
)) as typeof import("./claim-classifier");

describe("fetch-source behavior expectations", () => {
  it("classifies actionable preparedness guidance from page statements", () => {
    const statement =
      "Organizations should maintain offline backups and test restoration procedures to prepare for ransomware incidents.";

    assert.equal(classifyWebClaimType(statement), "preparedness");
  });

  it("keeps NVD structured claim types separate from web classification", () => {
    assert.equal(
      classifyWebClaimType("CVE-2024-21412 is recorded in the NIST National Vulnerability Database."),
      "cve_id",
    );
  });
});
