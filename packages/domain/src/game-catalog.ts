import type { SpecialGameMode, SpecialGameMeta } from './special-games.js';
import { SPECIAL_GAME_META, SPECIAL_GAME_ORDER, UPCOMING_SPECIAL_GAMES } from './special-games.js';

export type InstantGameMode = 'memory-flash' | 'word-code' | 'color-rush';

export type InstantGameMeta = {
  mode: InstantGameMode;
  title: string;
  description: string;
  roundSeconds: number;
  minimumPlayers: number;
  contentLabel: string;
};

export const INSTANT_GAME_META: Record<InstantGameMode, InstantGameMeta> = {
  'memory-flash': {
    mode: 'memory-flash',
    title: 'ومضة الذاكرة',
    description: 'احفظ تسلسل الرموز، ثم أعده بالترتيب قبل أن تفقد محاولاتك.',
    roundSeconds: 60,
    minimumPlayers: 1,
    contentLabel: 'جولات تلقائية',
  },
  'word-code': {
    mode: 'word-code',
    title: 'شفرة الحروف',
    description: 'فكّ الحروف العربية المبعثرة مستعينًا بالتلميح، واجمع أكبر رصيد.',
    roundSeconds: 60,
    minimumPlayers: 1,
    contentLabel: 'بنك كلمات',
  },
  'color-rush': {
    mode: 'color-rush',
    title: 'خدعة الألوان',
    description: 'اقرأ لون الكلمة لا معناها، واضغط الإجابة الصحيحة بأقصى سرعة.',
    roundSeconds: 45,
    minimumPlayers: 1,
    contentLabel: 'جولات تلقائية',
  },
};

export const INSTANT_GAME_ORDER: InstantGameMode[] = ['memory-flash', 'word-code', 'color-rush'];

export type GameKind = 'room' | 'instant' | 'upcoming';

export type DifficultyValue = 1 | 2 | 3 | 4 | 5;

export type PlatformValue = 'web' | 'mobile' | 'pwa';

export type GameCategory =
  | 'ثقافة'
  | 'ذكاء'
  | 'سرعة'
  | 'ذاكرة'
  | 'اجتماعي'
  | 'تركيز'
  | 'حظ'
  | 'استراتيجية';

export interface EnhancedGameMeta {
  id: string;
  mode: SpecialGameMode | InstantGameMode;
  kind: GameKind;
  title: string;
  shortTitle: string;
  description: string;
  minimumPlayers: number;
  maximumPlayers: number;
  roundSeconds: number;
  contentLabel: string;
  year: number;
  rating: number;
  sessionsCount: number;
  nowPlaying: number;
  difficulty: DifficultyValue;
  platforms: PlatformValue[];
  categories: GameCategory[];
  tags: string[];
  accent: string;
  requiresRealtime: boolean;
  requiresAuth: boolean;
}

export type GameSortKey =
  | 'popular'
  | 'rating'
  | 'newest'
  | 'oldest'
  | 'active'
  | 'players'
  | 'manual';

export interface GameFilterState {
  query: string;
  kinds: GameKind[];
  categories: GameCategory[];
  difficultyMin: DifficultyValue;
  difficultyMax: DifficultyValue;
  platforms: PlatformValue[];
  ratingMin: number;
  nowPlayingOnly: boolean;
  playersMin: number;
  playersMax: number;
  years: number[];
  tags: string[];
  sort: GameSortKey;
  view: 'grid' | 'list';
  manualOrder?: string[];
}

export interface GameSearchSuggestion {
  id: string;
  type: 'game' | 'category' | 'tag';
  label: string;
  match?: string;
}

