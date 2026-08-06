'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyCatalogFilters,
  buildSearchSuggestions,
  collectAllCategories,
  collectAllTags,
  collectAllYears,
  computeGamePopularityScore,
  DEFAULT_FILTER_STATE,
  mergeCatalogWithExisting,
  summarizeGames,
  type DifficultyValue,
  type EnhancedGameMeta,
  type GameFilterState,
  type GameKind,
  type GameSearchSuggestion,
  type GameSortKey,
  type PlatformValue,
} from './game-catalog-types.js';

const SEARCH_DEBOUNCE_MS = 160;
const PAGE_SIZE = 6;

type FilterChangeDelta =
  | Partial<GameFilterState>
  | ((prev: GameFilterState) => Partial<GameFilterState>);

export function useGameCatalog() {
  const allGames = useMemo<EnhancedGameMeta[]>(() => mergeCatalogWithExisting(), []);
  const [filters, setFilters] = useState<GameFilterState>(DEFAULT_FILTER_STATE);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(filters.query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [filters.query]);

  const effectiveFilters: GameFilterState = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const filtered = useMemo<EnhancedGameMeta[]>(
    () => applyCatalogFilters(allGames, effectiveFilters),
    [allGames, effectiveFilters],
  );

  const visibleGames: EnhancedGameMeta[] = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  const stats = useMemo(() => summarizeGames(filtered), [filtered]);

  const suggestions: GameSearchSuggestion[] = useMemo(
    () => buildSearchSuggestions(allGames, effectiveFilters, 8),
    [allGames, effectiveFilters],
  );

  const allTags = useMemo(() => collectAllTags(allGames), [allGames]);
  const allCategories = useMemo(() => collectAllCategories(allGames), [allGames]);
  const allYears = useMemo(() => collectAllYears(allGames), [allGames]);

  const setFilterPatch = useCallback((delta: FilterChangeDelta) => {
    setFilters((prev) => {
      const next = typeof delta === 'function' ? delta(prev) : delta;
      const merged = { ...prev, ...next };
      return merged;
    });
    setVisibleCount(PAGE_SIZE);
    setActiveSuggestionIndex(-1);
  }, []);

  const toggleArray = useCallback(
    <T,>(key: keyof GameFilterState, value: T) => {
      setFilterPatch((prev) => {
        const arr = (prev[key] as T[] | undefined) ?? [];
        const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
        return { [key]: next } as Partial<GameFilterState>;
      });
    },
    [setFilterPatch],
  );

  const toggleKind = useCallback(
    (kind: GameKind) => toggleArray<GameKind>('kinds', kind),
    [toggleArray],
  );
  const toggleCategory = useCallback(
    (category: string) => toggleArray<string>('categories', category as never),
    [toggleArray],
  );
  const togglePlatform = useCallback(
    (p: PlatformValue) => toggleArray<PlatformValue>('platforms', p),
    [toggleArray],
  );
  const toggleYear = useCallback(
    (year: number) => toggleArray<number>('years', year),
    [toggleArray],
  );
  const toggleTag = useCallback(
    (tag: string) => toggleArray<string>('tags', tag),
    [toggleArray],
  );
  const setDifficultyMin = useCallback(
    (v: DifficultyValue) => setFilterPatch({ difficultyMin: v }),
    [setFilterPatch],
  );
  const setDifficultyMax = useCallback(
    (v: DifficultyValue) => setFilterPatch({ difficultyMax: v }),
    [setFilterPatch],
  );
  const setRatingMin = useCallback(
    (v: number) => setFilterPatch({ ratingMin: v }),
    [setFilterPatch],
  );
  const setPlayersMin = useCallback(
    (v: number) => setFilterPatch({ playersMin: v }),
    [setFilterPatch],
  );
  const setPlayersMax = useCallback(
    (v: number) => setFilterPatch({ playersMax: v }),
    [setFilterPatch],
  );
  const toggleNowPlayingOnly = useCallback(
    () => setFilterPatch((prev) => ({ nowPlayingOnly: !prev.nowPlayingOnly })),
    [setFilterPatch],
  );
  const setSort = useCallback(
    (sort: GameSortKey) => setFilterPatch({ sort }),
    [setFilterPatch],
  );
  const setView = useCallback(
    (view: GameFilterState['view']) => setFilterPatch({ view }),
    [setFilterPatch],
  );
  const setQuery = useCallback(
    (query: string) => {
      setFilterPatch({ query });
      setSuggestionsOpen(true);
    },
    [setFilterPatch],
  );
  const clearQuery = useCallback(() => {
    setFilterPatch({ query: '' });
    setSuggestionsOpen(false);
  }, [setFilterPatch]);
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
    setDebouncedQuery('');
    setVisibleCount(PAGE_SIZE);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (effectiveFilters.kinds.length) n += effectiveFilters.kinds.length;
    if (effectiveFilters.categories.length) n += effectiveFilters.categories.length;
    if (effectiveFilters.platforms.length) n += effectiveFilters.platforms.length;
    if (effectiveFilters.years.length) n += effectiveFilters.years.length;
    if (effectiveFilters.tags.length) n += effectiveFilters.tags.length;
    if (effectiveFilters.difficultyMin > 1) n += 1;
    if (effectiveFilters.difficultyMax < 5) n += 1;
    if (effectiveFilters.ratingMin > 0) n += 1;
    if (effectiveFilters.nowPlayingOnly) n += 1;
    if (effectiveFilters.playersMin > 0) n += 1;
    if (effectiveFilters.playersMax < 20) n += 1;
    if (effectiveFilters.query.trim()) n += 1;
    return n;
  }, [effectiveFilters]);

  const applySuggestion = useCallback(
    (s: GameSearchSuggestion) => {
      if (s.type === 'game') {
        const id = s.id.replace(/^game:/, '');
        setFilterPatch({ query: s.label });
      } else if (s.type === 'category') {
        const cat = s.label.replace(/^التصنيف:\s*/, '').trim();
        toggleCategory(cat);
      } else if (s.type === 'tag') {
        const tag = s.label.replace(/^الوسم:\s*/, '').trim();
        toggleTag(tag);
      }
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    },
    [setFilterPatch, toggleCategory, toggleTag],
  );

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    queueMicrotask(() => {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
      loadingMoreRef.current = false;
    });
  }, [hasMore, filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadMore();
          }
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  const closeSuggestions = useCallback(() => {
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  }, []);

  return {
    allGames,
    allCategories,
    allTags,
    allYears,
    filters: effectiveFilters,
    setFilterPatch,
    toggleKind,
    toggleCategory,
    togglePlatform,
    toggleYear,
    toggleTag,
    setDifficultyMin,
    setDifficultyMax,
    setRatingMin,
    setPlayersMin,
    setPlayersMax,
    toggleNowPlayingOnly,
    setSort,
    setView,
    setQuery,
    clearQuery,
    resetFilters,
    activeFiltersCount,
    filtered,
    visibleGames,
    hasMore,
    loadMore,
    stats,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    applySuggestion,
    closeSuggestions,
    PAGE_SIZE,
    sentinelRef,
    computePopularity: computeGamePopularityScore,
  };
}

export type UseGameCatalogReturn = ReturnType<typeof useGameCatalog>;
