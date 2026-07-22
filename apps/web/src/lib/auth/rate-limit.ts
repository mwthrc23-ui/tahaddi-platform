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
      analytics: true,
    });
    limiters.set(cacheKey, limiter);
  }

  return limiter;
}

export async function checkRateLimit(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) {
    return process.env.NODE_ENV !== 'production';
  }

  return (await limiter.limit(key)).success;
}

export function resetRateLimitsForTests() {
  limiters.clear();
  redis = undefined;
}
