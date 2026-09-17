import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "../..");

const {
  buildAdminContactDeliveryMeta,
  buildAdminContactNotificationSubject,
  buildAdminSubscriberDeliveryMeta,
  buildPublicContactInsert,
  buildPublicSubscriberInsert,
  formatAdminNotificationTimestamp,
  formatSubscriberSourceLabel,
  resolveAdminNotificationRecipient,
  runSuccessfulSubmissionNotifications,
  sanitizeEmailSubjectFragment,
  shouldSendAdminContactNotification,
  shouldSendAdminSubscriberNotification,
  toSafeReplyToAddress,
} = (await import(
  pathToFileURL(join(testDir, "admin-notification-core.ts")).href
)) as typeof import("./admin-notification-core");

const { escapeHtml } = (await import(
  pathToFileURL(join(testDir, "templates/email-html.ts")).href
)) as typeof import("./templates/email-html");

const { LIMIT_CONFIG } = (await import(
  pathToFileURL(join(testDir, "../rate-limit/index.ts")).href
)) as typeof import("../rate-limit/index");

const {
  CONTACT_FROM_EMAIL,
  CONTACT_REPLY_TO_EMAIL,
  NEWSLETTER_FROM_EMAIL,
  ADMIN_SUBSCRIBER_NOTIFICATION_SUBJECT,
} = (await import(
  pathToFileURL(join(testDir, "constants.ts")).href
)) as typeof import("./constants");

function readRepoFile(...segments: string[]): string {
  return readFileSync(join(repoRoot, ...segments), "utf8");
}

const newsletterAction = readRepoFile("lib/actions/newsletter.ts");
const contactAction = readRepoFile("lib/actions/contact.ts");
const welcomeSender = readRepoFile("lib/email/resend.ts");
const acknowledgementSender = readRepoFile(
  "lib/email/send-contact-acknowledgement.ts",
);
const adminSubscriberSender = readRepoFile(
  "lib/email/send-admin-subscriber-notification.ts",
);
const adminContactSender = readRepoFile(
  "lib/email/send-admin-contact-notification.ts",
);
const adminSubscriberTemplate = readRepoFile(
  "lib/email/templates/admin-subscriber-notification.ts",
);
const adminContactTemplate = readRepoFile(
  "lib/email/templates/admin-contact-notification.ts",
);
const publishNotification = readRepoFile(
  "lib/notifications/publish-notification.ts",
);
const contentNotificationSender = readRepoFile(
  "lib/email/send-content-notification.ts",
);
const contentNotifications = readRepoFile(
  "lib/notifications/content-notifications.ts",
);
const emailClient = readRepoFile("lib/email/client.ts");
const contactForm = readRepoFile("components/forms/ContactForm.tsx");
const newsletterForm = readRepoFile("components/Newsletter.tsx");
const footerNewsletter = readRepoFile("components/footer/FooterNewsletter.tsx");
const subscribeModal = readRepoFile("components/subscribe/SubscribeModal.tsx");
const rateLimitSource = readRepoFile("lib/rate-limit/index.ts");

describe("admin email notifications: subscriber save", () => {
  it("still persists a new subscriber with the existing insert shape", () => {
    assert.deepEqual(
      buildPublicSubscriberInsert("person@example.com", "website"),
      {
        email: "person@example.com",
        status: "active",
        source: "website",
      },
    );

    assert.match(newsletterAction, /from\("subscribers"\)/);
    assert.match(newsletterAction, /buildPublicSubscriberInsert\(email, source\)/);
  });
});

describe("admin email notifications: welcome email", () => {
  it("keeps sending the existing subscriber welcome email after a successful insert", () => {
    assert.match(newsletterAction, /await sendWelcomeEmail\(email\)/);
    assert.match(welcomeSender, /buildWelcomeEmail\(toEmail, unsubscribeUrl\)/);
    assert.match(welcomeSender, /NEWSLETTER_FROM_EMAIL/);
    assert.match(
      readRepoFile("lib/email/templates/welcome.ts"),
      /WELCOME TO HIMALCYBERX/,
    );

    const welcomeIndex = newsletterAction.indexOf("await sendWelcomeEmail(email)");
    const adminIndex = newsletterAction.indexOf(
      "() => sendAdminSubscriberNotification({ email, source })",
    );
    const duplicateIndex = newsletterAction.indexOf("DUPLICATE_MESSAGE");

    assert.ok(welcomeIndex > 0);
    assert.ok(adminIndex > welcomeIndex);
    assert.ok(duplicateIndex > 0 && duplicateIndex < welcomeIndex);
  });
});

