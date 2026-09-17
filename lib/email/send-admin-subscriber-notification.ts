import "server-only";

import { CONTACT_REPLY_TO_EMAIL } from "@/lib/email/constants";
import {
  buildAdminSubscriberDeliveryMeta,
  resolveAdminNotificationRecipient,
} from "@/lib/email/admin-notification-core";
import { logEmailFailure } from "@/lib/email/client";
import { sendResendEmailWithResult } from "@/lib/email/resend-send";
import { buildAdminSubscriberNotificationEmail } from "@/lib/email/templates/admin-subscriber-notification";
import { getSiteSettings } from "@/lib/settings/site-settings";

export async function sendAdminSubscriberNotification(input: {
  email: string;
  source: string;
  subscribedAt?: Date;
}): Promise<void> {
  const settings = await getSiteSettings();
  const adminEmail = resolveAdminNotificationRecipient({
    siteContactEmail: settings.contactEmail,
    fallbackEmail: CONTACT_REPLY_TO_EMAIL,
  });

  if (!adminEmail) {
    logEmailFailure(
      "sendAdminSubscriberNotification",
      "admin recipient is not configured",
    );
    return;
  }

  const content = buildAdminSubscriberNotificationEmail({
    subscriberEmail: input.email,
    source: input.source,
    subscribedAt: input.subscribedAt ?? new Date(),
  });
  const delivery = buildAdminSubscriberDeliveryMeta(adminEmail);

  const result = await sendResendEmailWithResult(
    {
      ...delivery,
      subject: content.subject,
      html: content.html,
      text: content.text,
    },
    "sendAdminSubscriberNotification",
  );

  if (!result.ok) {
    logEmailFailure(
      "sendAdminSubscriberNotification",
      "Admin subscriber notification was not accepted by Resend",
    );
  }
}
