export {
  buildAdminContactDeliveryMeta,
  buildAdminContactNotificationSubject,
  buildAdminSubscriberDeliveryMeta,
  formatAdminNotificationTimestamp,
  formatSubscriberSourceLabel,
  isSafeEmailAddress,
  normalizeTrustedEmail,
  resolveAdminNotificationRecipient,
  sanitizeEmailSubjectFragment,
  toSafeReplyToAddress,
} from "./admin-notification-format.ts";

export function shouldSendAdminSubscriberNotification(options: {
  inserted: boolean;
  duplicate: boolean;
}): boolean {
  return options.inserted && !options.duplicate;
}

export function shouldSendAdminContactNotification(options: {
  inserted: boolean;
}): boolean {
  return options.inserted;
}

export function buildPublicSubscriberInsert(email: string, source: string) {
  return {
    email,
    status: "active" as const,
    source,
  };
}

export function buildPublicContactInsert(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return {
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    status: "new" as const,
  };
}

/**
 * Admin notification is secondary. Failures are logged and never thrown.
 */
export async function sendSecondaryAdminNotification(
  send: () => Promise<unknown>,
  logFailure: (error: unknown) => void,
): Promise<"sent" | "failed"> {
  try {
    await send();
    return "sent";
  } catch (error) {
    logFailure(error);
    return "failed";
  }
}

export async function runSuccessfulSubmissionNotifications(options: {
  sendVisitorEmail: () => Promise<unknown>;
  sendAdminNotification: () => Promise<unknown>;
  logVisitorFailure?: (error: unknown) => void;
  logAdminFailure: (error: unknown) => void;
}): Promise<{ visitorFailed: boolean; adminFailed: boolean }> {
  let visitorFailed = false;

  try {
    await options.sendVisitorEmail();
  } catch (error) {
    visitorFailed = true;
    options.logVisitorFailure?.(error);
  }

  const adminResult = await sendSecondaryAdminNotification(
    options.sendAdminNotification,
    options.logAdminFailure,
  );

  return {
    visitorFailed,
    adminFailed: adminResult === "failed",
  };
}
