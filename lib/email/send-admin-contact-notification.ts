import "server-only";

import { CONTACT_REPLY_TO_EMAIL } from "@/lib/email/constants";
import {
  buildAdminContactDeliveryMeta,
  resolveAdminNotificationRecipient,
} from "@/lib/email/admin-notification-core";
import { logEmailFailure } from "@/lib/email/client";
import { sendResendEmailWithResult } from "@/lib/email/resend-send";
import { buildAdminContactNotificationEmail } from "@/lib/email/templates/admin-contact-notification";
import { getSiteSettings } from "@/lib/settings/site-settings";

export async function sendAdminContactNotification(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt?: Date;
}): Promise<void> {
  const settings = await getSiteSettings();
  const adminEmail = resolveAdminNotificationRecipient({
    siteContactEmail: settings.contactEmail,
    fallbackEmail: CONTACT_REPLY_TO_EMAIL,
  });

  if (!adminEmail) {
    logEmailFailure(
      "sendAdminContactNotification",
      "admin recipient is not configured",
    );
    return;
  }

  const content = buildAdminContactNotificationEmail({
    visitorName: input.name,
    visitorEmail: input.email,
    subject: input.subject,
    message: input.message,
    receivedAt: input.receivedAt ?? new Date(),
  });
  const delivery = buildAdminContactDeliveryMeta({
    adminEmail,
    visitorEmail: input.email,
  });

  const result = await sendResendEmailWithResult(
    {
      ...delivery,
      subject: content.subject,
      html: content.html,
      text: content.text,
    },
    "sendAdminContactNotification",
  );

  if (!result.ok) {
    logEmailFailure(
      "sendAdminContactNotification",
      "Admin contact notification was not accepted by Resend",
    );
  }
}