export const INJECTED_GAME_CATALOG: EnhancedGameMeta[] = [
  {
    id: 'parallel-world',
    mode: 'parallel-world',
    kind: 'room',
    title: 'العالم الموازي',
    shortTitle: 'العالم الموازي',
    description: 'أسئلة مختلفة لكل لاعب، لكن الإجابة التي تجمع العوالم واحدة.',
    minimumPlayers: 2,
    maximumPlayers: 12,
    roundSeconds: 25,
    contentLabel: 'بنك أسئلة',
    year: 2025,
    rating: 4.7,
    sessionsCount: 1482,
    nowPlaying: 23,
    difficulty: 3,
    platforms: ['web', 'pwa'],
    categories: ['ثقافة', 'ذكاء', 'اجتماعي'],
    tags: ['عالم موازي', 'أسئلة متعددة', 'جماعي', 'عربية'],
    accent: '#ff8a65',
    requiresRealtime: true,
    requiresAuth: false,
  },
  {
    id: 'reverse-time',
    mode: 'reverse-time',
    kind: 'room',
    title: 'الزمن المقلوب',
    shortTitle: 'الزمن المقلوب',
    description: 'تظهر الإجابة أولًا، ثم يصنع اللاعبون السؤال الأذكى ويصوّتون له.',
    minimumPlayers: 3,
    maximumPlayers: 10,
    roundSeconds: 35,
    contentLabel: 'بنك أسئلة',
    year: 2025,
    rating: 4.6,
    sessionsCount: 932,
    nowPlaying: 17,
    difficulty: 4,
    platforms: ['web', 'pwa'],
    categories: ['ذكاء', 'اجتماعي', 'استراتيجية'],
    tags: ['عكس', 'تصويت', 'إبداع', 'سؤال مفتوح'],
    accent: '#ffb74d',
    requiresRealtime: true,
    requiresAuth: false,
  },
  {
    id: 'infiltrator',
    mode: 'infiltrator',
    kind: 'room',
    title: 'الدخيل',
    shortTitle: 'الدخيل',
    description: 'سؤال واحد للأغلبية وسؤال مختلف للدخيل؛ أجب ثم اكتشفه قبل أن يخدعكم.',
    minimumPlayers: 4,
    maximumPlayers: 16,
    roundSeconds: 45,
    contentLabel: 'بنك أسئلة',
    year: 2025,
    rating: 4.8,
    sessionsCount: 2210,
    nowPlaying: 41,
    difficulty: 4,
    platforms: ['web', 'pwa', 'mobile'],
    categories: ['اجتماعي', 'استراتيجية', 'حظ'],
    tags: ['دخيل', 'تصويت', 'أدوار', 'تفكير جماعي'],
    accent: '#ef5350',
    requiresRealtime: true,
    requiresAuth: false,
  },
  {
    id: 'spectrum',
    mode: 'parallel-world',
    kind: 'upcoming',
    title: 'الطيف',
    shortTitle: 'الطيف',
    description: 'ضع إجابتك بين طرفين متقابلين، ثم اكتشف أين تتقاطع تقديرات الفريق.',
    minimumPlayers: 3,
    maximumPlayers: 12,
    roundSeconds: 40,
    contentLabel: 'بنك أطياف',
    year: 2026,
    rating: 4.9,
    sessionsCount: 0,
    nowPlaying: 0,
    difficulty: 3,
    platforms: ['web', 'pwa'],
    categories: ['اجتماعي', 'تركيز', 'استراتيجية'],
    tags: ['طيف', 'تقدير', 'جماعي', 'قيد التطوير'],
    accent: '#ab47bc',
    requiresRealtime: true,
    requiresAuth: false,
  },
  {
    id: 'memory-flash',
    mode: 'memory-flash',
    kind: 'instant',
    title: 'ومضة الذاكرة',
    shortTitle: 'ومضة الذاكرة',
    description: 'احفظ تسلسل الرموز، ثم أعده بالترتيب قبل أن تفقد محاولاتك.',
    minimumPlayers: 1,
    maximumPlayers: 1,
    roundSeconds: 60,
    contentLabel: 'جولات تلقائية',
    year: 2024,
    rating: 4.4,
    sessionsCount: 5812,
    nowPlaying: 72,
    difficulty: 2,
    platforms: ['web', 'pwa', 'mobile'],
    categories: ['ذاكرة', 'سرعة', 'تركيز'],
    tags: ['ذاكرة', 'رموز', 'فوري', 'وحيد'],
    accent: '#34d399',
    requiresRealtime: false,
    requiresAuth: false,
  },
  {
    id: 'word-code',
    mode: 'word-code',
    kind: 'instant',
    title: 'شفرة الحروف',
    shortTitle: 'شفرة الحروف',
    description: 'فكّ الحروف العربية المبعثرة مستعينًا بالتلميح، واجمع أكبر رصيد.',
    minimumPlayers: 1,
    maximumPlayers: 1,
    roundSeconds: 60,
    contentLabel: 'بنك كلمات',
    year: 2024,
    rating: 4.3,
    sessionsCount: 4918,
    nowPlaying: 54,
    difficulty: 2,
    platforms: ['web', 'pwa'],
    categories: ['ذكاء', 'سرعة', 'ثقافة'],
    tags: ['حروف', 'كلمات', 'تلميح', 'فوري'],
    accent: '#22d3ee',
    requiresRealtime: false,
    requiresAuth: false,
  },
  {
    id: 'color-rush',
    mode: 'color-rush',
    kind: 'instant',
    title: 'خدعة الألوان',
    shortTitle: 'خدعة الألوان',
    description: 'اقرأ لون الكلمة لا معناها، واضغط الإجابة الصحيحة بأقصى سرعة.',
    minimumPlayers: 1,
    maximumPlayers: 1,
    roundSeconds: 45,
    contentLabel: 'جولات تلقائية',
    year: 2025,
    rating: 4.5,
    sessionsCount: 6128,
    nowPlaying: 88,
    difficulty: 3,
    platforms: ['web', 'pwa', 'mobile'],
    categories: ['تركيز', 'سرعة', 'ذاكرة'],
    tags: ['ألوان', 'حبس انتباه', 'Stroop', 'فوري'],
    accent: '#fbbf24',
    requiresRealtime: false,
    requiresAuth: false,
  },
];

