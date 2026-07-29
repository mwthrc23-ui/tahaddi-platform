import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry' },
  webServer: [
    {
      command: 'pnpm --filter @tahaddi/realtime dev',
      url: 'http://127.0.0.1:3001/realtime/health',
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        ...process.env,
        REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
      },
    },
    {
      command: 'pnpm --filter @tahaddi/web dev -- --hostname 127.0.0.1 --webpack',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://127.0.0.1:3001',
      },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
