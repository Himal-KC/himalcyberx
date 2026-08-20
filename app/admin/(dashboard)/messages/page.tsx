import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesManager } from "@/components/admin/messages/MessagesManager";
import { getAdminMessages } from "@/lib/supabase/admin-messages";

export const metadata: Metadata = {
  title: "Messages | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Inbox
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          MESSAGES
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Review contact form submissions and manage message status.
        </p>
      </div>

      <Suspense fallback={null}>
        <MessagesManager messages={messages} />
      </Suspense>
    </div>
  );
}
