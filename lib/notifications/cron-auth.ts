import "server-only";

import { createHash } from "node:crypto";

function fingerprintPrefix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

function extractSuppliedBearerToken(authorization: string | null): string {
  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length);
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  const authorized = Boolean(secret) && authorization === `Bearer ${secret}`;

  if (!authorized) {
    const suppliedToken = extractSuppliedBearerToken(authorization);
    const expectedSecretFingerprintPrefix = fingerprintPrefix(secret ?? "");
    const suppliedTokenFingerprintPrefix = fingerprintPrefix(suppliedToken);

    console.error("[cron-auth:diagnostic]", {
      hasCronSecret: Boolean(secret),
      cronSecretLength: secret?.length ?? 0,
      expectedSecretFingerprintPrefix,
      hasAuthorizationHeader: authorization !== null,
      authorizationStartsWithBearer: authorization?.startsWith("Bearer ") ?? false,
      suppliedTokenLength: suppliedToken.length,
      suppliedTokenFingerprintPrefix,
      fingerprintsMatch:
        expectedSecretFingerprintPrefix === suppliedTokenFingerprintPrefix,
      lengthsMatch: (secret?.length ?? 0) === suppliedToken.length,
    });
  }

  return authorized;
}
