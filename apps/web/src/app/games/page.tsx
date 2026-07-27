import type { Metadata } from 'next';
import { SPECIAL_GAME_META, SPECIAL_GAME_ORDER, UPCOMING_SPECIAL_GAMES } from '@tahaddi/domain';
import { Fragment } from 'react';
import { CcButton, CcFlag, CcPrompt, CcRule } from '@/components/claude-code';
import { INSTANT_GAME_META, INSTANT_GAME_ORDER } from '@/components/instant-games';
import { SiteLayout } from '@/components/layout';
import { getCurrentSession } from '@/lib/auth/session';
import { formatArabicModeCount, toArabicDigits } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'الألعاب الخاصة | تحدّي',
  description:
    'أوضاع لعب جماعية وفردية بقوانين مبتكرة ومحتوى جاهز. أنشئ غرفة أو ابدأ تحديًا فوريًا.',
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
      <section className="cc">
        <div className="cc-shell">
          <CcPrompt command="tahaddi games --list" />

          <header className="cc-head">
            <h1>اختر قانون الجولة</h1>
            <p>
              {toArabicDigits(games.length)} ألعاب جاهزة: غرف جماعية برمز وQR، وتحديات فورية تبدأ من
              جهازك بلا تسجيل.
            </p>
          </header>

          <div className="cc-status" aria-label="حالة أوضاع اللعب">
            <span>
              <span className="cc-dot" aria-hidden="true" />
              {formatArabicModeCount(games.length)} جاهزة للعب
            </span>
            <span>{formatArabicModeCount(UPCOMING_SPECIAL_GAMES.length)} قيد التطوير</span>
            <span>الدخول للضيوف بلا حساب</span>
          </div>

          <ul className="cc-list" role="list">
            {games.map((game, index) => (
              <Fragment key={game.mode}>
                {(index === 0 || index === SPECIAL_GAME_ORDER.length) && (
                  <li className="cc-group-label" aria-hidden="true">
                    <CcRule
                      label={index === 0 ? '# غرف جماعية حماسية' : '# تحديات فورية من جهازك'}
                    />
                  </li>
                )}
                <li className="cc-item">
                  <article className="cc-card">
                    <span className="cc-card__index" aria-hidden="true" dir="ltr">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="cc-card__body">
                      <span className="cc-card__slug" dir="ltr" aria-hidden="true">
                        games/{game.mode}
                      </span>

                      <h2 id={`mode-${game.mode}`}>{game.title}</h2>
                      <p>{game.description}</p>

                      <dl className="cc-flags" dir="ltr">
                        <CcFlag
                          name="players"
                          value={`${toArabicDigits(game.minimumPlayers)}+`}
                          label="الحد الأدنى للاعبين"
                        />
                        <CcFlag
                          name="timer"
                          value={`${toArabicDigits(game.roundSeconds)} ث`}
                          label="مدة الجولة بالثواني"
                        />
                        <CcFlag name="content" value={game.contentLabel} label="نوع محتوى اللعبة" />
                      </dl>

                      <CcButton href={`/games/${game.mode}`} aria-labelledby={`mode-${game.mode}`}>
                        {game.kind === 'room' ? 'أنشئ الغرفة' : 'ابدأ اللعب'}
                      </CcButton>
                    </div>
                  </article>
                </li>
              </Fragment>
            ))}
          </ul>

          {UPCOMING_SPECIAL_GAMES.length > 0 && (
            <section aria-labelledby="cc-soon-title">
              <CcRule label="# قريبًا في تحدّي" />
              <h2 id="cc-soon-title" className="sr-only">
                أوضاع قيد التطوير
              </h2>
              <ul className="cc-soon" role="list">
                {UPCOMING_SPECIAL_GAMES.map((game) => (
                  <li key={game.slug}>
                    <span className="cc-soon__mark" dir="ltr" aria-hidden="true">
                      {'//'}
                    </span>
                    <span>
                      <b>{game.title}</b> — {game.description}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <aside className="cc-join">
            <p>
              <strong>وصلك رمز دعوة من المضيف؟</strong>
              ادخل كزائر بالاسم فقط دون إنشاء حساب.
            </p>
            <CcButton href="/join" variant="ghost">
              ادخل بالرمز
            </CcButton>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
