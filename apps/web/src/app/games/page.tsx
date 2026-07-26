import type { Metadata } from 'next';
import { SPECIAL_GAME_META, SPECIAL_GAME_ORDER, UPCOMING_SPECIAL_GAMES } from '@tahaddi/domain';
import { CcButton, CcFlag, CcPrompt, CcRule } from '@/components/claude-code';
import { SiteLayout } from '@/components/layout';
import { getCurrentSession } from '@/lib/auth/session';
import { toArabicDigits } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'الألعاب الخاصة | تحدّي',
  description:
    'أوضاع لعب جماعية بقوانين مقلوبة وبنك أسئلة جاهز. أنشئ الغرفة، شارك الرمز، وابدأ الجولة.',
  alternates: { canonical: '/games' },
};

export default async function GamesPage() {
  const session = await getCurrentSession();
  const games = SPECIAL_GAME_ORDER.map((mode) => SPECIAL_GAME_META[mode]);

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <section className="cc">
        <div className="cc-shell">
          <CcPrompt command="tahaddi games --list" />

          <header className="cc-head">
            <h1>اختر قانون الجولة</h1>
            <p>
              {toArabicDigits(games.length)} أوضاع لعب جماعية ببنك أسئلة جاهز. أنشئ الغرفة، شارك
              الرمز أو امسح QR، ثم ابدأ الجولة.
            </p>
          </header>

          <div className="cc-status" dir="ltr">
            <span>
              <span className="cc-dot" aria-hidden="true" />
              {games.length} modes ready
            </span>
            <span>{UPCOMING_SPECIAL_GAMES.length} in development</span>
            <span>no account required</span>
          </div>

          <ul className="cc-list" role="list">
            {games.map((game, index) => (
              <li className="cc-item" key={game.mode}>
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
                        name="--players"
                        value={`${game.minimumPlayers}+`}
                        label="الحد الأدنى للاعبين"
                      />
                      <CcFlag
                        name="--timer"
                        value={`${game.roundSeconds}s`}
                        label="مدة الجولة بالثواني"
                      />
                      <CcFlag name="--bank" value="ready" label="حالة بنك الأسئلة" />
                    </dl>

                    <CcButton href={`/games/${game.mode}`} aria-labelledby={`mode-${game.mode}`}>
                      شغّل الوضع
                    </CcButton>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {UPCOMING_SPECIAL_GAMES.length > 0 && (
            <section aria-labelledby="cc-soon-title">
              <CcRule label="# in development" />
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
