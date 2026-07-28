import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Gamepad2,
  Landmark,
  ListOrdered,
  Medal,
  Palette,
  Skull,
  Timer,
  WholeWord,
} from 'lucide-react';
import { Suspense } from 'react';
import { getPublicQuizzes, type PublicQuiz, type PublicQuizzesResult } from '@/app/quizzes/actions';
import { SiteLayout } from '@/components/layout';
import { Reveal } from '@/components/motion/reveal';
import { ButtonLink, CategoryCard, CompetitionCard, EmptyState, GameCard } from '@/components/ui';
import { getCurrentSession } from '@/lib/auth/session';

/*
 * THESIS: ادخل الغرفة عبر لوحة تحدّي؛ نرفض واجهة SaaS العامة ونبني استوديو مسابقات عربيًا حيًا.
 * OWN-WORLD: أسود عميق، ذهب مادي، سماوي للحالة، لوحات بث بخطوط دقيقة وظلال صلبة.
 * STORY: يفهم الزائر المنتج، ينضم أو ينشئ، ثم يرى كيف تتحول الغرفة إلى جولة وتتويج.
 * FIRST VIEWPORT: رسالة كبيرة يمينًا، غرفة مباشرة صادقة يسارًا، والفعل الأساسي ظاهر دون تمرير.
 * FORM: Prestige Split المعتمد من معاينة v18، مع Control Deck وLive Stage لبقية المسارات.
 */

const games = [
  {
    title: 'دقيقة ذكاء',
    description: 'أنشئ جولة قصيرة بأسئلة محددة الوقت',
    href: '/quizzes/new',
    icon: Timer,
  },
  {
    title: 'صح أم خطأ',
    description: 'أضف أسئلة بخيارين وتصحيح مباشر',
    href: '/quizzes/new',
    icon: CheckCircle2,
  },
  {
    title: 'رتّبها',
    description: 'جهّز أسئلة تعتمد على الترتيب الصحيح',
    href: '/quizzes/new',
    icon: ListOrdered,
  },
  {
    title: 'من هو القاتل؟',
    description: 'لعبة اجتماعية مستقلة بأدوار سرية ودردشة مرحلية',
    href: '/mafia',
    icon: Skull,
  },
  {
    title: 'اختر قانون الجولة',
    description: 'العالم الموازي والزمن المقلوب بغرف مباشرة ورمز QR',
    href: '/games',
    icon: Gamepad2,
  },
  {
    title: 'ومضة الذاكرة',
    description: 'احفظ تسلسل الرموز وارفع المستوى قبل انتهاء الدقيقة',
    href: '/games/memory-flash',
    icon: Brain,
  },
  {
    title: 'شفرة الحروف',
    description: 'فكّ الكلمات العربية المبعثرة واجمع مئة نقطة لكل حل',
    href: '/games/word-code',
    icon: WholeWord,
  },
  {
    title: 'خدعة الألوان',
    description: 'اختر لون الحبر وتجاهل معنى الكلمة في سباق تركيز سريع',
    href: '/games/color-rush',
    icon: Palette,
  },
];

const categories = [
  { title: 'تاريخ', icon: <Landmark aria-hidden="true" />, slug: 'تاريخ' },
  { title: 'علوم', icon: <FlaskConical aria-hidden="true" />, slug: 'علوم' },
  { title: 'رياضة', icon: <Medal aria-hidden="true" />, slug: 'رياضة' },
  { title: 'تقنية', icon: <Cpu aria-hidden="true" />, slug: 'تقنية' },
];

const emptyPublicQuizzes: PublicQuizzesResult = { status: 'success', quizzes: [] };

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
    <SiteLayout user={user} variant="home">
      <section className="home-preview-hero" id="top">
        <Reveal className="container home-preview-layout" eager>
          <div className="home-preview-copy">
            <div className="home-preview-status">
              <span aria-hidden="true" />
              الغرف المباشرة جاهزة
            </div>
            <h1>
              الجولة تبدأ من <span>رمز واحد.</span>
            </h1>
            <p>
              أنشئ مسابقة عربية تفاعلية، شارك رمز الغرفة، وتابع الإجابات والصدارة لحظة بلحظة من لوحة
              مضيف واحدة.
            </p>
            <div className="home-preview-actions">
              <ButtonLink href="/quizzes/new" variant="gold">
                أنشئ أول تحدٍّ
                <span aria-hidden="true">←</span>
              </ButtonLink>
              <ButtonLink href="/join" variant="outline">
                لديّ رمز غرفة
              </ButtonLink>
            </div>
            <div className="home-preview-trust" role="list" aria-label="مزايا المنصة">
              <span role="listitem">لا يحتاج اللاعب إلى حساب</span>
              <span role="listitem">نتائج مباشرة</span>
              <span role="listitem">مصمم للعربية</span>
            </div>
          </div>

          <div className="home-preview-arena" role="region" aria-label="معاينة غرفة تحدّي مباشرة">
            <div className="home-preview-rings" aria-hidden="true" />
            <div className="home-room-card">
              <div className="home-room-top">
                <span>غرفة الثقافة العامة</span>
                <strong>معاينة</strong>
              </div>
              <div className="home-room-body">
                <div className="home-room-code" dir="ltr">
                  PQQDJK
                </div>
                <p>شارك الرمز مع اللاعبين</p>
                <div className="home-room-players" aria-label="نماذج صور اللاعبين">
                  <span>س</span>
                  <span>ن</span>
                  <span>م</span>
                  <span>ع</span>
                  <span>+4</span>
                </div>
                <div className="home-room-feed">
                  <div>
                    <small>المتصلون</small>
                    <strong>١٢ لاعبًا</strong>
                  </div>
                  <div>
                    <small>حالة الجولة</small>
                    <strong>بانتظار البدء</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section home-how-section" id="how">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">لوحة المضيف</span>
              <h2>كل شيء أمامك، من الدعوة إلى التتويج.</h2>
              <p>جهّز الجولة، شارك رمزها، ثم راقب انضمام اللاعبين وأطلق السؤال في الوقت المناسب.</p>
            </div>
          </div>
          <div className="home-how-grid" role="list" aria-label="خطوات تشغيل المسابقة">
            <div role="listitem">
              <strong>جهّز الجولة</strong>
              <span>اختر الأسئلة واضبط الوقت قبل فتح الغرفة.</span>
            </div>
            <div role="listitem">
              <strong>شارك الرمز</strong>
              <span>يدخل اللاعبون بالاسم فقط، دون إنشاء حساب.</span>
            </div>
            <div role="listitem">
              <strong>تابع النتيجة</strong>
              <span>راقب الإجابات والصدارة مباشرة من لوحة واحدة.</span>
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
            {games.map((item) => {
              const GameIcon = item.icon;
              return (
                <GameCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  icon={<GameIcon aria-hidden="true" />}
                  meta="أنشئ هذا النمط"
                  href={item.href}
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
                  meta={[`${quiz.questionCount.toLocaleString('ar-SA')} سؤال`, quiz.ownerName]
                    .filter(Boolean)
                    .join(' · ')}
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

      <section className="section leaderboard-section" id="leaderboard">
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
