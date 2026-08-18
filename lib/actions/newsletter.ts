"use server";

import type { FormActionState } from "@/lib/form-types";
import {
  HONEYPOT_FIELD_NAME,
  isHoneypotFilled,
  isValidEmail,
  normalizeEmail,
} from "@/lib/form-validation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isRlsError, logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

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

  try {
    const supabase = await createClient();
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
