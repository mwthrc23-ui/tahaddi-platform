import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, resetRateLimitsForTests } from './rate-limit';

describe('distributed rate-limit configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitsForTests();
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
