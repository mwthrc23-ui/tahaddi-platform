import { expect, test } from '@playwright/test';

test('كتالوج الألعاب يعرض الأوضاع المتاحة ويقود إلى الغرفة', async ({ page }) => {
  await page.goto('/games/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('اختر قانون الجولة');

  const items = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) });
  await expect(items).toHaveCount(2);

  await page.getByRole('link', { name: 'العالم الموازي' }).click();
  await expect(page).toHaveURL(/\/games\/parallel-world\/?$/);
});

test('سطح الألعاب يحافظ على الاستجابة والاتجاه والتركيز في الثيمين', async ({ page }) => {
  await page.goto('/games/');

  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const slug = document.querySelector('.cc-card__slug');
      const flags = document.querySelector('.cc-flags');
      const button = document.querySelector('.cc-btn');

      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        slugDirection: slug ? getComputedStyle(slug).direction : null,
        flagsDirection: flags ? getComputedStyle(flags).direction : null,
        buttonWhiteSpace: button ? getComputedStyle(button).whiteSpace : null,
      };
    });

    expect(layout.scrollWidth).toBe(layout.clientWidth);
    expect(layout.slugDirection).toBe('ltr');
    expect(layout.flagsDirection).toBe('ltr');
    expect(layout.buttonWhiteSpace).toBe('nowrap');
  }

  await page.getByRole('button', { name: 'المظهر الحالي: dark' }).click();
  await page.getByRole('menuitem', { name: 'فاتح' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press('Tab');
    const focusedHref = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    if (focusedHref === '/games/parallel-world/') break;
  }

  const gameLink = page.getByRole('link', { name: 'العالم الموازي' });
  await expect(gameLink).toBeFocused();
  await expect(gameLink).toHaveCSS('outline-style', 'solid');
});
