import { ArrowLeft, CircleDotDashed, Clock3, Orbit, QrCode, Sparkles, UsersRound } from 'lucide-react';
import { SiteLayout } from '@/components/layout';
import { Badge, ButtonLink, Card } from '@/components/ui';
import { getCurrentSession } from '@/lib/auth/session';

const games = [
  {
    href: '/games/parallel-world',
    title: 'العالم الموازي',
    description: 'وزّع سؤالًا مختلفًا على كل لاعب، ثم اكشف أن الإجابة كانت واحدة.',
    players: 'لاعبان أو أكثر',
    time: '25 ثانية',
    status: 'جاهزة الآن',
    icon: Orbit,
  },
  {
    href: '/games/reverse-time',
    title: 'الزمن المقلوب',
    description: 'اعرض الإجابة أولًا، واجعل اللاعبين يصنعون السؤال ثم يصوّتون للأذكى.',
    players: '3 لاعبين أو أكثر',
    time: '35 ثانية',
    status: 'جاهزة الآن',
    icon: Clock3,
  },
  {
    title: 'الحفرة',
    description: 'مخاطرة تكتيكية تقلب النقاط بين الفريقين عند الإجابة الصحيحة.',
    players: 'فريقان',
    time: 'قيد التجهيز',
    status: 'قريبًا',
    icon: CircleDotDashed,
  },
] as const;

export default async function GamesPage() {
  const session = await getCurrentSession();

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <section className="section special-games-index">
        <div className="container">
          <div className="special-games-heading">
            <div>
              <span className="special-games-heading__eyebrow">
                <Sparkles aria-hidden="true" />
                أوضاع اللعب المباشر
              </span>
              <h1>اختر قانون الجولة</h1>
              <p>اختر نمط اللعب أولًا، ثم افتح الغرفة وشارك رمز الدعوة.</p>
            </div>
            <div className="special-games-heading__symbol" aria-hidden="true">
              <QrCode />
            </div>
          </div>

          <div className="special-games-catalogue" role="list" aria-label="قوانين الجولة المتاحة">
            {games.map((game, index) => (
              <Card className="special-game-card" key={game.title} role="listitem">
                <div className="special-game-card__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="special-game-card__body">
                  <game.icon aria-hidden="true" />
                  <h2>{game.title}</h2>
                  <p>{game.description}</p>
                  <Badge>{game.status}</Badge>
                  <span className="special-game-card__rule">قانون اللعب</span>
                  <div className="special-game-card__facts">
                    <span>
                      <UsersRound aria-hidden="true" />
                      {game.players}
                    </span>
                    <span>
                      <Clock3 aria-hidden="true" />
                      {game.time}
                    </span>
                  </div>
                  {'href' in game ? (
                    <ButtonLink
                      aria-label={`افتح لعبة ${game.title}`}
                      href={game.href}
                      variant={index === 0 ? 'gold' : 'primary'}
                    >
                      افتح اللعبة
                      <ArrowLeft aria-hidden="true" />
                    </ButtonLink>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
