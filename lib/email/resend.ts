import { Resend } from "resend";
import { NEWSLETTER_FROM_EMAIL } from "@/lib/email/constants";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";

function getResendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey || null;
}

function createResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function logEmailFailure(scope: string, error: unknown): void {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      console.error(`[email:${scope}]`, message);
      return;
    }
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown error";

  console.error(`[email:${scope}]`, message);
}

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  const resend = createResendClient();
  if (!resend) {
    logEmailFailure("sendWelcomeEmail", "RESEND_API_KEY is not configured");
    return;
  }

  const { subject, html, text } = buildWelcomeEmail(toEmail);

  try {
    const { error } = await resend.emails.send({
      from: NEWSLETTER_FROM_EMAIL,
      to: toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      logEmailFailure("sendWelcomeEmail", error);
    }
  } catch (error) {
    logEmailFailure("sendWelcomeEmail", error);
  }
}
