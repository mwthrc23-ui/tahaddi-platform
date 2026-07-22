import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Crown,
  FlaskConical,
  Gamepad2,
  Landmark,
  ListOrdered,
  Medal,
  Radio,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getPublicQuizzes, type PublicQuiz, type PublicQuizzesResult } from '@/app/quizzes/actions';
import { JoinQuizForm } from '@/components/home/join-quiz-form';
import { SiteLayout } from '@/components/layout';
import { Reveal } from '@/components/motion/reveal';
import { QuizTimer } from '@/components/quiz';
import { ButtonLink, CategoryCard, CompetitionCard, EmptyState, GameCard } from '@/components/ui';
import { getCurrentSession } from '@/lib/auth/session';

const games = [
  { title: 'دقيقة ذكاء', description: 'عشرة أسئلة سريعة في ستين ثانية', mode: 'speed' },
  { title: 'صح أم خطأ', description: 'اختبر حدسك ومعلوماتك في جولة خاطفة', mode: 'truefalse' },
  { title: 'رتّبها', description: 'ضع الأحداث والعناصر في ترتيبها الصحيح', mode: 'order' },
];

const categories = [
  { title: 'تاريخ', icon: <Landmark aria-hidden="true" />, slug: 'تاريخ' },
  { title: 'علوم', icon: <FlaskConical aria-hidden="true" />, slug: 'علوم' },
  { title: 'رياضة', icon: <Medal aria-hidden="true" />, slug: 'رياضة' },
  { title: 'تقنية', icon: <Cpu aria-hidden="true" />, slug: 'تقنية' },
];

const gameIcons = [Timer, CheckCircle2, ListOrdered];

const emptyPublicQuizzes: PublicQuizzesResult = { status: 'success', quizzes: [] };

const arenaFlow = [
  { label: 'المضيف يطلق الغرفة', value: 'رمز مباشر' },
  { label: 'الزوار يدخلون بالاسم', value: 'بدون حساب' },
  { label: 'السؤال يظهر للجميع', value: 'ترتيب فوري' },
];

const identitySignals = [
  { label: 'SYSTEM', value: 'Quantum UI', icon: <Sparkles aria-hidden="true" /> },
  { label: 'API', value: 'رمز حي', icon: <Zap aria-hidden="true" /> },
  { label: 'LIVE', value: 'لوحة مباشرة', icon: <Radio aria-hidden="true" /> },
];

const hostSignals = [
  { label: 'بنك أسئلة', value: 'جاهز' },
  { label: 'دعوة', value: 'رابط واحد' },
  { label: 'نتيجة', value: 'على الشاشة' },
];

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageContent publicQuizResult={emptyPublicQuizzes} user={null} />}>
      <HomePageData />
    </Suspense>
  );
}

async function HomePageData() {
  const [publicQuizResult, session] = await Promise.all([getPublicQuizzes(6), getCurrentSession()]);

  return (
    <HomePageContent
      publicQuizResult={publicQuizResult}
      user={session?.user ? { name: session.user.name } : null}
    />
  );
}

