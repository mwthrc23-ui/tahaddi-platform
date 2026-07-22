import { afterEach, describe, expect, it, vi } from 'vitest';

const { limit, ratelimitOptions } = vi.hoisted(() => ({
  limit: vi.fn().mockResolvedValue({ success: true }),
  ratelimitOptions: [] as Array<Record<string, unknown>>,
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }

    limit = limit;

    constructor(options: Record<string, unknown>) {
      ratelimitOptions.push(options);
    }
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {},
}));

import { checkRateLimit, hashRateLimitKey, resetRateLimitsForTests } from './rate-limit';

describe('distributed rate-limit configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    ratelimitOptions.length = 0;
    resetRateLimitsForTests();
  });

  it('creates a stable HMAC for the same scope and identifiers', () => {
    vi.stubEnv('RATE_LIMIT_HMAC_SECRET', 'test-rate-limit-secret');

    const first = hashRateLimitKey('signin', ['203.0.113.4', 'user@example.com']);
    const second = hashRateLimitKey('signin', ['203.0.113.4', 'user@example.com']);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes the HMAC when the scope or identifiers change', () => {
    vi.stubEnv('RATE_LIMIT_HMAC_SECRET', 'test-rate-limit-secret');

    const base = hashRateLimitKey('signin', ['203.0.113.4', 'user@example.com']);

    expect(hashRateLimitKey('signup', ['203.0.113.4', 'user@example.com'])).not.toBe(base);
    expect(hashRateLimitKey('signin', ['203.0.113.5', 'user@example.com'])).not.toBe(base);
    expect(hashRateLimitKey('signin', ['203.0.113.4', 'other@example.com'])).not.toBe(base);
  });

  it('sends only the HMAC to Upstash and disables analytics', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubEnv('RATE_LIMIT_HMAC_SECRET', 'test-rate-limit-secret');

    await expect(checkRateLimit('signin:203.0.113.4:user@example.com')).resolves.toBe(true);

    const submittedKey = limit.mock.calls[0]?.[0] as string;
    expect(submittedKey).toMatch(/^[a-f0-9]{64}$/);
    expect(submittedKey).not.toContain('203.0.113.4');
    expect(submittedKey).not.toContain('user@example.com');
    expect(ratelimitOptions[0]).toMatchObject({ analytics: false });
  });

  it('fails open without Upstash only in local development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    await expect(checkRateLimit('signin:local')).resolves.toBe(true);
  });

  it('fails closed in production when distributed storage is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    await expect(checkRateLimit('signin:production')).resolves.toBe(false);
  });
});
