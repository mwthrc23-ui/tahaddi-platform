import { expect, test } from '@playwright/test';

test('رابط دعوة الغرفة يعرض صورة تحدّي وبيانات المشاركة الصحيحة', async ({ page }) => {
  const response = await page.goto('/join/123456/');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('انضم إلى غرفة 123456 | تحدّي');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://tahaddi-platform-realtime.vercel.app/og.png',
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://tahaddi-platform-realtime.vercel.app/og.png',
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://tahaddi-platform-realtime.vercel.app/join/123456/',
  );
});
