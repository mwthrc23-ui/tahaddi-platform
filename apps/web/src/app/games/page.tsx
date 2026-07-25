import { Clock3, Orbit, QrCode, UsersRound } from 'lucide-react';
import { SiteLayout } from '@/components/layout';
import { ButtonLink, Card } from '@/components/ui';
import { getCurrentSession } from '@/lib/auth/session';

const games = [
  {
    href: '/games/parallel-world',
    title: 'العالم الموازي',
    description: 'وزّع سؤالًا مختلفًا على كل لاعب، ثم اكشف أن الإجابة كانت واحدة.',
    players: 'لاعبان أو أكثر',
    time: '25 ثانية',
    icon: Orbit,
  },
  {
    href: '/games/reverse-time',
    title: 'الزمن المقلوب',
    description: 'اعرض الإجابة أولًا، واجعل اللاعبين يصنعون السؤال ثم يصوّتون للأذكى.',
    players: '3 لاعبين أو أكثر',
    time: '35 ثانية',
    icon: Clock3,
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
              <h1>اختر قانون الجولة</h1>
              <p>لعبتان جماعيتان ببنك أسئلة جاهز. أنشئ الغرفة، شارك الرمز أو امسح QR، ثم ابدأ.</p>
            </div>
            <QrCode aria-hidden="true" />
          </div>

          <div className="special-games-catalogue">
            {games.map((game, index) => (
              <Card className="special-game-card" key={game.href}>
                <div className="special-game-card__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="special-game-card__body">
                  <game.icon aria-hidden="true" />
                  <h2>{game.title}</h2>
                  <p>{game.description}</p>
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
                  <ButtonLink href={game.href} variant={index === 0 ? 'gold' : 'primary'}>
                    افتح اللعبة
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