describe("admin email notifications: subscriber admin mail", () => {
  it("sends an admin subscriber notification to the trusted recipient", () => {
    const adminEmail = resolveAdminNotificationRecipient({
      siteContactEmail: "contact@himalcyberx.com",
    });
    const delivery = buildAdminSubscriberDeliveryMeta(adminEmail!);

    assert.equal(adminEmail, "contact@himalcyberx.com");
    assert.equal(delivery.to, "contact@himalcyberx.com");
    assert.equal(delivery.from, NEWSLETTER_FROM_EMAIL);
    assert.equal(
      ADMIN_SUBSCRIBER_NOTIFICATION_SUBJECT,
      "New HimalCyberX Subscriber",
    );
    assert.match(adminSubscriberTemplate, /New subscriber/);
    assert.match(adminSubscriberTemplate, /Email:/);
    assert.match(adminSubscriberTemplate, /Source:/);
    assert.match(adminSubscriberTemplate, /Subscribed:/);
    assert.match(
      adminSubscriberSender,
      /resolveAdminNotificationRecipient/,
    );
    assert.match(newsletterAction, /sendAdminSubscriberNotification/);
  });
});

describe("admin email notifications: contact save", () => {
  it("still persists a contact message with the existing insert shape", () => {
    assert.deepEqual(
      buildPublicContactInsert({
        name: "John Smith",
        email: "john@example.com",
        subject: "Collaboration",
        message: "I would like to discuss a research collaboration.",
      }),
      {
        name: "John Smith",
        email: "john@example.com",
        subject: "Collaboration",
        message: "I would like to discuss a research collaboration.",
        status: "new",
      },
    );

    assert.match(contactAction, /from\("messages"\)/);
    assert.match(contactAction, /buildPublicContactInsert/);
  });
});

describe("admin email notifications: contact acknowledgement", () => {
  it("keeps sending the existing contact acknowledgement to the visitor", () => {
    assert.match(
      contactAction,
      /await sendContactAcknowledgementEmail\(name, email\)/,
    );
    assert.match(acknowledgementSender, /CONTACT_FROM_EMAIL/);
    assert.match(acknowledgementSender, /to: toEmail/);
    assert.match(
      acknowledgementSender,
      /buildContactAcknowledgementEmail\(name\)/,
    );

    const ackIndex = contactAction.indexOf(
      "await sendContactAcknowledgementEmail(name, email)",
    );
    const adminIndex = contactAction.indexOf(
      "() => sendAdminContactNotification({ name, email, subject, message })",
    );
    assert.ok(ackIndex > 0);
    assert.ok(adminIndex > ackIndex);
  });
});

describe("admin email notifications: contact admin mail", () => {
  it("sends an admin contact notification with the submitted fields", () => {
    const adminEmail = resolveAdminNotificationRecipient({
      siteContactEmail: "contact@himalcyberx.com",
    });
    const delivery = buildAdminContactDeliveryMeta({
      adminEmail: adminEmail!,
      visitorEmail: "john@example.com",
    });

    assert.equal(delivery.to, "contact@himalcyberx.com");
    assert.equal(
      buildAdminContactNotificationSubject("Collaboration"),
      "New HimalCyberX Contact Message — Collaboration",
    );
    assert.match(adminContactTemplate, /New contact message/);
    assert.match(adminContactTemplate, /Name:/);
    assert.match(adminContactTemplate, /Message:/);
    assert.match(adminContactTemplate, /Received:/);
    assert.match(contactAction, /sendAdminContactNotification/);
    assert.match(
      adminContactSender,
      /buildAdminContactNotificationEmail/,
    );
  });
});

