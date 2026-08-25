import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";
import { normalizeEmail } from "@/lib/form-validation";

const TOKEN_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/** Marketing emails: 365-day encrypted unsubscribe links. */
export const UNSUBSCRIBE_TOKEN_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

export const UNSUBSCRIBE_TOKEN_EXPIRY_DAYS = 365;

interface UnsubscribeTokenPayload {
  v: typeof TOKEN_VERSION;
  email: string;
  exp: number;
}

function getUnsubscribeSecret(): string | null {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET?.trim();
  return secret || null;
}

function deriveEncryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function encryptPayload(payload: UnsubscribeTokenPayload, secret: string): string {
  const key = deriveEncryptionKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_VERSION,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    authTag.toString("base64url"),
  ].join(".");
}

function decryptPayload(
  token: string,
  secret: string,
): UnsubscribeTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
    return null;
  }

  const [, ivEncoded, ciphertextEncoded, authTagEncoded] = parts;

  if (!ivEncoded || !ciphertextEncoded || !authTagEncoded) {
    return null;
  }

  try {
    const key = deriveEncryptionKey(secret);
    const iv = Buffer.from(ivEncoded, "base64url");
    const ciphertext = Buffer.from(ciphertextEncoded, "base64url");
    const authTag = Buffer.from(authTagEncoded, "base64url");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    return JSON.parse(decrypted) as UnsubscribeTokenPayload;
  } catch {
    return null;
  }
}

export function createUnsubscribeToken(
  email: string,
  now = Date.now(),
): string | null {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    return null;
  }

  const payload: UnsubscribeTokenPayload = {
    v: TOKEN_VERSION,
    email: normalizeEmail(email),
    exp: now + UNSUBSCRIBE_TOKEN_EXPIRY_MS,
  };

  return encryptPayload(payload, secret);
}

export function verifyUnsubscribeToken(
  token: string,
  now = Date.now(),
): string | null {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    return null;
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return null;
  }

  const payload = decryptPayload(trimmedToken, secret);
  if (!payload) {
    return null;
  }

  if (payload.v !== TOKEN_VERSION) {
    return null;
  }

  if (typeof payload.email !== "string" || !payload.email.trim()) {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < now) {
    return null;
  }

  return normalizeEmail(payload.email);
}

export function buildUnsubscribeUrl(email: string): string | null {
  const token = createUnsubscribeToken(email);
  if (!token) {
    return null;
  }

  const url = new URL("/unsubscribe", HIMALCYBERX_SITE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}
