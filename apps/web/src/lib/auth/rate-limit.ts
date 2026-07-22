import { createHmac } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiters = new Map<string, Ratelimit>();
let redis: Redis | undefined;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  redis ??= new Redis({ url, token });
  return redis;
}

function getLimiter(limit: number, windowMs: number) {
  const redisClient = getRedis();
  if (!redisClient) return null;

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `tahaddi:ratelimit:${cacheKey}`,
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }

  return limiter;
}

export function hashRateLimitKey(scope: string, identifiers: string[]) {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (!secret) {
    throw new Error('RATE_LIMIT_HMAC_SECRET is required when distributed rate limiting is enabled.');
  }

  return createHmac('sha256', secret)
    .update(JSON.stringify({ scope, identifiers }))
    .digest('hex');
}

function parseLegacyRateLimitKey(key: string) {
  const separatorIndex = key.indexOf(':');
  if (separatorIndex === -1) {
    return { scope: 'default', identifiers: [key] };
  }

  return {
    scope: key.slice(0, separatorIndex),
    identifiers: [key.slice(separatorIndex + 1)],
  };
}

export async function checkRateLimit(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) {
    return process.env.NODE_ENV !== 'production';
  }

  const { scope, identifiers } = parseLegacyRateLimitKey(key);
  return (await limiter.limit(hashRateLimitKey(scope, identifiers))).success;
}

export function resetRateLimitsForTests() {
  limiters.clear();
  redis = undefined;
}
