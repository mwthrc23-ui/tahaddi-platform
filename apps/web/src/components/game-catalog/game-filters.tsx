'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X as CloseIcon } from 'lucide-react';
import type { UseGameCatalogReturn } from './use-game-catalog';
import type { DifficultyValue, GameKind, PlatformValue } from './game-catalog-types';

const KIND_META: Record<GameKind, { label: string; icon: string }> = {
  room: { label: 'جماعية', icon: '👥' },
  instant: { label: 'فورية', icon: '⚡' },
  upcoming: { label: 'قريبًا', icon: '✨' },
};

const PLATFORM_META: Record<PlatformValue, { label: string; icon: string }> = {
  web: { label: 'متصفح', icon: '🌐' },
  pwa: { label: 'PWA', icon: '📱' },
  mobile: { label: 'جوال', icon: '📲' },
};

function Section({
  id,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className="gc-filter-section"
      aria-expanded={open}
      aria-labelledby={id}
    >
      <h4>
        <span id={id}>{title}</span>
        <button
          type="button"
          aria-label={open ? 'طي القسم' : 'فتح القسم'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </h4>
      <div className="gc-filter-section-body">{children}</div>
    </section>
  );
}

function Chips<T extends string>({
  items,
  active,
  onToggle,
  labelOf,
}: {
  items: readonly T[];
  active: readonly T[];
  onToggle: (v: T) => void;
  labelOf: (v: T) => { label: string; icon?: string };
}) {
  return (
    <div className="gc-chips" role="group">
      {items.map((v) => {
        const meta = labelOf(v);
        return (
          <button
            key={v}
            type="button"
            role="switch"
            aria-checked={active.includes(v)}
            data-active={active.includes(v)}
            className="gc-chip"
            onClick={() => onToggle(v)}
          >
            {meta.icon ? <span aria-hidden="true">{meta.icon}</span> : null}
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function Slider({
  id,
  ariaLabel,
  min,
  max,
  value,
  onChange,
  labelOf,
}: {
  id: string;
  ariaLabel: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  labelOf: (v: number) => string;
}) {
  return (
    <div className="gc-range">
      <div className="gc-range-labels">
        <span>{labelOf(min)}</span>
        <span dir="ltr" aria-live="polite">
          {labelOf(value)}
        </span>
        <span>{labelOf(max)}</span>
      </div>
      <input
        id={id}
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function GameFilters({
  catalog,
  open,
  onClose,
}: {
  catalog: UseGameCatalogReturn;
  open: boolean;
  onClose: () => void;
}) {
  const {
    filters,
    allCategories,
    allTags,
    allYears,
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
    resetFilters,
    activeFiltersCount,
  } = catalog;

  return (
    <aside
      className="gc-filters-panel"
      data-open={open}
      aria-label="فلترة الألعاب"
    >
      <button
        type="button"
        className="gc-filters-close"
        aria-label="إغلاق لوحة الفلاتر"
        onClick={onClose}
      >
        <CloseIcon size={16} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>الفلاتر</h3>
        {activeFiltersCount > 0 ? (
          <button
            type="button"
            className="gc-chip"
            onClick={resetFilters}
            style={{ padding: '0.35rem 0.7rem' }}
          >
            مسح الكل ({activeFiltersCount})
          </button>
        ) : null}
      </div>

      <Section id="gc-filter-kind" title="نوع اللعب">
        <Chips<GameKind>
          items={(['room', 'instant', 'upcoming'] as const)}
          active={filters.kinds}
          onToggle={toggleKind}
          labelOf={(k) => KIND_META[k]}
        />
      </Section>

      <Section id="gc-filter-cat" title="التصنيفات">
        <Chips
          items={allCategories}
          active={filters.categories}
          onToggle={toggleCategory}
          labelOf={(c) => ({ label: c })}
        />
      </Section>

      <Section id="gc-filter-diff" title="الصعوبة">
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <Slider
            id="gc-diff-min"
            ariaLabel="الحد الأدنى للصعوبة"
            min={1}
            max={5}
            value={filters.difficultyMin}
            onChange={(v) => setDifficultyMin(v as DifficultyValue)}
            labelOf={(v) => `${'★'.repeat(v)}${'☆'.repeat(5 - v)}`}
          />
          <Slider
            id="gc-diff-max"
            ariaLabel="الحد الأقصى للصعوبة"
            min={1}
            max={5}
            value={filters.difficultyMax}
            onChange={(v) => setDifficultyMax(v as DifficultyValue)}
            labelOf={(v) => `${'★'.repeat(v)}${'☆'.repeat(5 - v)}`}
          />
        </div>
      </Section>

      <Section id="gc-filter-platforms" title="المنصات">
        <Chips<PlatformValue>
          items={(['web', 'pwa', 'mobile'] as const)}
          active={filters.platforms}
          onToggle={togglePlatform}
          labelOf={(p) => PLATFORM_META[p]}
        />
      </Section>

      <Section id="gc-filter-rating" title="التقييم الأدنى">
        <Slider
          id="gc-rating"
          ariaLabel="الحد الأدنى للتقييم"
          min={0}
          max={5}
          value={filters.ratingMin}
          onChange={setRatingMin}
          labelOf={(v) => (v === 0 ? 'الكل' : `${v.toFixed(1)} ★`)}
        />
      </Section>

      <Section id="gc-filter-now" title="النشاط اللحظي" defaultOpen={false}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            role="switch"
            aria-checked={filters.nowPlayingOnly}
            data-active={filters.nowPlayingOnly}
            className="gc-chip"
            onClick={toggleNowPlayingOnly}
          >
            🟢 نشط الآن
          </button>
        </div>
      </Section>

      <Section id="gc-filter-players" title="سعة اللاعبين">
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <Slider
            id="gc-players-min"
            ariaLabel="الحد الأدنى للاعبين"
            min={0}
            max={20}
            value={filters.playersMin}
            onChange={setPlayersMin}
            labelOf={(v) => (v === 0 ? '—' : `+${v}`)}
          />
          <Slider
            id="gc-players-max"
            ariaLabel="الحد الأقصى للاعبين"
            min={1}
            max={20}
            value={filters.playersMax}
            onChange={setPlayersMax}
            labelOf={(v) => (v === 20 ? '∞' : `${v}`)}
          />
        </div>
      </Section>

      <Section id="gc-filter-years" title="سنوات النشر">
        <Chips
          items={allYears.map(String)}
          active={filters.years.map(String)}
          onToggle={(v) => toggleYear(Number(v))}
          labelOf={(v) => ({ label: v })}
        />
      </Section>

      <Section id="gc-filter-tags" title="جدار الوسوم" defaultOpen={false}>
        <div className="gc-tag-wall">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              role="switch"
              aria-checked={filters.tags.includes(tag)}
              data-active={filters.tags.includes(tag)}
              className="gc-chip"
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}
