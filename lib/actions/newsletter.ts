"use server";

import type { FormActionState } from "@/lib/form-types";
import { sendWelcomeEmail } from "@/lib/email/resend";
import {
  HONEYPOT_FIELD_NAME,
  isHoneypotFilled,
  isValidEmail,
  normalizeEmail,
} from "@/lib/form-validation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isRlsError, logQueryError } from "@/lib/supabase/errors";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/messages";

const SUCCESS_MESSAGE = "You're subscribed to HimalCyberX.";
const DUPLICATE_MESSAGE =
  "You're already subscribed to HimalCyberX. We'll keep you updated.";

function resolveSource(formData: FormData): string {
  const source = String(formData.get("source") ?? "website").trim();

  if (source === "newsletter" || source === "modal") {
    return source;
  }

  return "website";
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export async function subscribeNewsletter(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD_NAME))) {
    return {
      success: true,
      message: SUCCESS_MESSAGE,
    };
  }

  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return {
      success: false,
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  const email = normalizeEmail(rawEmail);
  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      success: false,
      message: "Subscriptions are temporarily unavailable. Please try again later.",
    };
  }

  const clientIp = await getClientIp();
  const allowed = await enforceRateLimit("newsletter", clientIp);
  if (!allowed) {
    return {
      success: false,
      message: RATE_LIMIT_MESSAGES.newsletter,
    };
  }

  try {
    const supabase = createPublicServerClient();
    const { error } = await supabase.from("subscribers").insert({
      email,
      status: "active",
      source: resolveSource(formData),
    });

    if (error) {
      if (isUniqueViolation(error)) {
        return {
          success: true,
          message: DUPLICATE_MESSAGE,
        };
      }

      logQueryError("subscribeNewsletter", error);

      if (isRlsError(error)) {
        return {
          success: false,
          message:
            "Subscriptions are temporarily unavailable. Please try again later.",
        };
      }

      return {
        success: false,
        message: "Unable to complete your subscription. Please try again.",
      };
    }

    await sendWelcomeEmail(email);

    return {
      success: true,
      message: SUCCESS_MESSAGE,
    };
  } catch {
    return {
      success: false,
      message: "Unable to complete your subscription. Please try again.",
    };
  }
}
