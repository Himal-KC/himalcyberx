const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export const HONEYPOT_FIELD_NAME = "_hcx_hp";

export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeText(value: string, maxLength?: number): string {
  const trimmed = value.trim();
  if (maxLength !== undefined) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

export function isNonEmptyText(value: string): boolean {
  return value.trim().length > 0;
}
