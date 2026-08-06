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

describe('game-catalog engine', () => {
  const catalog: EnhancedGameMeta[] = mergeCatalogWithExisting(INJECTED_GAME_CATALOG);

  it('exposes at least 7 games including upcoming', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(7);
    expect(catalog.some((g) => g.kind === 'room')).toBe(true);
    expect(catalog.some((g) => g.kind === 'instant')).toBe(true);
    expect(catalog.some((g) => g.kind === 'upcoming')).toBe(true);
  });

  it('collectAll helpers return distinct sorted values', () => {
    const tags = collectAllTags(catalog);
    expect(tags.every((t, i) => i === 0 || tags[i - 1].localeCompare(t, 'ar') <= 0)).toBe(true);
    expect(collectAllCategories(catalog).length).toBeGreaterThan(0);
    expect(collectAllYears(catalog).every((y, i) => i === 0 || collectAllYears(catalog)[i - 1] >= y)).toBe(true);
  });

  it('computeGamePopularityScore gives higher values to active+rated games', () => {
    const activeHigh = { ...catalog[0], nowPlaying: 50, rating: 4.9, sessionsCount: 9000 };
    const dormantLow = { ...catalog[0], nowPlaying: 0, rating: 3.2, sessionsCount: 10, id: 'b', year: 2023 };
    expect(computeGamePopularityScore(activeHigh)).toBeGreaterThan(
      computeGamePopularityScore(dormantLow),
    );
  });

  it('gameMatchesFilters respects kinds/categories/platforms/years/tags/rating/nowPlaying', () => {
    const game = catalog.find((g) => g.id === 'parallel-world')!;
    const roomsOnly: GameFilterState = { ...DEFAULT_FILTER_STATE, kinds: ['room'] };
    expect(gameMatchesFilters(game, roomsOnly)).toBe(true);
    const instantOnly: GameFilterState = { ...DEFAULT_FILTER_STATE, kinds: ['instant'] };
    expect(gameMatchesFilters(game, instantOnly)).toBe(false);
    const badCategory: GameFilterState = { ...DEFAULT_FILTER_STATE, categories: ['حظ'] };
    expect(gameMatchesFilters(game, badCategory)).toBe(game.categories.includes('حظ'));
    const highRating: GameFilterState = { ...DEFAULT_FILTER_STATE, ratingMin: 5 };
    expect(gameMatchesFilters(game, highRating)).toBe(false);
    const nowPlayingOnly: GameFilterState = { ...DEFAULT_FILTER_STATE, nowPlayingOnly: true };
    expect(gameMatchesFilters(game, nowPlayingOnly)).toBe(game.nowPlaying > 0);
    const yearOn: GameFilterState = { ...DEFAULT_FILTER_STATE, years: [game.year] };
    expect(gameMatchesFilters(game, yearOn)).toBe(true);
    const withTag = { ...DEFAULT_FILTER_STATE, tags: [game.tags[0]] };
    expect(gameMatchesFilters(game, withTag)).toBe(true);
    const outOfRange = { ...DEFAULT_FILTER_STATE, playersMin: 99 };
    expect(gameMatchesFilters(game, outOfRange)).toBe(false);
  });

  it('gameMatchesFilters supports arabic query search on title, categories, tags', () => {
    const game = catalog.find((g) => g.id === 'memory-flash')!;
    const qTitle = { ...DEFAULT_FILTER_STATE, query: 'ومضة' };
    expect(gameMatchesFilters(game, qTitle)).toBe(true);
    const qTag = { ...DEFAULT_FILTER_STATE, query: game.tags[0] };
    expect(gameMatchesFilters(game, qTag)).toBe(true);
    const qNoMatch = { ...DEFAULT_FILTER_STATE, query: 'لعبة غير موجودة أبدًا' };
    expect(gameMatchesFilters(game, qNoMatch)).toBe(false);
  });

  it('sortGames produces stable ordering for each strategy', () => {
    const keys = ['popular', 'rating', 'newest', 'oldest', 'active', 'players'] as const;
    for (const key of keys) {
      const sorted = sortGames(catalog, { ...DEFAULT_FILTER_STATE, sort: key });
      expect(sorted.map((g) => g.id)).toHaveLength(catalog.length);
    }
    const sortedRating = sortGames(catalog, { ...DEFAULT_FILTER_STATE, sort: 'rating' });
    expect(sortedRating[0].rating).toBeGreaterThanOrEqual(sortedRating.at(-1)!.rating);
    const activeFirst = sortGames(catalog, { ...DEFAULT_FILTER_STATE, sort: 'active' });
    expect(activeFirst[0].nowPlaying).toBeGreaterThanOrEqual(activeFirst.at(-1)!.nowPlaying);
  });

  it('manual sort follows provided order then appends unknown', () => {
    const order = ['color-rush', 'infiltrator'];
    const sorted = sortGames(catalog, {
      ...DEFAULT_FILTER_STATE,
      sort: 'manual',
      manualOrder: order,
    });
    expect(sorted[0].id).toBe('color-rush');
    expect(sorted[1].id).toBe('infiltrator');
  });

  it('buildSearchSuggestions returns games first then categories then tags', () => {
    const sugg = buildSearchSuggestions(
      catalog,
      { ...DEFAULT_FILTER_STATE, query: 'ذكاء' },
      12,
    );
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.some((s) => s.type === 'game' || s.type === 'category')).toBe(true);
  });

  it('summarizeGames totals reflect filtered set', () => {
    const popular = sortGames(catalog, { ...DEFAULT_FILTER_STATE, sort: 'popular' }).slice(0, 3);
    const s = summarizeGames(popular);
    expect(s.total).toBe(3);
    expect(s.activeNow).toBe(popular.reduce((sum, g) => sum + g.nowPlaying, 0));
    expect(s.categories).toBeGreaterThan(0);
  });

  it('applyCatalogFilters filters and sorts in one step', () => {
    const onlyInstant = applyCatalogFilters(catalog, {
      ...DEFAULT_FILTER_STATE,
      kinds: ['instant'],
      sort: 'rating',
    });
    expect(onlyInstant.every((g) => g.kind === 'instant')).toBe(true);
    for (let i = 1; i < onlyInstant.length; i++) {
      expect(onlyInstant[i - 1].rating).toBeGreaterThanOrEqual(onlyInstant[i].rating);
    }
  });
});
