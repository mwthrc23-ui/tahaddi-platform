import {
  BookOpenCheck,
  Clock3,
  Eye,
  Lightbulb,
  MessageCircle,
  Moon,
  Shield,
  Sun,
  Target,
  Trophy,
  UserRoundSearch,
  Users,
  Vote,
} from 'lucide-react';
import { createMafiaGame } from '@/app/mafia/actions';
import { JoinQuizForm } from '@/components/home/join-quiz-form';
import { SiteLayout } from '@/components/layout';
import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import {
  mafiaBeginnerTips,
  mafiaHowToPlaySteps,
  mafiaRoleCatalog,
  mafiaWinConditions,
} from '@/lib/mafia/guidance';
import { mafiaRoleEmoji } from '@/lib/mafia/rules';

export default async function MafiaPage() {
  const session = await getCurrentSession();
  const games =
    session?.user?.id && hasDatabaseUrl()
      ? await getPrismaClient().mafiaGame.findMany({
          where: { hostId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            roomCode: true,
            status: true,
            _count: { select: { participants: true } },
          },
        })
      : [];

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <main className="section mafia-page">
        <div className="container">
          <div className="page-header">
            <div>
              <span className="eyebrow">
                <Moon aria-hidden="true" />
                لعبة اجتماعية مستقلة
              </span>
              <h1>من هو القاتل؟</h1>
              <p>
                أدوار سرية، ليل ونهار وتصويت. كل لاعب يرى بطاقته ومهمته فقط — والهدف واضح للجميع من
                أول دقيقة.
              </p>
            </div>
            <div className="mafia-hero-actions">
              <ButtonLink href="#mafia-start" variant="gold">
                ابدأ الآن
              </ButtonLink>
              <ButtonLink href="/join" variant="outline">
                دخول لاعب
              </ButtonLink>
            </div>
          </div>

          <section className="mafia-howto" aria-labelledby="mafia-howto-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <BookOpenCheck aria-hidden="true" />
                  للمبتدئين
                </span>
                <h2 id="mafia-howto-title">كيف تلعب في ٤ خطوات؟</h2>
                <p>لا تحتاج خبرة سابقة. اتبع التسلسل واترك المؤقت يدير المراحل.</p>
              </div>
            </div>
            <ol className="mafia-howto-list">
              {mafiaHowToPlaySteps.map((step, index) => (
                <li key={step.title}>
                  <span className="mafia-howto-index" aria-hidden="true">
                    {(index + 1).toLocaleString('ar-SA')}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

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
                  <span>
                    القاتل يختار ضحية، المحقق يتحقق، الطبيب/الحارس يحمون. الباقون ينتظرون. الوقت
                    الافتراضي ٤٥ ثانية.
                  </span>
                </div>
              </li>
              <li>
                <Sun aria-hidden="true" />
                <div>
                  <strong>٢. النهار</strong>
                  <span>
                    تُعلن نتيجة الليل (من خرج أو نجا). ناقشوا الأدلة في القناة العامة. الوقت
                    الافتراضي ٩٠ ثانية.
                  </span>
                </div>
              </li>
              <li>
                <Vote aria-hidden="true" />
                <div>
                  <strong>٣. التصويت</strong>
                  <span>
                    كل لاعب حي يثبّت صوتًا ضد مشتبه واحد. الأعلى أصواتًا يخرج. الوقت الافتراضي ٤٥
                    ثانية.
                  </span>
                </div>
              </li>
            </ol>
            <p className="mafia-flow-loop">
              بعد التصويت يبدأ ليل جديد تلقائيًا، وتستمر الدورة حتى يفوز القتلة أو المواطنون.
            </p>
          </section>

          <section className="mafia-win" aria-labelledby="mafia-win-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Trophy aria-hidden="true" />
                  شروط الفوز
                </span>
                <h2 id="mafia-win-title">متى تنتهي اللعبة؟</h2>
              </div>
            </div>
            <div className="card-grid two mafia-win-grid">
              <Card className="mafia-win-card mafia-win-card--citizens">
                <Target aria-hidden="true" />
                <h3>{mafiaWinConditions.citizens.title}</h3>
                <p>{mafiaWinConditions.citizens.detail}</p>
              </Card>
              <Card className="mafia-win-card mafia-win-card--killers">
                <Shield aria-hidden="true" />
                <h3>{mafiaWinConditions.killers.title}</h3>
                <p>{mafiaWinConditions.killers.detail}</p>
              </Card>
            </div>
          </section>

          <section className="mafia-roles" aria-labelledby="mafia-roles-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <UserRoundSearch aria-hidden="true" />
                  دليل الأدوار
                </span>
                <h2 id="mafia-roles-title">ما الذي يفعله كل دور؟</h2>
                <p>الأدوار تُوزَّع سرًا عند البدء. هذا الدليل عام للجميع قبل اللعب.</p>
              </div>
            </div>
            <ul className="mafia-roles-grid">
              {mafiaRoleCatalog.map((entry) => (
                <li key={entry.role}>
                  <article className="mafia-role-tile" data-team={entry.team.toLowerCase()}>
                    <div className="mafia-role-tile__head">
                      <span className="mafia-role-tile__emoji" aria-hidden="true">
                        {mafiaRoleEmoji[entry.role]}
                      </span>
                      <div>
                        <h3>{entry.label}</h3>
                        <Badge>{entry.teamLabel}</Badge>
                      </div>
                    </div>
                    <p>{entry.summary}</p>
                    <p className="mafia-role-tile__ability">
                      <strong>القدرة:</strong> {entry.ability}
                    </p>
                    {entry.unlockAt > 5 && (
                      <span className="mafia-role-tile__unlock">
                        يظهر من {entry.unlockAt.toLocaleString('ar-SA')} لاعبين
                      </span>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </section>

          <section className="mafia-tips" aria-labelledby="mafia-tips-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Lightbulb aria-hidden="true" />
                  نصائح سريعة
                </span>
                <h2 id="mafia-tips-title">حتى لا تضيع في أول جولة</h2>
              </div>
            </div>
            <ul className="mafia-tips-list">
              {mafiaBeginnerTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <div className="card-grid three mafia-features">
            <Card>
              <UserRoundSearch aria-hidden="true" />
              <h2>أدوار متوازنة</h2>
              <p className="muted">قاتل، محقق، طبيب، حارس، شاهد ومواطنون — بحسب عدد اللاعبين.</p>
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

          <div id="mafia-start" className="card-grid two mafia-entry-grid">
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
                <form action={createMafiaGame} className="stack-form">
                  <label>
                    الحد الأعلى للاعبين
                    <input name="maxPlayers" type="number" min="5" max="30" defaultValue="12" />
                  </label>
                  <label>
                    عدد القتلة
                    <select name="killerCount" defaultValue="1">
                      <option value="1">قاتل واحد</option>
                      <option value="2">قاتلان</option>
                      <option value="3">ثلاثة قتلة</option>
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      وقت الليل بالثواني
                      <input
                        name="nightSeconds"
                        type="number"
                        min="20"
                        max="180"
                        defaultValue="45"
                      />
                    </label>
                    <label>
                      وقت النهار بالثواني
                      <input name="daySeconds" type="number" min="30" max="300" defaultValue="90" />
                    </label>
                    <label>
                      وقت التصويت بالثواني
                      <input
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
