import type { Metadata } from "next";
import { UnsubscribeContent } from "@/components/unsubscribe/UnsubscribeContent";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getSubscriberUnsubscribeState,
  type UnsubscribeResultStatus,
} from "@/lib/subscribers/unsubscribe";

export const metadata: Metadata = buildPageMetadata({
  title: "Unsubscribe",
  description: "Manage your HimalCyberX newsletter subscription preferences.",
  path: "/unsubscribe",
  noIndex: true,
});

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string; outcome?: string }>;
}

function mapOutcomeToStatus(outcome: string): UnsubscribeResultStatus | null {
  switch (outcome) {
    case "unsubscribed":
      return "unsubscribed";
    case "already":
      return "already_unsubscribed";
    case "invalid":
      return "invalid";
    case "error":
      return "error";
    default:
      return null;
  }
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token, outcome } = await searchParams;

  const outcomeStatus = outcome ? mapOutcomeToStatus(outcome.trim()) : null;

  if (outcomeStatus) {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="status" status={outcomeStatus} />
      </PageShell>
    );
  }

  const trimmedToken = token?.trim();

  if (!trimmedToken) {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="status" status="invalid" />
      </PageShell>
    );
  }

  const email = verifyUnsubscribeToken(trimmedToken);

  if (!email) {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="status" status="invalid" />
      </PageShell>
    );
  }

  const lookup = await getSubscriberUnsubscribeState(email);

  if (lookup.status === "active") {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="confirm" token={trimmedToken} />
      </PageShell>
    );
  }

  if (lookup.status === "already_unsubscribed") {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="status" status="already_unsubscribed" />
      </PageShell>
    );
  }

  if (lookup.status === "error") {
    return (
      <PageShell showNewsletter={false}>
        <Breadcrumb items={[{ label: "Unsubscribe" }]} />
        <UnsubscribeContent mode="status" status="error" />
      </PageShell>
    );
  }

  return (
    <PageShell showNewsletter={false}>
      <Breadcrumb items={[{ label: "Unsubscribe" }]} />
      <UnsubscribeContent mode="status" status="invalid" />
    </PageShell>
  );
}