export const DEFAULT_FILTER_STATE: GameFilterState = {
  query: '',
  kinds: [],
  categories: [],
  difficultyMin: 1,
  difficultyMax: 5,
  platforms: [],
  ratingMin: 0,
  nowPlayingOnly: false,
  playersMin: 0,
  playersMax: 20,
  years: [],
  tags: [],
  sort: 'popular',
  view: 'grid',
};

export function computeGamePopularityScore(game: EnhancedGameMeta): number {
  const sessions = Math.log1p(game.sessionsCount);
  const active = Math.log1p(game.nowPlaying) * 2.2;
  const rating = (game.rating - 3) * 6;
  const diffPenalty = Math.abs(3 - game.difficulty) * 0.4;
  const yearBoost = Math.max(0, game.year - 2023) * 1.2;
  return Math.max(0, sessions + active + rating + yearBoost - diffPenalty);
}

export function gameMatchesFilters(game: EnhancedGameMeta, filters: GameFilterState): boolean {
  if (filters.kinds.length > 0 && !filters.kinds.includes(game.kind)) return false;
  if (filters.categories.length > 0 && !game.categories.some((c) => filters.categories.includes(c))) {
    return false;
  }
  if (game.difficulty < filters.difficultyMin || game.difficulty > filters.difficultyMax) {
    return false;
  }
  if (filters.platforms.length > 0 && !game.platforms.some((p) => filters.platforms.includes(p))) {
    return false;
  }
  if (game.rating < filters.ratingMin) return false;
  if (filters.nowPlayingOnly && game.nowPlaying <= 0) return false;
  if (game.maximumPlayers < filters.playersMin) return false;
  if (game.minimumPlayers > filters.playersMax) return false;
  if (filters.years.length > 0 && !filters.years.includes(game.year)) return false;
  if (filters.tags.length > 0 && !game.tags.some((t) => filters.tags.includes(t))) return false;
  if (filters.query.trim()) {
    const q = filters.query.trim().toLocaleLowerCase('ar');
    const haystack = [
      game.title,
      game.shortTitle,
      game.description,
      game.contentLabel,
      ...game.categories,
      ...game.tags,
    ]
      .join(' ')
      .toLocaleLowerCase('ar');
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function sortGames(games: EnhancedGameMeta[], filters: GameFilterState): EnhancedGameMeta[] {
  const sorted = [...games];
  switch (filters.sort) {
    case 'popular':
      sorted.sort((a, b) => computeGamePopularityScore(b) - computeGamePopularityScore(a));
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.sessionsCount - a.sessionsCount);
      break;
    case 'newest':
      sorted.sort((a, b) => b.year - a.year || b.sessionsCount - a.sessionsCount);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.year - b.year);
      break;
    case 'active':
      sorted.sort((a, b) => b.nowPlaying - a.nowPlaying);
      break;
    case 'players':
      sorted.sort((a, b) => b.maximumPlayers - a.maximumPlayers);
      break;
    case 'manual':
      if (filters.manualOrder?.length) {
        const rank = new Map(filters.manualOrder.map((id, i) => [id, i]));
        sorted.sort((a, b) => {
          const ar = rank.get(a.id);
          const br = rank.get(b.id);
          if (ar == null && br == null) return 0;
          if (ar == null) return 1;
          if (br == null) return -1;
          return ar - br;
        });
      }
      break;
  }
  return sorted;
}

