import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..");

const adminAccess = (await import(
  pathToFileURL(join(testDir, "admin-access.ts")).href
)) as typeof import("./admin-access");

const v2Sql = readFileSync(
  join(repoRoot, "supabase", "v2-admin-rls-foundation.sql"),
  "utf8",
);

function learnerUser(email = "learner@example.com") {
  return {
    email,
    app_metadata: { role: "user" },
  };
}

function adminUser(email = "admin@himalcyberx.com") {
  return {
    email,
    app_metadata: { role: adminAccess.HCX_ADMIN_ROLE },
  };
}

describe("HCX admin authorization (application layer)", () => {
  it("rejects learner without hcx_admin role", () => {
    assert.equal(adminAccess.isAllowedAdminUser(learnerUser()), false);
    assert.equal(adminAccess.hasHcxAdminRole(learnerUser()), false);
  });

  it("allows hcx_admin role", () => {
    assert.equal(adminAccess.isAllowedAdminUser(adminUser()), true);
  });

  it("rejects authenticated user with no app_metadata role", () => {
    assert.equal(adminAccess.isAllowedAdminUser({ email: "x@y.com" }), false);
  });

  it("rejects client self-assigned role in user_metadata only", () => {
    assert.equal(
      adminAccess.isAllowedAdminUser({
        email: "attacker@example.com",
        app_metadata: {},
        user_metadata: { role: adminAccess.HCX_ADMIN_ROLE },
      } as { email: string; app_metadata: Record<string, unknown> }),
      false,
    );
  });

  it("requires email allowlist when HCX_ADMIN_EMAIL is configured", () => {
    const original = process.env.HCX_ADMIN_EMAIL;
    process.env.HCX_ADMIN_EMAIL = "admin@himalcyberx.com";
    try {
      assert.equal(
        adminAccess.isAllowedAdminUser(
          adminUser("other@example.com"),
        ),
        false,
      );
      assert.equal(
        adminAccess.isAllowedAdminUser(
          adminUser("admin@himalcyberx.com"),
        ),
        true,
      );
    } finally {
      if (original === undefined) {
        delete process.env.HCX_ADMIN_EMAIL;
      } else {
        process.env.HCX_ADMIN_EMAIL = original;
      }
    }
  });
});

describe("V2 admin RLS SQL contract", () => {
  it("defines is_hcx_admin()", () => {
    assert.match(v2Sql, /CREATE OR REPLACE FUNCTION public\.is_hcx_admin\(\)/);
    assert.match(v2Sql, /'role'\) = 'hcx_admin'/);
  });

  it("drops broad authenticated CMS policies", () => {
    assert.match(
      v2Sql,
      /DROP POLICY IF EXISTS "Authenticated users can insert articles"/,
    );
    assert.match(
      v2Sql,
      /DROP POLICY IF EXISTS "Authenticated users can read agent runs"/,
    );
  });

  it("requires is_hcx_admin for admin CRUD on CMS tables", () => {
    for (const fragment of [
      'HCX admin can insert articles',
      'HCX admin can update site settings',
      'HCX admin can read subscribers',
      'HCX admin can read messages',
      'HCX admin can insert agent runs',
    ]) {
      assert.match(v2Sql, new RegExp(fragment.replace(/ /g, " ")));
      const idx = v2Sql.indexOf(fragment);
      assert.ok(idx >= 0);
      const slice = v2Sql.slice(idx, idx + 400);
      assert.match(slice, /is_hcx_admin\(\)/);
    }
  });

  it("preserves public anon behaviors in repo policy files", () => {
    const publicArticles = readFileSync(
      join(repoRoot, "supabase", "public-article-policies.sql"),
      "utf8",
    );
    const subscribers = readFileSync(
      join(repoRoot, "supabase", "subscribers-policies.sql"),
      "utf8",
    );
    const messages = readFileSync(
      join(repoRoot, "supabase", "messages-policies.sql"),
      "utf8",
    );
    assert.match(publicArticles, /Public can read published articles/);
    assert.match(subscribers, /Public can subscribe/);
    assert.match(messages, /Public can send messages/);
  });

  it("adds learner published read for authenticated JWT on content tables", () => {
    assert.match(
      v2Sql,
      /Authenticated users can read published articles/,
    );
    assert.match(v2Sql, /status = 'published'/);
  });

  it("restricts storage write/delete to is_hcx_admin", () => {
    assert.match(v2Sql, /HCX admin can upload article images/);
    assert.match(v2Sql, /HCX admin can delete article images/);
    const uploadIdx = v2Sql.indexOf("HCX admin can upload article images");
    assert.ok(uploadIdx >= 0);
    assert.match(v2Sql.slice(uploadIdx, uploadIdx + 500), /is_hcx_admin\(\)/);
  });

  it("does not add policies on service-role-only notification tables", () => {
    assert.doesNotMatch(v2Sql, /ON public\.content_notifications/);
    assert.doesNotMatch(v2Sql, /ON public\.message_replies/);
  });

  it("creates profiles with owner-only RLS and no email column", () => {
    assert.match(v2Sql, /CREATE TABLE IF NOT EXISTS public\.profiles/);
    const profilesStart = v2Sql.indexOf("CREATE TABLE IF NOT EXISTS public.profiles");
    const profilesEnd = v2Sql.indexOf(
      "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY",
    );
    const profilesDdl = v2Sql.slice(profilesStart, profilesEnd);
    assert.doesNotMatch(profilesDdl, /\bemail\s+text/i);
    assert.match(v2Sql, /auth\.uid\(\) = user_id/);
  });
});

describe("V2 admin guards integration (structural)", () => {
  it("admin session uses isAllowedAdminUser on getUser()", () => {
    const sessionSource = readFileSync(
      join(testDir, "admin-session.ts"),
      "utf8",
    );
    assert.match(sessionSource, /getUser\(\)/);
    assert.match(sessionSource, /isAllowedAdminUser\(user\)/);
  });

  it("middleware rejects non-admin authenticated users on admin routes", () => {
    const middlewareSource = readFileSync(
      join(testDir, "middleware.ts"),
      "utf8",
    );
    assert.match(middlewareSource, /isAllowedAdminUser/);
    assert.match(middlewareSource, /admin\/login/);
  });

  it("Phase 8 publication still uses service role path", () => {
    const notifications = readFileSync(
      join(repoRoot, "lib", "notifications", "content-notifications.ts"),
      "utf8",
    );
    assert.match(notifications, /createServiceServerClient/);
    assert.doesNotMatch(notifications, /isAllowedAdminUser/);
  });

  it("admin notification emails remain separate from publication mail", () => {
    const adminNotifTest = readFileSync(
      join(repoRoot, "lib", "email", "admin-notifications.test.ts"),
      "utf8",
    );
    assert.match(
      adminNotifTest,
      /Phase 8 publication mail unchanged/,
    );
  });

  it("public forms use anon public server client", () => {
    const newsletter = readFileSync(
      join(repoRoot, "lib", "actions", "newsletter.ts"),
      "utf8",
    );
    const contact = readFileSync(
      join(repoRoot, "lib", "actions", "contact.ts"),
      "utf8",
    );
    assert.match(newsletter, /createPublicServerClient/);
    assert.match(contact, /createPublicServerClient/);
  });
});
