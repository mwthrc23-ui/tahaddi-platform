'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Gamepad2, Search as SearchIcon, Sparkles, Zap } from 'lucide-react';
import { useGameCatalog } from './use-game-catalog';
import { GameSearch } from './game-search';
import { GameFilters } from './game-filters';
import { GameSortBar } from './game-sort-bar';
import { GameCard } from './game-card';
import { formatArabicModeCount, toArabicDigits } from '@/lib/utils';

function GameCatalogShell({ sessionUserName }: { sessionUserName: string | null }) {
  const catalog = useGameCatalog();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isGrid = catalog.filters.view === 'grid';
  const filtersTriggerRef = useRef<HTMLButtonElement | null>(null);

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    setTimeout(() => filtersTriggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFilters();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersOpen, closeFilters]);

  const prefetch = useMemo(() => new Set(catalog.visibleGames.slice(0, 6).map((g) => g.id)), [
    catalog.visibleGames,
  ]);

  return (
    <div className="gc-wrapper">
      <section className="container gc-hero">
        <div className="gc-hero-inner">
          <div>
            <span className="gc-hero-kicker">
              <Sparkles aria-hidden="true" size={16} />
              {formatArabicModeCount(catalog.allGames.length)} وضع لعب — RTL 100%
            </span>
            <h1 className="gc-hero-title">اكتشف وتصفّح كل ألعاب تحدّي</h1>
            <p className="gc-hero-desc">
              استخدم الفلاتر متعددة الأبعاد للعثور على التحدي المناسب: غرف جماعية بث لحظي أو تحديات
              فورية من جهازك، مع اقتراحات ذكية للبحث وترتيبات متقدّمة حسب الشعبية والنشاط والتقييم.
            </p>
            <div className="gc-hero-stats" aria-label="إحصائيات سريعة">
              <div className="gc-stat">
                <strong>{formatArabicModeCount(catalog.stats.total)}</strong>
                <span>وضع لعب</span>
              </div>
              <div className="gc-stat">
                <strong>{toArabicDigits(catalog.stats.activeNow)}</strong>
                <span>نشط الآن</span>
              </div>
              <div className="gc-stat">
                <strong>{catalog.stats.avgRating.toFixed(1)} ★</strong>
                <span>متوسط التقييم</span>
              </div>
              <div className="gc-stat">
                <strong>{formatArabicModeCount(catalog.stats.categories)}</strong>
                <span>تصنيف</span>
              </div>
            </div>
            <GameSearch catalog={catalog} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: 'relative',
              aspectRatio: '5/4',
              minHeight: 260,
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-bright)',
              background:
                'radial-gradient(60% 60% at 30% 20%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 60%), radial-gradient(60% 60% at 80% 90%, color-mix(in srgb, var(--gold) 24%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), var(--card)',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                justifyItems: 'center',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '999px',
                  background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                  color: 'var(--text-soft)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <Zap aria-hidden="true" size={14} />
                Lazy 6+6 · IntersectionObserver
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '0.65rem',
                  inlineSize: '100%',
                  maxInlineSize: 480,
                }}
              >
                {catalog.visibleGames.slice(0, 6).map((g) => (
                  <div
                    key={g.id}
                    style={{
                      background:
                        'linear-gradient(135deg, ' +
                        `color-mix(in srgb, ${g.accent} 40%, transparent)` +
                        ', transparent 70%), color-mix(in srgb, ' +
                        `${g.accent} 10%, #0a0412)`,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid color-mix(in srgb, ' + `${g.accent} 40%, transparent)`,
                      padding: '0.6rem 0.55rem',
                      display: 'grid',
                      gap: '0.25rem',
                      justifyItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }} aria-hidden="true">
                      {g.kind === 'room' ? '👥' : g.kind === 'instant' ? '⚡' : '✨'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        maxInlineSize: '100%',
                        overflow: 'hidden',
                      }}
                      title={g.title}
                    >
                      {g.shortTitle}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                      {g.rating.toFixed(1)} ★
                    </span>
                  </div>
                ))}
              </div>
              {sessionUserName ? (
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-soft)',
                  }}
                >
                  مرحبًا، <b style={{ color: 'var(--foreground)' }}>{sessionUserName}</b> 👋
                </div>
              ) : null}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.85rem',
                }}
              >
                <SearchIcon aria-hidden="true" size={14} />
                اقتراحات ذكية · Debounce 160ms · وصولية WCAG 2.1
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <GameSortBar
          ref={filtersTriggerRef}
          catalog={catalog}
          onOpenFilters={() => setFiltersOpen(true)}
        />
        <div className="gc-main">
          <GameFilters
            catalog={catalog}
            open={filtersOpen}
            onClose={closeFilters}
          />
          <div className="gc-results" id="gc-results" aria-live="polite">
            {catalog.filtered.length === 0 ? (
              <div className="gc-empty">
                <b>لا توجد ألعاب مطابقة</b>
                جرّب تعديل الفلاتر أو مسح البحث.
              </div>
            ) : (
              <>
                <div
                  className={isGrid ? 'gc-grid' : 'gc-list'}
                  role="list"
                  aria-label="قائمة الألعاب"
                >
                  {catalog.visibleGames.map((game, i) => (
                    <div role="listitem" key={game.id} style={{ display: 'contents' }}>
                      <GameCardWrap
                        game={game}
                        index={i}
                        view={catalog.filters.view}
                        prefetch={prefetch.has(game.id)}
                      />
                    </div>
                  ))}
                </div>
                <div
                  className="gc-floating-sentinel"
                  ref={catalog.sentinelRef as unknown as React.RefObject<HTMLDivElement>}
                  aria-hidden="true"
                />
                {/* eslint-disable react-hooks/refs */}
                {catalog.hasMore ? (
                  <div className="gc-load-more">
                    <button type="button" onClick={catalog.loadMore}>
                      تحميل المزيد ({toArabicDigits(catalog.filtered.length - catalog.visibleGames.length)} متبقية)
                    </button>
                  </div>
                ) : null}
                {/* eslint-enable react-hooks/refs */}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="gc-backdrop" onClick={closeFilters} aria-hidden="true" />
    </div>
  );
}

function GameCardWrap({
  game,
  index,
  view,
  prefetch,
}: {
  game: Parameters<typeof GameCard>[0]['game'];
  index: number;
  view: Parameters<typeof GameCard>[0]['view'];
  prefetch: boolean;
}) {
  return (
    <LinkWrap>
      <GameCard game={game} index={index} view={view} prefetch={prefetch} />
    </LinkWrap>
  );
}

function LinkWrap({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

const WrappedGameCatalogWrapper = dynamic(() => Promise.resolve(GameCatalogShell), {
  ssr: true,
  loading: () => (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          padding: '1.2rem',
          background: 'var(--gc-bg, var(--card))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-soft)',
            fontWeight: 600,
          }}
        >
          <Gamepad2 aria-hidden="true" size={16} />
          جارٍ تحميل كتالوج الألعاب…
        </div>
      </div>
    </div>
  ),
});

export function GameCatalogWrapper(props: { sessionUserName: string | null }) {
  return <WrappedGameCatalogWrapper {...props} />;
}

export default GameCatalogWrapper;
