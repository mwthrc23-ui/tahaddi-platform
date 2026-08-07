import { expect, test } from '@playwright/test';

test('تعرض الصفحة الرئيسية التصميم المعتمد ومسارات البدء دون تمرير أفقي', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'الجولة تبدأ من رمز واحد.' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'معاينة غرفة تحدّي مباشرة' })).toContainText(
    'PQQDJK',
  );
  await expect(page.getByRole('link', { name: /أنشئ أول تحد/ })).toHaveAttribute(
    'href',
    /\/quizzes\/new\/?$/,
  );
  await expect(page.getByRole('link', { name: 'لديّ رمز غرفة' })).toHaveAttribute(
    'href',
    /\/join\/?$/,
  );
  await expect(
    page.getByRole('heading', { name: 'كل شيء أمامك، من الدعوة إلى التتويج.' }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test('يبقي مدخل لعبة القاتل واضحًا ومتجاوبًا', async ({ page }) => {
  await page.goto('/mafia');

  await expect(page.getByRole('heading', { level: 1, name: 'القاتل' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ادخل برمز الغرفة' })).toBeVisible();
  await expect(page.getByLabel('اسم اللاعب')).toBeVisible();
  await expect(page.getByLabel('رمز الغرفة')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
