'use client';

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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SiteLayout } from '@/components/layout';
import { Reveal } from '@/components/motion/reveal';
import { QuizTimer } from '@/components/quiz';
import {
  Button,
  ButtonLink,
  CategoryCard,
  EmptyState,
  GameCard,
  Input,
} from '@/components/ui';

const ROOM_CODE_RE = /^\d{6}$/;

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

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [joining, setJoining] = useState(false);

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const clean = code.replace(/\s/g, '');
    if (!ROOM_CODE_RE.test(clean)) {
      setCodeError('الرمز يجب أن يتكوّن من ٦ أرقام بالضبط.');
      return;
    }
    setCodeError('');
    setJoining(true);
    router.push(`/demo/waiting?code=${clean}`);
  }

  return (
    <SiteLayout>
      <section className="hero">
        <Reveal className="container hero-grid" eager>
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles />
              منصة المسابقات العربية
            </span>
            <h1>
              كل سؤال <span className="hero-accent">يشعل الحماس.</span>
              <br />
              وكل إجابة تقرّبك من القمة.
            </h1>
            <p>
              انضم إلى جولات مباشرة، نافس أصدقاءك، واصنع لحظات لا تُنسى في تجربة عربية سريعة وواضحة.
            </p>
            <form className="join-box" id="join" onSubmit={handleJoin}>
              <Input
                label="رمز الغرفة"
                className="join-field"
                placeholder="مثال: 582 914"
                value={code}
                onChange={(event) => { setCode(event.target.value); setCodeError(''); }}
                inputMode="numeric"
                aria-describedby={codeError ? 'join-error' : undefined}
                error={codeError || undefined}
              />
              <Button size="lg" type="submit" loading={joining} disabled={joining}>
                انضم الآن
                <ArrowLeft />
              </Button>
            </form>
            <div className="hero-actions">
              <ButtonLink href="/quizzes" variant="gold">
                <Trophy />
                أنشئ مسابقة
              </ButtonLink>
              <Link className="text-link" href="/demo/question">
                <Zap />
                جرّب سؤالًا سريعًا
              </Link>
            </div>
          </div>

          <div className="hero-stage" aria-label="معاينة مسابقة مباشرة">
            <div className="stage-ring ring-one" aria-hidden="true" />
            <div className="stage-ring ring-two" aria-hidden="true" />
            <div className="hero-trophy">
              <Crown />
              <strong>تحدّي</strong>
              <span>نافس · أجب · تصدّر</span>
            </div>
            <div className="floating-score score-a">
              <span>+١٠٠٠</span>
              <small>إجابة صحيحة</small>
            </div>
            <div className="floating-score score-b">
              <Users />
              <strong>مباشر</strong>
              <small>انضم الآن</small>
            </div>
            <div className="floating-score score-c">
              <Radio />
              <strong>مباشر</strong>
            </div>
            <div className="hero-preview-timer">
              <QuizTimer total={20} remaining={12} size="sm" />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section tinted" id="games">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">اختر وابدأ فورًا</span>
              <h2>ألعاب سريعة</h2>
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
              <span className="eyebrow">مئات الأسئلة</span>
              <h2>استكشف الفئات</h2>
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

      <section className="section leaderboard-section">
        <Reveal className="container split-section">
          <div>
            <span className="eyebrow">لوحة الشرف</span>
            <h2>نجوم هذا الأسبوع</h2>
            <p>السرعة والمعرفة وسلسلة الإجابات الصحيحة تصنع الفارق.</p>
          </div>
          <EmptyState title="لا توجد بيانات بعد" description="ستظهر أفضل اللاعبين هنا بعد انطلاق أولى المسابقات." />
        </Reveal>
      </section>

      <section className="section">
        <Reveal className="container cta">
          <div>
            <Gamepad2 />
            <span>مستعد لصناعة التحدّي؟</span>
            <h2>حوّل فكرتك إلى مسابقة يعيشها الجميع.</h2>
          </div>
          <ButtonLink href="/quizzes" variant="gold" size="lg">
            أنشئ مسابقتك
            <ArrowLeft />
          </ButtonLink>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
