import { expect, test } from '@playwright/test';

test('يفتح الصفحة الرئيسية ويعرض الانضمام', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /كل سؤال/ })).toBeVisible();
  await expect(page.getByLabel('رمز الغرفة')).toBeVisible();
});
test('يتحقق من رمز الغرفة ويُظهر خطأً للرمز غير الصالح', async ({ page }) => {
  await page.goto('/');
  // رمز قصير → خطأ عربي
  await page.getByLabel('رمز الغرفة').fill('123');
  await page.getByRole('button', { name: 'انضم الآن' }).click();
  await expect(page.getByText(/يجب أن يتكوّن من ٦ إلى ٨ أحرف أو أرقام صالحة/)).toBeVisible();
});
test('يعرض خطأً واضحًا عندما لا تكون هناك جلسة مباشرة مفتوحة', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'أنشئ مسابقة' }).first()).toHaveAttribute(
    'href',
    /\/quizzes\/new\/?$/,
  );
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
test('يتنقل عبر الشاشات التجريبية ويحدد إجابة', async ({ page }) => {
  await page.goto('/demo/waiting');
  const steps = page.getByRole('navigation', { name: 'الشاشات التجريبية' });
  await expect(page.getByText('رمز الغرفة')).toBeVisible();
  await steps.getByRole('link', { name: 'السؤال' }).click();
  await page.getByRole('button', { name: /B: الجزائر/ }).click();
  await expect(page.getByRole('button', { name: /B: الجزائر/ })).toHaveClass(/is-selected/);
  await page.getByRole('button', { name: 'تأكيد الإجابة' }).click();
  await expect(page.getByRole('button', { name: /B: الجزائر/ })).toHaveClass(/is-correct/);
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
test('يكمل تدفق إجابة سؤال كاملاً حتى النتائج', async ({ page }) => {
  // امسح الجلسة القديمة
  await page.goto('/demo/question');
  await page.evaluate(() => localStorage.removeItem('tahaddi-demo-session'));
  await page.reload();

  // اختر إجابة صحيحة (B: الجزائر)
  await page.getByRole('button', { name: /B: الجزائر/ }).click();
  await expect(page.getByRole('button', { name: 'تأكيد الإجابة' })).toBeEnabled();
  await page.getByRole('button', { name: 'تأكيد الإجابة' }).click();

  // بعد تأكيد الإجابة الصحيحة تنتقل الحالة من selected إلى correct.
  await expect(page.getByRole('button', { name: /B: الجزائر/ })).toHaveClass(/is-correct/);

  // بعد الكشف يظهر زر «السؤال التالي» أو «عرض النتائج»
  await expect(page.getByRole('button', { name: /السؤال التالي|عرض النتائج/ })).toBeVisible();
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
