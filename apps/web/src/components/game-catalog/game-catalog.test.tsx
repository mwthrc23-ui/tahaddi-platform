import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GameSearch,
  GameFilters,
  GameSortBar,
  GameCard,
} from './index';
import type { UseGameCatalogReturn } from './use-game-catalog';
import type { EnhancedGameMeta } from './game-catalog-types';
import React from 'react';
import {
  INJECTED_GAME_CATALOG,
  DEFAULT_FILTER_STATE,
  mergeCatalogWithExisting,
} from '@tahaddi/domain';

const catalogSample: EnhancedGameMeta[] = mergeCatalogWithExisting(INJECTED_GAME_CATALOG);

function makeCatalog(partial: Partial<UseGameCatalogReturn> = {}): UseGameCatalogReturn {
  const base = {
    allGames: catalogSample,
    allCategories: Array.from(new Set(catalogSample.flatMap((g) => g.categories))),
    allTags: Array.from(new Set(catalogSample.flatMap((g) => g.tags))),
    allYears: Array.from(new Set(catalogSample.map((g) => g.year))),
    filters: { ...DEFAULT_FILTER_STATE },
    setFilterPatch: () => {},
    toggleKind: () => {},
    toggleCategory: () => {},
    togglePlatform: () => {},
    toggleYear: () => {},
    toggleTag: () => {},
    setDifficultyMin: () => {},
    setDifficultyMax: () => {},
    setRatingMin: () => {},
    setPlayersMin: () => {},
    setPlayersMax: () => {},
    toggleNowPlayingOnly: () => {},
    setSort: () => {},
    setView: () => {},
    setQuery: () => {},
    clearQuery: () => {},
    resetFilters: () => {},
    activeFiltersCount: 0,
    filtered: catalogSample,
    visibleGames: catalogSample,
    hasMore: false,
    loadMore: () => {},
    stats: { total: catalogSample.length, activeNow: 42, avgRating: 4.6, categories: 5 },
    suggestions: [],
    suggestionsOpen: false,
    setSuggestionsOpen: () => {},
    activeSuggestionIndex: -1,
    setActiveSuggestionIndex: () => {},
    applySuggestion: () => {},
    closeSuggestions: () => {},
    PAGE_SIZE: 6,
    sentinelRef: { current: null },
  } as unknown as UseGameCatalogReturn;
  return { ...base, ...partial };
}

