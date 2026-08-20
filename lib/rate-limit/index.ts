import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitScope = "newsletter" | "contact" | "admin-login";

const LIMIT_CONFIG: Record<
  RateLimitScope,
  { requests: number; window: `${number} m` }
> = {
  newsletter: { requests: 5, window: "10 m" },
  contact: { requests: 3, window: "10 m" },
  "admin-login": { requests: 5, window: "15 m" },
};

let redisClient: Redis | null | undefined;
const limiterCache = new Map<RateLimitScope, Ratelimit>();

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getLimiter(scope: RateLimitScope): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const cached = limiterCache.get(scope);
  if (cached) {
    return cached;
  }

  const config = LIMIT_CONFIG[scope];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `hcx:rl:${scope}`,
  });

  limiterCache.set(scope, limiter);
  return limiter;
}

export function isRateLimitingConfigured(): boolean {
  return getRedisClient() !== null;
}

export async function enforceRateLimit(
  scope: RateLimitScope,
  identifier: string,
): Promise<boolean> {
  const limiter = getLimiter(scope);
  if (!limiter) {
    return true;
  }

  try {
    const result = await limiter.limit(identifier);
    return result.success;
  } catch {
    return true;
  }
}

export async function isCurrentlyRateLimited(
  scope: RateLimitScope,
  identifier: string,
): Promise<boolean> {
  const limiter = getLimiter(scope);
  if (!limiter) {
    return false;
  }

  try {
    const { remaining } = await limiter.getRemaining(identifier);
    return remaining <= 0;
  } catch {
    return false;
  }
}

export async function recordRateLimitedFailure(
  scope: "admin-login",
  identifier: string,
): Promise<void> {
  const limiter = getLimiter(scope);
  if (!limiter) {
    return;
  }

  try {
    await limiter.limit(identifier);
  } catch {
    // Fail open if the limiter is unavailable.
  }
}
