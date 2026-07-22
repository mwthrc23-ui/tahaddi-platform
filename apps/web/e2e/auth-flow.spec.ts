import { expect, test } from '@playwright/test';

test('redirects anonymous users from protected pages', async ({ page }) => {
  await page.goto('/dashboard/');
  await expect(page).toHaveURL(/\/auth\/sign-in\/\?next=%2Fdashboard/);

  await page.goto('/profile/');
  await expect(page).toHaveURL(/\/auth\/sign-in\/\?next=%2Fprofile/);

  await page.goto('/quizzes/new/');
  await expect(page).toHaveURL(/\/auth\/sign-in\/\?next=%2Fquizzes%2Fnew/);
});

test('renders auth entry points', async ({ page }) => {
  await page.goto('/auth/sign-up/');
  await expect(page.getByRole('heading', { name: 'إنشاء حساب' })).toBeVisible();

  await page.goto('/auth/sign-in/');
  await expect(page.getByRole('heading', { name: 'دخول المضيفين' })).toBeVisible();

  await page.goto('/auth/recover/');
  await expect(page.getByRole('heading', { name: 'استعادة الحساب' })).toBeVisible();

  await page.goto('/auth/reset-password/example-token/');
  await expect(page.getByRole('heading', { name: 'إعادة تعيين كلمة المرور' })).toBeVisible();
});

test('keeps the public quizzes list available without a session', async ({ page }) => {
  await page.goto('/quizzes/');
  await expect(page.getByRole('heading', { name: 'المسابقات العامة', exact: true })).toBeVisible();
});

test.describe('database-backed auth flow', () => {
  test.describe.configure({ timeout: 60_000 });

  test.skip(
    process.env.RUN_AUTH_E2E !== 'true',
    'Requires disposable database credentials and RUN_AUTH_E2E=true.',
  );

  test('registers, signs in, signs out, and protects dashboard/profile', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.test`;
    const password = 'StrongPass123';

    await page.goto('/auth/sign-up/');
    await page.getByLabel('الاسم الظاهر').fill('مستخدم اختبار');
    await page.getByLabel('البريد الإلكتروني').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'إنشاء حساب' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'تم استلام الطلب' })).toBeVisible();

    await page.goto('/auth/sign-in/');
    await page.getByLabel('البريد الإلكتروني').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'دخول بالبريد' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/quizzes/new/');
    await expect(page.getByRole('heading', { name: 'منشئ المسابقة', level: 1 })).toBeVisible();
    await expect(page.locator('.quiz-builder-grid').first()).toHaveCSS(
      'grid-template-columns',
      /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/,
    );
    await page.getByLabel('عنوان المسابقة').fill('مسودة Playwright محفوظة');
    await page.getByRole('button', { name: 'حفظ المسودة محليًا' }).click();
    await page.reload();
    await expect(page.getByLabel('عنوان المسابقة')).toHaveValue('مسودة Playwright محفوظة');

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator('.quiz-builder-grid').first()).toHaveCSS(
      'grid-template-columns',
      /^\d+(?:\.\d+)?px$/,
    );

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/profile/');
    await expect(page.getByRole('heading', { name: 'الملف الشخصي' })).toBeVisible();

    await page.getByRole('button', { name: 'خروج' }).click();
    await expect(page).toHaveURL('http://127.0.0.1:3000/');

    await page.goto('/dashboard/');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
