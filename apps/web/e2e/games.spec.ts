import { expect, test } from '@playwright/test';
import {
  PARALLEL_WORLD_BANK,
  REVERSE_TIME_BANK,
  SPECIAL_GAME_META,
  SPECIAL_GAME_ORDER,
  SPECTRUM_BANK,
  UPCOMING_SPECIAL_GAMES,
} from '@tahaddi/domain';
import {
  COLOR_RUSH_BANK,
  INSTANT_GAME_META,
  INSTANT_GAME_ORDER,
  MEMORY_SYMBOL_BANK,
  WORD_CODE_BANK,
} from '../src/components/instant-games/game-data';
import { toArabicDigits } from '../src/lib/utils';

test('الكتالوج والمسارات والبنوك مشتقة من قوائم الألعاب الثلاث', async ({ page, request }) => {
  await page.goto('/games/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('اختر قانون الجولة');

  const items = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) });
  await expect(items).toHaveCount(SPECIAL_GAME_ORDER.length + INSTANT_GAME_ORDER.length);

  for (const mode of SPECIAL_GAME_ORDER) {
    const meta = SPECIAL_GAME_META[mode];
    expect(meta).toMatchObject({
      mode,
      minimumPlayers: expect.any(Number),
      roundSeconds: expect.any(Number),
      contentLabel: expect.any(String),
    });
    await expect(page.getByRole('link', { name: meta.title })).toHaveAttribute(
      'href',
      `/games/${mode}/`,
    );
    const card = page.locator('.cc-card').filter({
      has: page.getByRole('heading', { name: meta.title, exact: true }),
    });
    await expect(card.getByText(meta.description, { exact: true })).toBeVisible();
    await expect(card.locator('.cc-flags')).toContainText(
      `${toArabicDigits(meta.minimumPlayers)}+`,
    );
    await expect(card.locator('.cc-flags')).toContainText(`${toArabicDigits(meta.roundSeconds)} ث`);
    await expect(card.locator('.cc-flags')).toContainText(meta.contentLabel);
    expect((await request.get(`/games/${mode}/`)).status()).toBe(200);
  }

  for (const mode of INSTANT_GAME_ORDER) {
    const meta = INSTANT_GAME_META[mode];
    expect(meta).toMatchObject({
      mode,
      minimumPlayers: 1,
      roundSeconds: expect.any(Number),
      contentLabel: expect.any(String),
    });
    await expect(page.getByRole('link', { name: meta.title })).toHaveAttribute(
      'href',
      `/games/${mode}/`,
    );
    const card = page.locator('.cc-card').filter({
      has: page.getByRole('heading', { name: meta.title, exact: true }),
    });
    await expect(card.getByText(meta.description, { exact: true })).toBeVisible();
    await expect(card.locator('.cc-flags')).toContainText(
      `${toArabicDigits(meta.minimumPlayers)}+`,
    );
    await expect(card.locator('.cc-flags')).toContainText(`${toArabicDigits(meta.roundSeconds)} ث`);
    await expect(card.locator('.cc-flags')).toContainText(meta.contentLabel);
    expect((await request.get(`/games/${mode}/`)).status()).toBe(200);
  }

  for (const game of UPCOMING_SPECIAL_GAMES) {
    expect(game).toMatchObject({
      minimumPlayers: expect.any(Number),
      roundSeconds: expect.any(Number),
      contentLabel: expect.any(String),
    });
    await expect(page.getByText(game.title, { exact: false })).toBeVisible();
    await expect(page.getByText(game.description, { exact: false })).toBeVisible();
    await expect(page.locator(`a[href="/games/${game.slug}"]`)).toHaveCount(0);
    expect((await request.get(`/games/${game.slug}/`)).status()).toBe(404);
  }

  expect(PARALLEL_WORLD_BANK.length).toBeGreaterThanOrEqual(6);
  expect(REVERSE_TIME_BANK.length).toBeGreaterThanOrEqual(8);
  expect(SPECTRUM_BANK.length).toBeGreaterThanOrEqual(24);
  expect(new Set(SPECTRUM_BANK.map((pair) => pair.id)).size).toBe(SPECTRUM_BANK.length);
  expect(MEMORY_SYMBOL_BANK.length).toBeGreaterThanOrEqual(4);
  expect(WORD_CODE_BANK.length).toBeGreaterThanOrEqual(12);
  expect(COLOR_RUSH_BANK.length).toBeGreaterThanOrEqual(4);
  expect(new Set(WORD_CODE_BANK.map((item) => item.word)).size).toBe(WORD_CODE_BANK.length);
  expect(new Set(COLOR_RUSH_BANK.map((item) => item.value)).size).toBe(COLOR_RUSH_BANK.length);
  for (const round of PARALLEL_WORLD_BANK) {
    expect(round.variants.length).toBeGreaterThanOrEqual(4);
    expect(round.variants.every((variant) => variant.options.includes(round.answer))).toBe(true);
  }
  for (const round of REVERSE_TIME_BANK) {
    expect(round.answer.trim()).not.toBe('');
    expect(round.hint.trim()).not.toBe('');
  }
  for (const pair of SPECTRUM_BANK) {
    expect(pair.left.trim()).not.toBe('');
    expect(pair.right.trim()).not.toBe('');
    expect(pair.left).not.toBe(pair.right);
  }
});

test('خدعة الألوان تبدأ فورًا وتحتسب الإجابة الصحيحة', async ({ page }) => {
  const mode = INSTANT_GAME_ORDER.at(-1);
  expect(mode).toBeDefined();
  await page.goto(`/games/${mode}/`);
  await page.getByRole('button', { name: 'ابدأ التحدّي' }).click();
  await page.getByRole('button', { name: 'أزرق' }).click();

  await expect(page.getByLabel('حالة اللعبة')).toContainText('الرصيد ٧٥');
  await expect(page.getByText('خاطف! +٧٥')).toBeVisible();
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
    if (focusedHref === `/games/${SPECIAL_GAME_ORDER[0]}/`) break;
  }

  const gameLink = page.getByRole('link', { name: SPECIAL_GAME_META[SPECIAL_GAME_ORDER[0]].title });
  await expect(gameLink).toBeFocused();
  await expect(gameLink).toHaveCSS('outline-style', 'solid');
});
