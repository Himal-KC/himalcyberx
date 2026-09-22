import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("learner dashboard access and routing", () => {
  it("protects /dashboard in middleware and proxy", () => {
    const middleware = readRepoFile("lib/supabase/middleware.ts");
    const proxy = readRepoFile("proxy.ts");
    assert.match(middleware, /LEARNER_DASHBOARD_PATH/);
    assert.match(middleware, /buildLoginRedirectPath\(pathname\)/);
    assert.match(proxy, /\/dashboard/);
  });

  it("requires session on dashboard pages without accepting user_id", () => {
    const dashboardPage = readRepoFile("app/dashboard/page.tsx");
    const savedPage = readRepoFile("app/dashboard/saved/page.tsx");
    const loader = readRepoFile("lib/dashboard/load-learner-dashboard.ts");

    assert.match(dashboardPage, /requireLearnerSession\(LEARNER_DASHBOARD_PATH\)/);
    assert.match(savedPage, /requireLearnerSession\(LEARNER_DASHBOARD_SAVED_PATH\)/);
    assert.match(loader, /getLearnerServerClient/);
    assert.doesNotMatch(loader, /service-server/);
    assert.doesNotMatch(loader, /service_role/);
    assert.doesNotMatch(dashboardPage, /formData\.get\("user_id"\)/);
  });

  it("marks dashboard routes as private and dynamic", () => {
    const dashboardPage = readRepoFile("app/dashboard/page.tsx");
    assert.match(dashboardPage, /force-dynamic/);
    assert.match(dashboardPage, /robots: AUTH_ROBOTS|buildAuthPageMetadata/);
  });
});

describe("learner dashboard security boundaries", () => {
  it("does not expose admin navigation or CMS writes", () => {
    const headerNav = readRepoFile("components/auth/HeaderAuthNav.tsx");
    const dashboardView = readRepoFile("components/dashboard/LearnerDashboardView.tsx");

    assert.match(headerNav, /LEARNER_DASHBOARD_PATH/);
    assert.doesNotMatch(headerNav, /\/admin/);
    assert.doesNotMatch(dashboardView, /\/admin/);
    assert.doesNotMatch(dashboardView, /HCX Admin/);
  });

  it("keeps homepage shell unchanged and admin protection intact", () => {
    const homePage = readRepoFile("app/page.tsx");
    const middleware = readRepoFile("lib/supabase/middleware.ts");
    const adminAccess = readRepoFile("lib/supabase/admin-access.ts");

    assert.doesNotMatch(homePage, /loadLearnerDashboard/);
    assert.match(middleware, /isAllowedAdminUser/);
    assert.match(adminAccess, /hcx_admin/);
  });

  it("reuses bookmark and progress modules without bypassing owner RLS", () => {
    const loader = readRepoFile("lib/dashboard/load-learner-dashboard.ts");
    const bookmarksOps = readRepoFile("lib/bookmarks/operations.ts");
    const learningOps = readRepoFile("lib/learning/operations.ts");

    assert.match(loader, /getContinueLearningItems/);
    assert.match(loader, /getCompletedLearningItems/);
    assert.match(loader, /getLearningProgressStatusCounts/);
    assert.match(bookmarksOps, /getLearnerServerClient/);
    assert.match(learningOps, /getLearnerServerClient/);
    assert.doesNotMatch(loader, /createServiceServerClient/);
  });
});

describe("learner dashboard header privacy", () => {
  it("does not render email in dashboard header components", () => {
    const header = readRepoFile("components/dashboard/DashboardHeader.tsx");
    assert.doesNotMatch(header, /\bemail\b/i);
    assert.match(header, /Edit Profile/);
  });
});
