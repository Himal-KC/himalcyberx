"use server";

import { redirect } from "next/navigation";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { unsubscribeSubscriberByEmail } from "@/lib/subscribers/unsubscribe";

function redirectToOutcome(
  outcome: "unsubscribed" | "already" | "invalid" | "error",
): never {
  redirect(`/unsubscribe?outcome=${outcome}`);
}

export async function confirmNewsletterUnsubscribe(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirectToOutcome("invalid");
  }

  const email = verifyUnsubscribeToken(token);

  if (!email) {
    redirectToOutcome("invalid");
  }

  const result = await unsubscribeSubscriberByEmail(email);

  if (result.status === "unsubscribed") {
    redirectToOutcome("unsubscribed");
  }

  if (result.status === "already_unsubscribed") {
    redirectToOutcome("already");
  }

  if (result.status === "invalid") {
    redirectToOutcome("invalid");
  }

  redirectToOutcome("error");
}