function HomePageContent({
  publicQuizResult,
  user,
}: {
  publicQuizResult: PublicQuizzesResult;
  user: { name?: string | null } | null;
}) {
  const publicQuizzes = publicQuizResult.quizzes;

  return (
    <SiteLayout user={user}>
      <section className="hero">
        <Reveal className="container hero-arena" eager>
          <div className="hero-copy">
            <span className="eyebrow hero-kicker">
              <Sparkles />
              منصة تحدّي المباشرة
            </span>
            <h1>لوحة تحدّي بنمط نظام تشغيل كمومي.</h1>
            <p>
              واجهة Cyber داكنة بخطوط قطرية، زجاج أسود، مؤشرات LIVE/API، وأزرار ذهبية
              واضحة تجعل إدارة المسابقة تبدو مثل مختبر تفاعلي مباشر.
            </p>
            <div className="identity-signals" aria-label="ملامح الهوية البصرية">
              {identitySignals.map((item) => (
                <div key={item.label}>
                  <span aria-hidden="true">{item.icon}</span>
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
            <div className="hero-command" aria-label="دخول سريع إلى غرفة تحدّي">
              <div className="hero-command-header">
                <span>دخول الزائر</span>
                <strong>A7K9PQ</strong>
              </div>
              <JoinQuizForm />
            </div>
            <div className="hero-actions">
              <ButtonLink href="/quizzes/new" variant="gold">
                <Trophy />
                أنشئ مسابقة
              </ButtonLink>
              <Link className="text-link" href="/demo/question">
                <Zap />
                جرّب سؤالًا سريعًا
              </Link>
            </div>
            <div className="hero-flow" aria-label="كيف تعمل التجربة">
              {arenaFlow.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-stage arena-stage" aria-label="لوحة مسابقة مباشرة">
            <div className="arena-glow glow-one" aria-hidden="true" />
            <div className="arena-glow glow-two" aria-hidden="true" />
            <div className="arena-scoreboard">
              <div className="scoreboard-topline">
                <span>غرفة مباشرة</span>
                <strong dir="ltr">A7K9PQ</strong>
              </div>
              <div className="scoreboard-question">
                <span>السؤال الآن</span>
                <h2>ما عاصمة المملكة العربية السعودية؟</h2>
              </div>
              <div className="scoreboard-options" aria-label="اختيارات السؤال">
                <span className="is-correct">الرياض</span>
                <span>جدة</span>
                <span>الدمام</span>
                <span>مكة</span>
              </div>
              <div className="scoreboard-footer">
                <div>
                  <Users aria-hidden="true" />
                  <span>لاعبون زوار</span>
                </div>
                <QuizTimer total={20} remaining={12} size="sm" />
              </div>
            </div>
            <div className="host-console">
              <div className="host-console-title">
                <Crown aria-hidden="true" />
                <strong>لوحة المضيف</strong>
              </div>
              {hostSignals.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="live-pulse-card">
              <Radio aria-hidden="true" />
              <span>بث حي</span>
              <strong>السؤال على الشاشة</strong>
            </div>
            <div className="answer-burst" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section tinted" id="games">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">أوضاع لعب جاهزة</span>
              <h2>المسابقة لا تبدأ من صفحة فارغة</h2>
            </div>
          </div>
          <div className="card-grid three">
            {games.map((item, index) => {
              const GameIcon = gameIcons[index % gameIcons.length] ?? Timer;
              return (
                <GameCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  icon={<GameIcon aria-hidden="true" />}
                  meta="العب الآن"
                  href={`/demo/question?mode=${item.mode}`}
                />
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="section">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">بنك الأسئلة</span>
              <h2>اختر الفئة التي تشعل الجولة</h2>
            </div>
          </div>
          <div className="card-grid four">
            {categories.map((item) => (
              <CategoryCard
                key={item.title}
                title={item.title}
                icon={item.icon}
                href={`/questions?category=${encodeURIComponent(item.slug)}`}
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section tinted" id="public-quizzes">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">جولات متاحة الآن</span>
              <h2>ادخل من الدعوة إلى اللعب مباشرة</h2>
            </div>
            <ButtonLink href="/quizzes" variant="outline">
              عرض الكل
              <ArrowLeft />
            </ButtonLink>
          </div>
          {publicQuizzes.length > 0 ? (
            <div className="card-grid three">
              {publicQuizzes.map((quiz: PublicQuiz) => (
                <CompetitionCard
                  key={quiz.id}
                  title={quiz.title}
                  description={quiz.description || 'مسابقة عامة نشطة وجاهزة للانضمام.'}
                  meta={`${quiz.questionCount.toLocaleString('ar-SA')} سؤال · ${quiz.ownerName || 'مضيف تحدّي'}`}
                  href={`/join/${quiz.roomCode}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                publicQuizResult.status === 'error'
                  ? 'تعذّر تحميل المسابقات العامة'
                  : 'لا توجد مسابقات عامة نشطة الآن'
              }
              description={
                publicQuizResult.status === 'error'
                  ? publicQuizResult.message
                  : 'ستظهر هنا أحدث الجولات العامة فور تفعيلها.'
              }
            />
          )}
        </Reveal>
      </section>

      <section className="section leaderboard-section">
        <Reveal className="container split-section">
          <div>
            <span className="eyebrow">لوحة الشرف</span>
            <h2>الصدارة تصبح مشهدًا</h2>
            <p>كل إجابة صحيحة تتحول إلى حركة واضحة أمام اللاعبين والمضيف.</p>
          </div>
          <div className="leaderboard-preview" aria-label="معاينة لوحة الشرف قبل بدء الجولة">
            <div className="leaderboard-preview-top">
              <span>جاهزة للبث</span>
              <strong>لوحة الشرف</strong>
            </div>
            <ol>
              <li>
                <span>المركز الأول</span>
                <strong>ينتظر أول إجابة</strong>
              </li>
              <li>
                <span>المركز الثاني</span>
                <strong>يتحرك مع الجولة</strong>
              </li>
              <li>
                <span>المركز الثالث</span>
                <strong>يظهر على الشاشة</strong>
              </li>
            </ol>
          </div>
        </Reveal>
      </section>

      <section className="section">
        <Reveal className="container cta">
          <div>
            <Gamepad2 />
            <span>مستعد لصناعة التحدّي؟</span>
            <h2>افتح الغرفة، أرسل الدعوة، واترك الحماس يعمل.</h2>
          </div>
          <ButtonLink href="/quizzes/new" variant="gold" size="lg">
            أنشئ مسابقتك
            <ArrowLeft />
          </ButtonLink>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
