'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Gamepad2,
  Star,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import type { EnhancedGameMeta } from './game-catalog-types';
import { toArabicDigits } from '@/lib/utils';

function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="gc-rating" role="img" aria-label={`تقييم ${value.toFixed(1)} من 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} fill="currentColor" aria-hidden="true" />
      ))}
      {half ? <Star fill="currentColor" opacity={0.55} aria-hidden="true" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} opacity={0.3} aria-hidden="true" />
      ))}
    </span>
  );
}

const VISUAL_EMOJI: Record<string, string> = {
  'parallel-world': '🌌',
  'reverse-time': '⏳',
  infiltrator: '🕵️',
  spectrum: '🌈',
  'memory-flash': '🧠',
  'word-code': '🔤',
  'color-rush': '🎨',
};

const KIND_LABEL: Record<EnhancedGameMeta['kind'], string> = {
  room: 'جماعية',
  instant: 'فورية',
  upcoming: 'قريبًا',
};

export function GameCard({
  game,
  index,
  view,
}: {
  game: EnhancedGameMeta;
  index: number;
  view: 'grid' | 'list';
}) {
  const href = game.kind === 'upcoming' ? '/games' : `/games/${game.mode}`;
  const isDisabled = game.kind === 'upcoming';
  const cta =
    game.kind === 'room'
      ? 'أنشئ الغرفة'
      : game.kind === 'instant'
        ? 'ابدأ اللعب'
        : 'قيد التطوير';
  return (
    <article
      className="gc-card"
      data-kind={game.kind}
      style={
        {
          '--game-accent': game.accent,
          animationDelay: `${(index % 6) * 70}ms`,
        } as React.CSSProperties
      }
    >
      <div className="gc-card-head">
        <span className="gc-card-index" aria-hidden="true" dir="ltr">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="gc-card-kind" data-kind={game.kind}>
          {game.kind === 'room' ? (
            <Users aria-hidden="true" size={12} />
          ) : game.kind === 'instant' ? (
            <Zap aria-hidden="true" size={12} />
          ) : null}
          {KIND_LABEL[game.kind]}
        </span>
      </div>

      <div className="gc-card-visual" aria-hidden="true">
        <span>{VISUAL_EMOJI[game.mode] ?? VISUAL_EMOJI[game.id] ?? '🎮'}</span>
      </div>

      <div className="gc-card-body">
        <h3 className="gc-card-title" id={`gc-title-${game.id}`}>
          {game.title}
        </h3>
        <p className="gc-card-desc">{game.description}</p>
        <div className="gc-meta-row">
          {game.requiresRealtime ? (
            <span className="gc-meta-chip" data-realtime="true">
              <Wifi aria-hidden="true" size={12} />
              بث لحظي
            </span>
          ) : null}
          <span className="gc-meta-chip">
            <Users aria-hidden="true" size={12} />
            {toArabicDigits(game.minimumPlayers)}–
            {game.maximumPlayers >= 20 ? '∞' : toArabicDigits(game.maximumPlayers)} لاعب
          </span>
          <span className="gc-meta-chip">
            <Zap aria-hidden="true" size={12} />
            {toArabicDigits(game.roundSeconds)} ث
          </span>
          <span className="gc-meta-chip">
            <Gamepad2 aria-hidden="true" size={12} />
            {game.contentLabel}
          </span>
          <span className="gc-meta-chip">
            <RatingStars value={game.rating} />
          </span>
        </div>
      </div>

      <div className="gc-card-foot">
        {game.nowPlaying > 0 && game.kind !== 'upcoming' ? (
          <span className="gc-card-live-dot" aria-live="polite">
            {toArabicDigits(game.nowPlaying)} نشط الآن
          </span>
        ) : (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
            {game.kind === 'upcoming' ? 'قريبًا في تحدّي' : `سنة ${toArabicDigits(game.year)}`}
          </span>
        )}
        <Link
          href={href}
          aria-labelledby={`gc-title-${game.id}`}
          aria-disabled={isDisabled || undefined}
          style={isDisabled ? { pointerEvents: 'none', opacity: 0.55 } : undefined}
        >
          {cta}
          <ArrowRight className="cc-btn__chevron" dir="ltr" aria-hidden="true" size={14} />
        </Link>
      </div>
    </article>
  );
}
