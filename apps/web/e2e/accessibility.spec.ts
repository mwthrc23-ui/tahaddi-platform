import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/join', '/mafia']) {
  test(`لا توجد مخالفات وصولية آلية حرجة في ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
  });
}