export function collectAllTags(games: EnhancedGameMeta[]): string[] {
  const set = new Set<string>();
  for (const g of games) for (const t of g.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
}

export function collectAllYears(games: EnhancedGameMeta[]): number[] {
  return Array.from(new Set(games.map((g) => g.year))).sort((a, b) => b - a);
}

export function collectAllCategories(games: EnhancedGameMeta[]): GameCategory[] {
  const set = new Set<GameCategory>();
  for (const g of games) for (const c of g.categories) set.add(c);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
}

export function buildSearchSuggestions(
  games: EnhancedGameMeta[],
  filters: GameFilterState,
  limit = 8,
): GameSearchSuggestion[] {
  const results: GameSearchSuggestion[] = [];
  const q = filters.query.trim().toLocaleLowerCase('ar');
  if (!q) return [];

  for (const game of games) {
    const title = game.title.toLocaleLowerCase('ar');
    if (title.includes(q) || game.shortTitle.toLocaleLowerCase('ar').includes(q)) {
      results.push({
        id: `game:${game.id}`,
        type: 'game',
        label: game.title,
        match: `${game.kind === 'room' ? 'جماعية' : game.kind === 'instant' ? 'فورية' : 'قريبًا'} · ${game.categories[0] ?? ''}`,
      });
      if (results.length >= limit) return results;
    }
  }

  const cats = collectAllCategories(games);
  for (const cat of cats) {
    if (cat.toLocaleLowerCase('ar').includes(q)) {
      results.push({ id: `cat:${cat}`, type: 'category', label: `التصنيف: ${cat}` });
      if (results.length >= limit) return results;
    }
  }

  const tags = collectAllTags(games);
  for (const tag of tags) {
    if (tag.toLocaleLowerCase('ar').includes(q)) {
      results.push({ id: `tag:${tag}`, type: 'tag', label: `الوسم: ${tag}` });
      if (results.length >= limit) return results;
    }
  }
  return results;
}

export function collectAllGames(): EnhancedGameMeta[] {
  return [...INJECTED_GAME_CATALOG];
}

export function enrichSpecialGame(mode: SpecialGameMode): EnhancedGameMeta {
  const base: SpecialGameMeta = SPECIAL_GAME_META[mode];
  const existing = INJECTED_GAME_CATALOG.find((g) => g.id === mode);
  if (existing) return existing;
  return {
    id: mode,
    mode,
    kind: 'room',
    title: base.title,
    shortTitle: base.shortTitle,
    description: base.description,
    minimumPlayers: base.minimumPlayers,
    maximumPlayers: 12,
    roundSeconds: base.roundSeconds,
    contentLabel: base.contentLabel,
    year: 2025,
    rating: 4.5,
    sessionsCount: 0,
    nowPlaying: 0,
    difficulty: 3,
    platforms: ['web', 'pwa'],
    categories: ['اجتماعي', 'ذكاء'],
    tags: ['محدث'],
    accent: '#ffb74d',
    requiresRealtime: true,
    requiresAuth: false,
  };
}

export function mergeCatalogWithExisting(base?: EnhancedGameMeta[]): EnhancedGameMeta[] {
  const items = base ?? collectAllGames();
  const fromUpcoming: EnhancedGameMeta[] = UPCOMING_SPECIAL_GAMES.filter(
    (u) => !items.some((g) => g.id === u.slug),
  ).map((u, i) => ({
    id: u.slug,
    mode: 'parallel-world' as SpecialGameMode,
    kind: 'upcoming' as GameKind,
    title: u.title,
    shortTitle: u.title,
    description: u.description,
    minimumPlayers: u.minimumPlayers,
    maximumPlayers: 12,
    roundSeconds: u.roundSeconds,
    contentLabel: u.contentLabel,
    year: 2026,
    rating: 4.9,
    sessionsCount: 0,
    nowPlaying: 0,
    difficulty: (3 as DifficultyValue),
    platforms: ['web', 'pwa'] as PlatformValue[],
    categories: ['اجتماعي'] as GameCategory[],
    tags: ['قيد التطوير'],
    accent: ['#ab47bc', '#26c6da', '#ec407a'][i % 3],
    requiresRealtime: true,
    requiresAuth: false,
  }));
  return [...items, ...fromUpcoming];
}

export function applyCatalogFilters(
  games: EnhancedGameMeta[],
  filters: GameFilterState,
): EnhancedGameMeta[] {
  return sortGames(games.filter((g) => gameMatchesFilters(g, filters)), filters);
}

export function summarizeGames(games: EnhancedGameMeta[]) {
  const total = games.length;
  const playing = games.reduce((s, g) => s + g.nowPlaying, 0);
  const avgRating =
    total === 0 ? 0 : games.reduce((s, g) => s + g.rating, 0) / total;
  return {
    total,
    activeNow: playing,
    avgRating: Number(avgRating.toFixed(2)),
    categories: collectAllCategories(games).length,
  };
}
