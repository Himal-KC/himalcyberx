"use server";

import type { FormActionState } from "@/lib/form-types";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  CONTACT_SUBJECT_MAX_LENGTH,
} from "@/lib/messages/constants";
import { logPublicContactDiagnostics } from "@/lib/messages/contact-diagnostics";
import {
  HONEYPOT_FIELD_NAME,
  isHoneypotFilled,
  isNonEmptyText,
  isValidEmail,
  normalizeEmail,
  sanitizeText,
} from "@/lib/form-validation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";
import {
  formatDevErrorMessage,
  isDevelopment,
} from "@/lib/supabase/admin-session";

const SUCCESS_MESSAGE =
  "Your message has been sent successfully. We'll get back to you soon.";

const GENERIC_ERROR_MESSAGE =
  "Unable to send your message. Please try again.";

export async function submitContactForm(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD_NAME))) {
    return {
      success: false,
      message: "",
    };
  }

  const fieldErrors: Record<string, string> = {};

  const name = sanitizeText(
    String(formData.get("name") ?? ""),
    CONTACT_NAME_MAX_LENGTH,
  );
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const subject = sanitizeText(
    String(formData.get("subject") ?? ""),
    CONTACT_SUBJECT_MAX_LENGTH,
  );
  const message = sanitizeText(
    String(formData.get("message") ?? ""),
    CONTACT_MESSAGE_MAX_LENGTH,
  );

  if (!isNonEmptyText(name) || name.length < 2) {
    fieldErrors.name = "Please enter your full name (at least 2 characters).";
  }

  if (!email || !isValidEmail(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (!isNonEmptyText(subject) || subject.length < 4) {
    fieldErrors.subject = "Please enter a subject (at least 4 characters).";
  }

  if (!isNonEmptyText(message) || message.length < 20) {
    fieldErrors.message = "Please enter a message (at least 20 characters).";
  }

  if (message.length > CONTACT_MESSAGE_MAX_LENGTH) {
    fieldErrors.message = `Message must be ${CONTACT_MESSAGE_MAX_LENGTH} characters or fewer.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Please correct the errors below and try again.",
      fieldErrors,
    };
  }

  const clientIp = await getClientIp();
  const allowed = await enforceRateLimit("contact", clientIp);
  if (!allowed) {
    return {
      success: false,
      message: RATE_LIMIT_MESSAGES.contact,
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      success: false,
      message: "Unable to send your message right now. Please try again later.",
    };
  }

  try {
    await logPublicContactDiagnostics("submitContactForm");

    const supabase = createPublicServerClient();
    const { error } = await supabase.from("messages").insert({
      name,
      email,
      subject,
      message,
      status: "new",
    });

    if (error) {
      if (isDevelopment()) {
        console.error("[submitContactForm:insert]", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }

      return {
        success: false,
        message: formatDevErrorMessage(error, GENERIC_ERROR_MESSAGE),
      };
    }

    return {
      success: true,
      message: SUCCESS_MESSAGE,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error("[submitContactForm:unexpected]", error);
    }

    return {
      success: false,
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}