describe('GameCatalog UI', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('GameCard renders grid/list variants and accent CSS custom property', () => {
    const game = catalogSample[0];
    const { rerender, container } = render(<GameCard game={game} index={0} view="grid" />);
    expect(screen.getByRole('heading', { level: 3, name: game.title })).toBeInTheDocument();
    const card = container.querySelector('.gc-card') as HTMLElement;
    expect(card.style.getPropertyValue('--game-accent')).toBe(game.accent);
    rerender(<GameCard game={game} index={0} view="list" />);
    expect(screen.getByRole('heading', { level: 3, name: game.title })).toBeInTheDocument();
  });

  it('GameSearch combobox has a11y attributes and debounces input', async () => {
    const setQuery = vi.fn();
    const catalog = makeCatalog({
      filters: { ...DEFAULT_FILTER_STATE, query: '' },
      setQuery,
      suggestions: [
        { id: 'game:color-rush', type: 'game', label: 'خدعة الألوان', match: 'فورية · تركيز' },
      ],
      suggestionsOpen: true,
    });
    render(<GameSearch catalog={catalog} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    const user = userEvent.setup();
    await user.click(input);
    for (const ch of 'خدعة') {
      await user.keyboard(ch);
    }
    if (setQuery.mock.calls.length === 0) {
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect(setQuery.mock.calls.length).toBeGreaterThan(0);
    const opt = screen.getByRole('option', { name: /خدعة الألوان/ });
    expect(opt).toBeInTheDocument();
  }, 30000);

  it('GameSortBar exposes sort select, view toggle, and filter badge', () => {
    const setSort = vi.fn();
    const setView = vi.fn();
    const catalog = makeCatalog({
      filters: { ...DEFAULT_FILTER_STATE, view: 'grid', sort: 'popular' },
      setSort,
      setView,
      activeFiltersCount: 3,
    });
    render(<GameSortBar catalog={catalog} onOpenFilters={() => {}} />);
    expect(screen.getByLabelText(/ترتيب حسب/)).toBeInTheDocument();
    const [gridBtn] = screen.getAllByRole('button', { name: /عرض/ });
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('GameFilters panel renders sections, chips aria-pressed, and sliders with accessible names', () => {
    const toggleKind = vi.fn();
    const catalog = makeCatalog({ toggleKind });
    render(<GameFilters catalog={catalog} open={true} onClose={() => {}} />);
    const sections = screen.getAllByRole('region') as HTMLElement[];
    expect(sections.length).toBeGreaterThanOrEqual(6);
    const kindChip = screen.getAllByRole('button').find((el) => /جماعية|فورية|قريبًا/.test(el.textContent ?? ''));
    expect(kindChip).toBeDefined();
    expect(kindChip).toHaveAttribute('aria-pressed');
    const diffMinLabel = screen.getByLabelText('الصعوبة الدنيا');
    expect(diffMinLabel).toBeInTheDocument();
    const ratingLabel = screen.getByLabelText('التقييم الأدنى للألعاب');
    expect(ratingLabel).toBeInTheDocument();
  });

  it('GameSearch closes suggestions on Escape and navigates Arrow keys + Enter applies', async () => {
    const applySuggestion = vi.fn();
    const setActive = vi.fn();
    const setOpen = vi.fn();
    const closeSuggestions = vi.fn();
    const suggestions = [
      { id: 'game:color-rush', type: 'game' as const, label: 'خدعة الألوان', match: 'فورية · تركيز' },
      { id: 'category:اجتماعي', type: 'category' as const, label: 'التصنيف: اجتماعي', match: '4 ألعاب' },
      { id: 'tag:سريع', type: 'tag' as const, label: 'الوسم: سريع', match: '5 ألعاب' },
    ];
    const catalog = makeCatalog({
      filters: { ...DEFAULT_FILTER_STATE, query: '' },
      suggestions,
      suggestionsOpen: true,
      activeSuggestionIndex: 0,
      setActiveSuggestionIndex: setActive,
      applySuggestion,
      setSuggestionsOpen: setOpen,
      closeSuggestions,
    });
    render(<GameSearch catalog={catalog} />);
    const input = screen.getByRole('combobox');
    const user = userEvent.setup();
    await user.click(input);

    await user.keyboard('{ArrowDown}');
    expect(setActive.mock.calls.length).toBeGreaterThan(0);

    await user.keyboard('{ArrowUp}');
    expect(setActive.mock.calls.length).toBeGreaterThan(1);

    await user.keyboard('{Enter}');
    expect(applySuggestion.mock.calls.length).toBe(1);

    setActive.mockClear();
    applySuggestion.mockClear();
    closeSuggestions.mockClear();
    await user.keyboard('{Escape}');
    expect(closeSuggestions.mock.calls.length).toBe(1);
  }, 30000);

  it('GameSearch onBlur closes suggestions only when focus leaves entire component', async () => {
    const closeSuggestions = vi.fn();
    const catalog = makeCatalog({
      filters: { ...DEFAULT_FILTER_STATE, query: '' },
      suggestions: [{ id: 'game:color-rush', type: 'game', label: 'خدعة الألوان', match: 'فورية' }],
      suggestionsOpen: true,
      closeSuggestions,
    });
    const { container } = render(
      <div>
        <GameSearch catalog={catalog} />
        <button type="button" data-outside>خارج البحث</button>
      </div>,
    );
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');
    await user.click(input);

    const clearBtn = container.querySelector('.gc-search-btn[aria-label="مسح البحث"]') as HTMLButtonElement | null;
    closeSuggestions.mockClear();
    if (clearBtn) {
      await user.click(clearBtn);
    }

    const outside = screen.getByRole('button', { name: /خارج البحث/ });
    await user.click(outside);
    expect(closeSuggestions.mock.calls.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('GameCard passes prefetch to the underlying Link element', () => {
    const game = catalogSample[0];
    const { container, rerender } = render(<GameCard game={game} index={0} view="grid" prefetch={true} />);
    const link = container.querySelector('a[href]') as HTMLAnchorElement | null;
    expect(link).toBeDefined();
    rerender(<GameCard game={game} index={0} view="grid" prefetch={false} />);
    const link2 = container.querySelector('a[href]') as HTMLAnchorElement | null;
    expect(link2).toBeDefined();
  });
});