describe("admin email notifications: trusted recipient", () => {
  it("uses Site Settings contact_email and never a client-supplied address", () => {
    assert.equal(
      resolveAdminNotificationRecipient({
        siteContactEmail: "  Contact@HimalCyberX.com ",
        fallbackEmail: CONTACT_REPLY_TO_EMAIL,
      }),
      "contact@himalcyberx.com",
    );

    assert.equal(
      resolveAdminNotificationRecipient({
        siteContactEmail: "",
        fallbackEmail: CONTACT_REPLY_TO_EMAIL,
      }),
      CONTACT_REPLY_TO_EMAIL,
    );

    assert.equal(
      resolveAdminNotificationRecipient({
        siteContactEmail: "not-an-email",
        fallbackEmail: CONTACT_REPLY_TO_EMAIL,
      }),
      CONTACT_REPLY_TO_EMAIL,
    );

    assert.match(adminSubscriberSender, /settings\.contactEmail/);
    assert.match(adminContactSender, /settings\.contactEmail/);
    assert.match(adminSubscriberSender, /CONTACT_REPLY_TO_EMAIL/);
    assert.match(adminContactSender, /CONTACT_REPLY_TO_EMAIL/);
    assert.doesNotMatch(adminSubscriberSender, /HCX_ADMIN_EMAIL/);
    assert.doesNotMatch(adminContactSender, /HCX_ADMIN_EMAIL/);
    assert.doesNotMatch(adminSubscriberSender, /formData\.get\(/);
    assert.doesNotMatch(adminContactSender, /formData\.get\(/);
  });
});

describe("admin email notifications: contact Reply-To", () => {
  it("sets Reply-To to the validated visitor email and keeps From on the HCX identity", () => {
    const delivery = buildAdminContactDeliveryMeta({
      adminEmail: "contact@himalcyberx.com",
      visitorEmail: "John.Smith@Example.com",
    });

    assert.equal(delivery.from, CONTACT_FROM_EMAIL);
    assert.equal(delivery.replyTo, "john.smith@example.com");
    assert.equal(delivery.headers?.["Reply-To"], "john.smith@example.com");
    assert.ok(!delivery.from.includes("john.smith@example.com"));

    assert.equal(toSafeReplyToAddress("not-an-email"), undefined);
    assert.equal(toSafeReplyToAddress("evil@example.com\nBcc: stolen@x.com"), undefined);

    const unsafe = buildAdminContactDeliveryMeta({
      adminEmail: "contact@himalcyberx.com",
      visitorEmail: "not-an-email",
    });
    assert.equal(unsafe.replyTo, undefined);
    assert.equal(unsafe.from, CONTACT_FROM_EMAIL);
  });
});

describe("admin email notifications: HTML escaping", () => {
  it("escapes submitted name, subject and message for HTML notifications", () => {
    const payload = {
      name: `<img src=x onerror="alert(1)">`,
      subject: `Collaboration</title><script>alert(1)</script>`,
      message: `Hello & welcome <b>friend</b>\nClick "here"`,
    };

    assert.equal(
      escapeHtml(payload.name),
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    assert.equal(
      escapeHtml(payload.subject),
      "Collaboration&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    assert.match(escapeHtml(payload.message), /&amp;/);
    assert.match(escapeHtml(payload.message), /&lt;b&gt;/);
    assert.doesNotMatch(escapeHtml(payload.message), /<b>/);

    assert.match(adminContactTemplate, /escapeHtml\(input\.visitorName\)/);
    assert.match(adminContactTemplate, /escapeHtml\(input\.visitorEmail\)/);
    assert.match(adminContactTemplate, /escapeHtml\(input\.subject\)/);
    assert.match(adminContactTemplate, /escapeHtml\(input\.message\)/);
    assert.match(adminSubscriberTemplate, /escapeHtml\(input\.subscriberEmail\)/);
    assert.equal(
      sanitizeEmailSubjectFragment("Collab\r\nBcc: stolen@x.com"),
      "Collab Bcc: stolen@x.com",
    );
  });
});

describe("admin email notifications: secondary failure handling", () => {
  it("does not fail a successful submission when admin notification throws", async () => {
    let visitorSent = false;
    const adminErrors: unknown[] = [];

    const result = await runSuccessfulSubmissionNotifications({
      sendVisitorEmail: async () => {
        visitorSent = true;
      },
      sendAdminNotification: async () => {
        throw new Error("resend unavailable");
      },
      logAdminFailure: (error) => {
        adminErrors.push(error);
      },
    });

    assert.equal(visitorSent, true);
    assert.equal(result.visitorFailed, false);
    assert.equal(result.adminFailed, true);
    assert.equal(adminErrors.length, 1);
    assert.match(newsletterAction, /sendSecondaryAdminNotification/);
    assert.match(contactAction, /sendSecondaryAdminNotification/);
    assert.match(newsletterAction, /success: true/);
    assert.match(contactAction, /SUCCESS_MESSAGE/);
  });
});

describe("admin email notifications: duplicate suppression", () => {
  it("does not send a duplicate admin notification when the existing unique-email dedupe applies", () => {
    assert.equal(
      shouldSendAdminSubscriberNotification({
        inserted: true,
        duplicate: false,
      }),
      true,
    );
    assert.equal(
      shouldSendAdminSubscriberNotification({
        inserted: false,
        duplicate: true,
      }),
      false,
    );
    assert.equal(
      shouldSendAdminContactNotification({ inserted: true }),
      true,
    );

    const uniqueReturn = newsletterAction.indexOf("isUniqueViolation(error)");
    const welcomeCall = newsletterAction.indexOf("await sendWelcomeEmail(email)");
    const adminCall = newsletterAction.indexOf(
      "() => sendAdminSubscriberNotification({ email, source })",
    );
    assert.ok(uniqueReturn > 0 && uniqueReturn < welcomeCall);
    assert.ok(adminCall > welcomeCall);
    assert.match(newsletterAction, /error\.code === "23505"/);
  });
});

describe("admin email notifications: client cannot choose recipient", () => {
  it("does not accept an admin recipient from public forms", () => {
    for (const source of [
      contactForm,
      newsletterForm,
      footerNewsletter,
      subscribeModal,
    ]) {
      assert.doesNotMatch(source, /name=["']admin/i);
      assert.doesNotMatch(source, /name=["']notify/i);
      assert.doesNotMatch(source, /name=["']recipient/i);
      assert.doesNotMatch(source, /RESEND_API_KEY/);
    }

    assert.doesNotMatch(contactAction, /formData\.get\(["']to["']\)/);
    assert.doesNotMatch(contactAction, /formData\.get\(["']recipient["']\)/);
    assert.doesNotMatch(newsletterAction, /formData\.get\(["']to["']\)/);
    assert.doesNotMatch(
      newsletterAction,
      /formData\.get\(["']admin[_-]?email["']\)/,
    );
    assert.match(adminSubscriberSender, /getSiteSettings\(\)/);
    assert.match(adminContactSender, /getSiteSettings\(\)/);
  });
});

describe("admin email notifications: secrets stay server-side", () => {
  it("keeps the Resend API key on the server and out of client forms", () => {
    assert.match(emailClient, /process\.env\.RESEND_API_KEY/);
    assert.match(emailClient, /import "server-only"/);
    assert.doesNotMatch(contactForm, /RESEND_API_KEY/);
    assert.doesNotMatch(newsletterForm, /RESEND_API_KEY/);
    assert.doesNotMatch(footerNewsletter, /RESEND_API_KEY/);
    assert.doesNotMatch(subscribeModal, /RESEND_API_KEY/);
    assert.doesNotMatch(contactAction, /RESEND_API_KEY/);
    assert.doesNotMatch(newsletterAction, /RESEND_API_KEY/);
    assert.match(adminSubscriberSender, /import "server-only"/);
    assert.match(adminContactSender, /import "server-only"/);
  });
});

describe("admin email notifications: rate limiting", () => {
  it("preserves existing newsletter and contact rate limits", () => {
    assert.deepEqual(LIMIT_CONFIG.newsletter, {
      requests: 5,
      window: "10 m",
    });
    assert.deepEqual(LIMIT_CONFIG.contact, {
      requests: 3,
      window: "10 m",
    });

    assert.match(newsletterAction, /enforceRateLimit\("newsletter", clientIp\)/);
    assert.match(contactAction, /enforceRateLimit\("contact", clientIp\)/);

    const newsletterLimit = newsletterAction.indexOf(
      'enforceRateLimit("newsletter"',
    );
    const newsletterInsert = newsletterAction.indexOf('from("subscribers")');
    const contactLimit = contactAction.indexOf('enforceRateLimit("contact"');
    const contactInsert = contactAction.indexOf('from("messages")');

    assert.ok(newsletterLimit > 0 && newsletterLimit < newsletterInsert);
    assert.ok(contactLimit > 0 && contactLimit < contactInsert);
    assert.match(rateLimitSource, /newsletter: \{ requests: 5, window: "10 m" \}/);
    assert.match(rateLimitSource, /contact: \{ requests: 3, window: "10 m" \}/);
  });
});

describe("admin email notifications: Phase 8 publication mail unchanged", () => {
  it("does not alter subscriber publication notification behavior", () => {
    assert.doesNotMatch(publishNotification, /sendAdminSubscriberNotification/);
    assert.doesNotMatch(publishNotification, /sendAdminContactNotification/);
    assert.doesNotMatch(
      contentNotificationSender,
      /sendAdminSubscriberNotification/,
    );
    assert.doesNotMatch(
      contentNotificationSender,
      /sendAdminContactNotification/,
    );
    assert.match(
      publishNotification,
      /export async function notifySubscribersOfNewlyPublicContent/,
    );
    assert.match(
      publishNotification,
      /deliverPublicContentNotification/,
    );
    assert.match(
      contentNotificationSender,
      /sendContentNotificationBroadcast/,
    );
    assert.match(contentNotificationSender, /NEWSLETTER_FROM_EMAIL/);
    assert.match(contentNotifications, /sendContentNotificationBroadcast/);
    assert.match(contentNotifications, /claimContentNotificationRecord/);
  });
});

describe("admin email notifications: formatting helpers", () => {
  it("formats timestamps and subscriber sources for admin copy", () => {
    assert.equal(
      formatAdminNotificationTimestamp("2026-09-17T16:15:00.000Z"),
      "17 Sep 2026, 4:15 PM",
    );
    assert.equal(formatSubscriberSourceLabel("website"), "Website");
    assert.equal(formatSubscriberSourceLabel("newsletter"), "Newsletter");
    assert.equal(formatSubscriberSourceLabel("modal"), "Modal");
    assert.equal(formatSubscriberSourceLabel("anything-else"), "Website");
  });
});
