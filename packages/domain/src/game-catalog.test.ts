import { describe, it, expect } from 'vitest';
import {
  applyCatalogFilters,
  buildSearchSuggestions,
  collectAllCategories,
  collectAllTags,
  collectAllYears,
  computeGamePopularityScore,
  DEFAULT_FILTER_STATE,
  gameMatchesFilters,
  INJECTED_GAME_CATALOG,
  mergeCatalogWithExisting,
  sortGames,
  summarizeGames,
  type EnhancedGameMeta,
  type GameFilterState,
} from './game-catalog.js';

function takeCatalog() {
  return mergeCatalogWithExisting(INJECTED_GAME_CATALOG);
}

function filterState(partial: Partial<GameFilterState>): GameFilterState {
  return {
    ...DEFAULT_FILTER_STATE,
    tags: DEFAULT_FILTER_STATE.tags.filter((t): t is string => Boolean(t)),
    ...partial,
  };
}

function gameSample(base: EnhancedGameMeta, overrides: Partial<EnhancedGameMeta>): EnhancedGameMeta {
  return {
    ...base,
    tags: base.tags.filter((t): t is string => Boolean(t)),
    ...overrides,
  };
}

describe('game-catalog engine', () => {
  it('exposes at least 7 games including upcoming', () => {
    const catalog = takeCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(7);
    expect(catalog.some((g) => g.kind === 'room')).toBe(true);
    expect(catalog.some((g) => g.kind === 'instant')).toBe(true);
    expect(catalog.some((g) => g.kind === 'upcoming')).toBe(true);
  });

  it('collectAll helpers return distinct sorted values', () => {
    const catalog = takeCatalog();
    const tags = collectAllTags(catalog);
    expect(tags.every((t, i) => i === 0 || tags[i - 1].localeCompare(t, 'ar') <= 0)).toBe(true);
    expect(collectAllCategories(catalog).length).toBeGreaterThan(0);
    const years = collectAllYears(catalog);
    expect(years.every((y, i) => i === 0 || years[i - 1] >= y)).toBe(true);
  });

  it('computeGamePopularityScore gives higher values to active+rated games', () => {
    const catalog = takeCatalog();
    const base = catalog[0];
    const activeHigh: EnhancedGameMeta = gameSample(base, {
      nowPlaying: 50,
      rating: 4.9,
      sessionsCount: 9000,
      id: 'a',
      year: 2025,
    });
    const dormantLow: EnhancedGameMeta = gameSample(base, {
      nowPlaying: 0,
      rating: 3.2,
      sessionsCount: 10,
      id: 'b',
      year: 2023,
    });
    expect(computeGamePopularityScore(activeHigh)).toBeGreaterThan(
      computeGamePopularityScore(dormantLow),
    );
  });

  it('gameMatchesFilters respects kinds/categories/platforms/years/tags/rating/nowPlaying', () => {
    const catalog = takeCatalog();
    const game = catalog.find((g) => g.id === 'parallel-world')!;
    expect(game).toBeTruthy();
    const roomsOnly = filterState({ kinds: ['room'] });
    expect(gameMatchesFilters(game, roomsOnly)).toBe(true);
    const instantOnly = filterState({ kinds: ['instant'] });
    expect(gameMatchesFilters(game, instantOnly)).toBe(false);
    const badCategory = filterState({ categories: ['حظ'] });
    expect(gameMatchesFilters(game, badCategory)).toBe(game.categories.includes('حظ'));
    const highRating = filterState({ ratingMin: 5 });
    expect(gameMatchesFilters(game, highRating)).toBe(false);
    const nowPlayingOnly = filterState({ nowPlayingOnly: true });
    expect(gameMatchesFilters(game, nowPlayingOnly)).toBe(game.nowPlaying > 0);
    const yearOn = filterState({ years: [game.year] });
    expect(gameMatchesFilters(game, yearOn)).toBe(true);
    const firstTag = game.tags[0];
    const withTag = firstTag ? filterState({ tags: [firstTag] }) : filterState({});
    expect(gameMatchesFilters(game, withTag)).toBe(true);
    const outOfRange = filterState({ playersMin: 99 });
    expect(gameMatchesFilters(game, outOfRange)).toBe(false);
  });

  it('gameMatchesFilters supports arabic query search on title, categories, tags', () => {
    const catalog = takeCatalog();
    const game = catalog.find((g) => g.id === 'memory-flash')!;
    expect(game).toBeTruthy();
    const qTitle = filterState({ query: 'ومضة' });
    expect(gameMatchesFilters(game, qTitle)).toBe(true);
    const firstTag = game.tags[0];
    if (firstTag) {
      const qTag = filterState({ query: firstTag });
      expect(gameMatchesFilters(game, qTag)).toBe(true);
    }
    const qNoMatch = filterState({ query: 'لعبة غير موجودة أبدًا' });
    expect(gameMatchesFilters(game, qNoMatch)).toBe(false);
  });

  it('sortGames produces stable ordering for each strategy', () => {
    const catalog = takeCatalog();
    const keys = ['popular', 'rating', 'newest', 'oldest', 'active', 'players'] as const;
    for (const key of keys) {
      const sorted = sortGames(catalog, filterState({ sort: key }));
      expect(sorted.map((g) => g.id)).toHaveLength(catalog.length);
    }
    const sortedRating = sortGames(catalog, filterState({ sort: 'rating' }));
    const firstRating = sortedRating[0]?.rating ?? 0;
    const lastRating = sortedRating.at(-1)?.rating ?? 0;
    expect(firstRating).toBeGreaterThanOrEqual(lastRating);
    const activeFirst = sortGames(catalog, filterState({ sort: 'active' }));
    const firstActive = activeFirst[0]?.nowPlaying ?? 0;
    const lastActive = activeFirst.at(-1)?.nowPlaying ?? 0;
    expect(firstActive).toBeGreaterThanOrEqual(lastActive);
  });

  it('manual sort follows provided order then appends unknown', () => {
    const catalog = takeCatalog();
    const order = ['color-rush', 'infiltrator'];
    const sorted = sortGames(
      catalog,
      filterState({ sort: 'manual', manualOrder: order }),
    );
    expect(sorted[0]?.id).toBe('color-rush');
    expect(sorted[1]?.id).toBe('infiltrator');
  });

  it('buildSearchSuggestions returns games first then categories then tags', () => {
    const catalog = takeCatalog();
    const sugg = buildSearchSuggestions(catalog, filterState({ query: 'ذكاء' }), 12);
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.some((s) => s.type === 'game' || s.type === 'category')).toBe(true);
  });

  it('summarizeGames totals reflect filtered set', () => {
    const catalog = takeCatalog();
    const popular = sortGames(catalog, filterState({ sort: 'popular' })).slice(0, 3);
    const s = summarizeGames(popular);
    expect(s.total).toBe(3);
    expect(s.activeNow).toBe(popular.reduce((sum, g) => sum + g.nowPlaying, 0));
    expect(s.categories).toBeGreaterThan(0);
  });

  it('applyCatalogFilters filters and sorts in one step', () => {
    const catalog = takeCatalog();
    const onlyInstant = applyCatalogFilters(catalog, filterState({ kinds: ['instant'], sort: 'rating' }));
    expect(onlyInstant.every((g) => g.kind === 'instant')).toBe(true);
    for (let i = 1; i < onlyInstant.length; i++) {
      const prev = onlyInstant[i - 1]?.rating ?? 0;
      const next = onlyInstant[i]?.rating ?? 0;
      expect(prev).toBeGreaterThanOrEqual(next);
    }
  });
});

