import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getNewMessageCount } from "@/lib/supabase/admin-messages";
import { getAdminSessionEmail, requireAdminAuth } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminAuth();
  const [userEmail, newMessageCount] = await Promise.all([
    getAdminSessionEmail(),
    getNewMessageCount(),
  ]);

  return (
    <AdminShell
      userEmail={userEmail ?? "Administrator"}
      newMessageCount={newMessageCount}
    >
      {children}
    </AdminShell>
  );
}
