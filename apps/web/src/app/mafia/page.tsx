import {
  Clock3,
  Eye,
  Gauge,
  MessageCircle,
  Moon,
  Shield,
  Sun,
  UserRoundSearch,
  Users,
  Vote,
} from 'lucide-react';
import { createMafiaGame } from '@/app/mafia/actions';
import { GAME_GUIDES, GameHowTo } from '@/components/games/shared';
import { JoinQuizForm } from '@/components/home/join-quiz-form';
import { SiteLayout } from '@/components/layout';
import { MafiaModePresets } from '@/components/mafia/mafia-mode-presets';
import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { getCurrentSession } from '@/lib/auth/session';

export default async function MafiaPage() {
  const session = await getCurrentSession();
  let games: Array<{
    id: string;
    roomCode: string;
    status: string;
    _count: { participants: number };
  }> = [];
  if (session?.user?.id && hasDatabaseUrl()) {
    try {
      games = await getPrismaClient().mafiaGame.findMany({
        where: { hostId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          roomCode: true,
          status: true,
          _count: { select: { participants: true } },
        },
      });
    } catch (error) {
      console.error('[mafia] optional history query failed, falling back to empty', error);
    }
  }

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <main className="section mafia-page">
        <div className="container">
          <div className="page-header">
            <div>
              <span className="eyebrow">
                <Moon aria-hidden="true" />
                لعبة مستقلة
              </span>
              <h1>من هو القاتل؟</h1>
              <p>لعبة اجتماعية سرية بإدارة آلية أو يدوية، وأدوار لا يراها إلا أصحابها.</p>
            </div>
            <ButtonLink href="/join" variant="outline">
              دخول لاعب
            </ButtonLink>
          </div>

          <GameHowTo guide={GAME_GUIDES.mafia} />

          <section className="mafia-flow" aria-labelledby="mafia-flow-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Clock3 aria-hidden="true" />
                  دورة تلقائية واضحة
                </span>
                <h2 id="mafia-flow-title">متى تبدأ كل مرحلة وماذا يحدث؟</h2>
                <p>
                  يبدأ العد فور توزيع الأدوار، ثم ينتقل النظام تلقائيًا عند وصول المؤقت إلى الصفر.
                </p>
              </div>
            </div>
            <ol className="mafia-flow-list">
              <li>
                <Moon aria-hidden="true" />
                <div>
                  <strong>١. الليل</strong>
                  <span>الأدوار السرية تنفذ مهامها. الوقت الافتراضي ٤٥ ثانية.</span>
                </div>
              </li>
              <li>
                <Sun aria-hidden="true" />
                <div>
                  <strong>٢. النهار</strong>
                  <span>تُعلن نتيجة الليل ويبدأ النقاش العام. الوقت الافتراضي ٩٠ ثانية.</span>
                </div>
              </li>
              <li>
                <Vote aria-hidden="true" />
                <div>
                  <strong>٣. التصويت</strong>
                  <span>يثبت كل لاعب حي صوته. الوقت الافتراضي ٤٥ ثانية.</span>
                </div>
              </li>
            </ol>
            <p className="mafia-flow-loop">
              بعد التصويت يبدأ ليل جديد تلقائيًا، وتستمر الدورة حتى يفوز القتلة أو المواطنون.
            </p>
          </section>

          <div className="card-grid three mafia-features">
            <Card>
              <UserRoundSearch aria-hidden="true" />
              <h2>أدوار متوازنة</h2>
              <p className="muted">قاتل، محقق، طبيب، حارس، شاهد ومواطنون.</p>
            </Card>
            <Card>
              <Shield aria-hidden="true" />
              <h2>معلومة لا تُسرّب</h2>
              <p className="muted">كل لاعب يرى دوره وأفعاله وقناته المسموح بها فقط.</p>
            </Card>
            <Card>
              <MessageCircle aria-hidden="true" />
              <h2>دردشة مرتبطة بالمرحلة</h2>
              <p className="muted">نقاش عام نهارًا، وقنوات سرية ليلًا وللمستبعدين.</p>
            </Card>
          </div>

          <div className="card-grid two mafia-entry-grid">
            <Card>
              <Badge>للاعب</Badge>
              <h2>ادخل برمز الغرفة</h2>
              <p className="muted">لا تحتاج إلى حساب. الاسم والرمز يكفيان.</p>
              <JoinQuizForm inviteMode />
            </Card>

            <Card>
              <Badge className="badge-live">للمضيف</Badge>
              <h2>أنشئ غرفة قاتل</h2>
              {session?.user ? (
                <form action={createMafiaGame} className="stack-form" id="mafia-create-form">
                  <MafiaModePresets />

                  <label>
                    الحد الأعلى للاعبين
                    <input
                      id="mafia-maxPlayers"
                      name="maxPlayers"
                      type="number"
                      min="5"
                      max="30"
                      defaultValue="12"
                    />
                  </label>
                  <label>
                    عدد القتلة
                    <select id="mafia-killerCount" name="killerCount" defaultValue="1">
                      <option value="1">قاتل واحد</option>
                      <option value="2">قاتلان</option>
                      <option value="3">ثلاثة قتلة</option>
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      <Gauge aria-hidden="true" /> وقت الليل بالثواني
                      <input
                        id="mafia-nightSeconds"
                        name="nightSeconds"
                        type="number"
                        min="20"
                        max="180"
                        defaultValue="45"
                      />
                    </label>
                    <label>
                      وقت النهار بالثواني
                      <input
                        id="mafia-daySeconds"
                        name="daySeconds"
                        type="number"
                        min="30"
                        max="300"
                        defaultValue="90"
                      />
                    </label>
                    <label>
                      وقت التصويت بالثواني
                      <input
                        id="mafia-votingSeconds"
                        name="votingSeconds"
                        type="number"
                        min="20"
                        max="120"
                        defaultValue="45"
                      />
                    </label>
                  </div>
                  <label>
                    إدارة المراحل
                    <select name="autoMode" defaultValue="on">
                      <option value="on">تلقائية مع تحكم المضيف</option>
                      <option value="off">يدوية بالكامل</option>
                    </select>
                  </label>
                  <label>
                    الدردشة
                    <select name="chatEnabled" defaultValue="on">
                      <option value="on">مفعلة</option>
                      <option value="off">متوقفة</option>
                    </select>
                  </label>
                  <label>
                    مهلة الرسائل بالثواني
                    <input name="slowModeSeconds" type="number" min="0" max="30" defaultValue="2" />
                  </label>
                  <Button type="submit" size="lg">
                    <Eye aria-hidden="true" />
                    إنشاء الغرفة
                  </Button>
                </form>
              ) : (
                <>
                  <EmptyState
                    title="سجّل دخولك كمضيف"
                    description="اللاعب يدخل كزائر، أما إنشاء الغرفة وإدارتها فيحتاجان حسابًا."
                  />
                  <div className="center-actions">
                    <ButtonLink href="/auth/sign-in?next=%2Fmafia">تسجيل الدخول</ButtonLink>
                  </div>
                </>
              )}
            </Card>
          </div>

          {games.length > 0 && (
            <section className="mafia-history">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    <Users aria-hidden="true" />
                    غرفك الأخيرة
                  </span>
                  <h2>متابعة وإدارة</h2>
                </div>
              </div>
              <div className="card-grid three">
                {games.map((game) => (
                  <Card key={game.id}>
                    <div className="inline-between">
                      <Badge>{game.roomCode}</Badge>
                      <span className="muted">
                        {game._count.participants.toLocaleString('ar-SA')} لاعب
                      </span>
                    </div>
                    <h3>{game.status === 'FINISHED' ? 'لعبة منتهية' : 'غرفة قابلة للمتابعة'}</h3>
                    <ButtonLink href={`/mafia/${game.id}`} variant="outline">
                      فتح لوحة المضيف
                    </ButtonLink>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}