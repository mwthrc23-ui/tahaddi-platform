import { expect, test } from '@playwright/test';

test('يفتح الصفحة الرئيسية ويعرض إجراءات البداية الجديدة', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'الجولة تبدأ من رمز واحد.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /أنشئ أول تحد/ })).toHaveAttribute(
    'href',
    /\/quizzes\/new\/?$/,
  );
  await expect(page.getByRole('link', { name: 'لديّ رمز غرفة' })).toHaveAttribute(
    'href',
    /\/join\/?$/,
  );
  const viewport = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth);
});

test('يفتح لعبة القاتل المنقولة ويعرض مسار اللاعب والمراحل', async ({ page }) => {
  await page.goto('/mafia');
  await expect(page.getByRole('heading', { name: 'من هو القاتل؟' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'متى تبدأ كل مرحلة وماذا يحدث؟' })).toBeVisible();
  await expect(page.getByLabel('اسم اللاعب')).toBeVisible();
  await expect(page.getByLabel('رمز الغرفة')).toBeVisible();

  const viewport = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth);
});

test('يتحقق من رمز الغرفة ويُظهر خطأً للرمز غير الصالح', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel('رمز الغرفة').fill('123');
  await page.getByRole('button', { name: 'انضم الآن' }).click();
  await expect(page.getByText(/يجب أن يتكوّن من ٦ إلى ٨ أحرف أو أرقام صالحة/)).toBeVisible();
});

test('يعرض خطأً واضحًا عندما لا تكون هناك جلسة مباشرة مفتوحة', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel('اسم اللاعب').fill('نورة');
  await page.getByLabel('رمز الغرفة').fill('A7K9PQ');
  await page.getByRole('button', { name: 'انضم الآن' }).click();
  await expect(
    page.getByText(/لم نجد جلسة مباشرة مفتوحة بهذا الرمز|خدمة الجلسات المباشرة غير متاحة حاليًا/),
  ).toBeVisible();
});

test('يفتح رابط الدعوة صفحة اللاعب مع تعبئة الرمز', async ({ page }) => {
  await page.goto('/join/A7K9PQ');
  await expect(page.getByRole('heading', { name: 'ادخل المسابقة كزائر' })).toBeVisible();
  await expect(page.getByLabel('رمز الغرفة')).toHaveValue('A7K9PQ');
  await expect(page.getByText(/لا تحتاج إلى حساب/)).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'الجولة تبدأ من رمز واحد.' })).toBeVisible();
  const viewport = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth);
  const menu = page.getByRole('button', { name: 'فتح القائمة' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'قائمة الجوال' })).toBeVisible();
});
