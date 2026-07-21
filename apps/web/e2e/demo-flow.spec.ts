import { expect, test } from '@playwright/test';

test('يفتح الصفحة الرئيسية ويعرض الانضمام', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /كل سؤال/ })).toBeVisible();
  await expect(page.getByLabel('رمز الغرفة')).toBeVisible();
});
test('تعمل إجراءات الصفحة الرئيسية وتوضح حدود الانضمام المباشر', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'أنشئ مسابقة' }).first()).toHaveAttribute(
    'href',
    /\/quizzes\/?$/,
  );
  await page.getByLabel('رمز الغرفة').fill('582914');
  await page.getByRole('button', { name: 'انضم الآن' }).click();
  await expect(page.getByRole('status')).toContainText('الانضمام المباشر قيد التجهيز');
  await expect(page.getByRole('link', { name: 'فتح المعاينة' })).toHaveAttribute(
    'href',
    /\/demo\/waiting\/?$/,
  );
});
test('يحفظ منشئ المسابقة المسودة ويستجيب لنقاط العرض', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/quizzes');
  await expect(page.locator('.quiz-builder-grid').first()).toHaveCSS(
    'grid-template-columns',
    /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/,
  );
  await page.getByLabel('عنوان المسابقة').fill('مسودة محفوظة');
  await page.getByRole('button', { name: 'حفظ المسودة محليًا' }).click();
  await page.reload();
  await expect(page.getByLabel('عنوان المسابقة')).toHaveValue('مسودة محفوظة');

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.locator('.quiz-builder-grid').first()).toHaveCSS(
    'grid-template-columns',
    /^\d+(?:\.\d+)?px$/,
  );
});
test('يتنقل عبر الشاشات التجريبية ويحدد إجابة', async ({ page }) => {
  await page.goto('/demo/waiting');
  const steps = page.getByRole('navigation', { name: 'الشاشات التجريبية' });
  await expect(page.getByText('رمز الغرفة')).toBeVisible();
  await steps.getByRole('link', { name: 'السؤال' }).click();
  await page.getByRole('button', { name: /B: الجزائر/ }).click();
  await expect(page.getByRole('button', { name: /B: الجزائر/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page
    .getByRole('navigation', { name: 'الشاشات التجريبية' })
    .getByRole('link', { name: 'النتائج' })
    .click();
  await expect(page.getByRole('heading', { name: 'الجزائر' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'الشاشات التجريبية' })
    .getByRole('link', { name: 'الفائزون' })
    .click();
  await expect(page.getByLabel('منصة الفائزين')).toBeVisible();
});
test('يغير الوضع', async ({ page }) => {
  await page.goto('/design-system');
  const toggles = page.getByRole('button', { name: /المظهر الحالي/ });
  const count = await toggles.count();

  for (let index = 0; index < count; index += 1) {
    const toggle = toggles.nth(index);
    if (await toggle.isVisible()) {
      await toggle.click();
      break;
    }
  }

  const menu = page.getByRole('menu');
  await expect(menu)
    .toBeVisible({ timeout: 2_000 })
    .catch(async () => {
      const retryToggle = page
        .getByRole('button', { name: /المظهر الحالي/ })
        .filter({ visible: true })
        .first();
      await retryToggle.click();
      await expect(menu).toBeVisible();
    });
  await page.getByRole('menuitem', { name: 'فاتح' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('يفتح قائمة الجوال', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'فتح القائمة' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'قائمة الجوال' })).toBeVisible();
});
