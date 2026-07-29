import type { Metadata } from 'next';
import { SPECIAL_GAME_META, SPECIAL_GAME_ORDER, UPCOMING_SPECIAL_GAMES } from '@tahaddi/domain';
import { CcButton } from '@/components/claude-code';
import { INSTANT_GAME_META, INSTANT_GAME_ORDER } from '@/components/instant-games';
import { SiteLayout } from '@/components/layout';
import { getCurrentSession } from '@/lib/auth/session';
import { formatArabicModeCount, toArabicDigits } from '@/lib/utils';
import { Gamepad2, Users, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'الألعاب | تحدّي',
  description: 'أوضاع لعب مبتكرة: غرف جماعية برمز دعوة، وتحديات فورية بلا تسجيل.',
  alternates: { canonical: '/games' },
};

export default async function GamesPage() {
  const session = await getCurrentSession();
  const games = [
    ...SPECIAL_GAME_ORDER.map((mode) => ({
      ...SPECIAL_GAME_META[mode],
      kind: 'room' as const,
    })),
    ...INSTANT_GAME_ORDER.map((mode) => ({ ...INSTANT_GAME_META[mode], kind: 'instant' as const })),
  ];

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <section className="games-hub">
        <div className="container games-shell">
          <header className="games-hero">
            <div className="games-hero-content">
              <span className="games-hero-badge">
                <Zap aria-hidden="true" />
                {formatArabicModeCount(games.length)} وضع لعب
              </span>
              <h1>اختر قانون الجولة</h1>
              <p>
                غرف جماعية برمز وQR، أو تحديات فورية تبدأ من جهازك بلا حساب.
                اختر وضعك وابدأ الرحلة.
              </p>
              <div className="games-hero-stats">
                <div className="games-stat">
                  <Users aria-hidden="true" />
                  <div>
                    <strong>{formatArabicModeCount(games.length)}</strong>
                    <span>وضع لعب</span>
                  </div>
                </div>
                <div className="games-stat">
                  <Gamepad2 aria-hidden="true" />
                  <div>
                    <strong>{formatArabicModeCount(UPCOMING_SPECIAL_GAMES.length)}</strong>
                    <span>قيد التطوير</span>
                  </div>
                </div>
                <div className="games-stat">
                  <span className="games-stat-icon" aria-hidden="true">✨</span>
                  <div>
                    <strong>بلا حساب</strong>
                    <span>للاعبين</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="games-hero-visual" aria-hidden="true">
              <div className="games-orb games-orb--primary" />
              <div className="games-orb games-orb--secondary" />
              <div className="games-orb games-orb--tertiary" />
            </div>
          </header>

          <div className="games-section-label">
            <span className="games-section-dot" aria-hidden="true" />
            <h2>غرف جماعية حماسية</h2>
            <span className="games-section-count">{formatArabicModeCount(SPECIAL_GAME_ORDER.length)} ألعاب</span>
          </div>

          <div className="games-grid games-grid--room">
            {SPECIAL_GAME_ORDER.map((mode, index) => {
              const game = SPECIAL_GAME_META[mode];
              return (
                <article key={mode} className="game-card game-card--room" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="game-card__glow" aria-hidden="true" />
                  <div className="game-card__header">
                    <span className="game-card__index" aria-hidden="true" dir="ltr">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="game-card__kind">
                      <Users aria-hidden="true" />
                      جماعية
                    </span>
                  </div>
                  <div className="game-card__body">
                    <h3 id={`mode-${mode}`}>{game.title}</h3>
                    <p>{game.description}</p>
                    <div className="game-card__meta">
                      <div className="game-meta-item">
                        <Users aria-hidden="true" />
                        <span>{toArabicDigits(game.minimumPlayers)}+ لاعب</span>
                      </div>
                      <div className="game-meta-item">
                        <Zap aria-hidden="true" />
                        <span>{toArabicDigits(game.roundSeconds)} ث</span>
                      </div>
                      <div className="game-meta-item">
                        <Gamepad2 aria-hidden="true" />
                        <span>{game.contentLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="game-card__footer">
                    <CcButton href={`/games/${mode}`} aria-labelledby={`mode-${mode}`}>
                      أنشئ الغرفة
                    </CcButton>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="games-section-label">
            <span className="games-section-dot" aria-hidden="true" />
            <h2>تحديات فورية من جهازك</h2>
            <span className="games-section-count">{formatArabicModeCount(INSTANT_GAME_ORDER.length)} ألعاب</span>
          </div>

          <div className="games-grid games-grid--instant">
            {INSTANT_GAME_ORDER.map((mode, index) => {
              const game = INSTANT_GAME_META[mode];
              return (
                <article key={mode} className="game-card game-card--instant" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="game-card__glow" aria-hidden="true" />
                  <div className="game-card__header">
                    <span className="game-card__index" aria-hidden="true" dir="ltr">
                      {String(SPECIAL_GAME_ORDER.length + index + 1).padStart(2, '0')}
                    </span>
                    <span className="game-card__kind game-card__kind--instant">
                      <Zap aria-hidden="true" />
                      فورية
                    </span>
                  </div>
                  <div className="game-card__body">
                    <h3 id={`mode-${mode}`}>{game.title}</h3>
                    <p>{game.description}</p>
                    <div className="game-card__meta">
                      <div className="game-meta-item">
                        <Zap aria-hidden="true" />
                        <span>{toArabicDigits(game.roundSeconds)} ث</span>
                      </div>
                      <div className="game-meta-item">
                        <Gamepad2 aria-hidden="true" />
                        <span>{game.contentLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="game-card__footer">
                    <CcButton href={`/games/${mode}`} aria-labelledby={`mode-${mode}`}>
                      ابدأ اللعب
                    </CcButton>
                  </div>
                </article>
              );
            })}
          </div>

          {UPCOMING_SPECIAL_GAMES.length > 0 && (
            <section className="games-upcoming" aria-labelledby="games-soon-title">
              <div className="games-section-label">
                <span className="games-section-dot games-section-dot--upcoming" aria-hidden="true" />
                <h2 id="games-soon-title">قريبًا في تحدّي</h2>
              </div>
              <ul className="games-soon-list" role="list">
                {UPCOMING_SPECIAL_GAMES.map((game, index) => (
                  <li key={game.slug} className="games-soon-item" style={{ animationDelay: `${index * 60}ms` }}>
                    <span className="games-soon-mark" aria-hidden="true" dir="ltr">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="games-soon-content">
                      <strong>{game.title}</strong>
                      <span>{game.description}</span>
                    </div>
                    <span className="games-soon-badge">قيد التطوير</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <aside className="games-cta-card">
            <div className="games-cta-content">
              <span className="games-cta-icon" aria-hidden="true">🎯</span>
              <div>
                <h3>وصلك رمز دعوة من المضيف؟</h3>
                <p>ادخل كزائر بالاسم فقط، دون إنشاء حساب.</p>
              </div>
            </div>
            <CcButton href="/join" variant="ghost">
              ادخل بالرمز
            </CcButton>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
