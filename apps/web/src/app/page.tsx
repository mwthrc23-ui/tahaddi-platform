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
import { useState } from 'react';
import { SiteLayout } from '@/components/layout';
import { Reveal } from '@/components/motion/reveal';
import { LeaderboardItem, LiveStatus, QuizTimer } from '@/components/quiz';
import {
  Button,
  ButtonLink,
  CategoryCard,
  CompetitionCard,
  GameCard,
  Input,
} from '@/components/ui';
import { categories, competitions, games, players } from '@/mocks';

const gameIcons = [Timer, CheckCircle2, ListOrdered];
const categoryIcons = [Landmark, FlaskConical, Medal, Cpu];

export default function HomePage() {
  const [code, setCode] = useState('');
  const [joinNotice, setJoinNotice] = useState('');

  return (
    <SiteLayout>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
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
            <form
              className="join-box"
              id="join"
              onSubmit={(event) => {
                event.preventDefault();
                setJoinNotice(
                  code.trim()
                    ? 'الانضمام المباشر قيد التجهيز. يمكنك الآن معاينة شاشة انتظار اللاعب.'
                    : 'أدخل رمز الغرفة أولًا، أو افتح المعاينة التجريبية مباشرةً.',
                );
              }}
            >
              <Input
                label="رمز الغرفة"
                className="join-field"
                placeholder="مثال: 582 914"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
              />
              <Button size="lg" type="submit">
                انضم الآن
                <ArrowLeft />
              </Button>
            </form>
            {joinNotice && (
              <p className="join-notice" role="status">
                {joinNotice} <Link href="/demo/waiting">فتح المعاينة</Link>
              </p>
            )}
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
              <strong>٢٤٨</strong>
              <small>يتنافسون الآن</small>
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

      <section className="section" id="competitions">
        <Reveal className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">الآن على تحدّي</span>
              <h2>مسابقات مباشرة</h2>
            </div>
            <ButtonLink href="/quizzes" variant="ghost">
              افتح المنشئ
              <ArrowLeft />
            </ButtonLink>
          </div>
          <div className="card-grid three">
            {competitions.map((item) => (
              <CompetitionCard
                key={item.id}
                title={item.title}
                description={`${item.category} · ${item.questions} سؤالًا`}
                meta={`${item.players} لاعبًا`}
              />
            ))}
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
                  meta="العب الآن"
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
            {categories.map((item, index) => {
              const CategoryIcon = categoryIcons[index % categoryIcons.length] ?? Landmark;
              return (
                <CategoryCard
                  key={item.title}
                  title={item.title}
                  description={`${item.count} سؤالًا`}
                  icon={<CategoryIcon aria-hidden="true" />}
                />
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="section leaderboard-section">
        <Reveal className="container split-section">
          <div>
            <span className="eyebrow">لوحة الشرف</span>
            <h2>نجوم هذا الأسبوع</h2>
            <p>السرعة والمعرفة وسلسلة الإجابات الصحيحة تصنع الفارق.</p>
            <LiveStatus status="live" />
          </div>
          <div className="leaderboard-list">
            {players.slice(0, 5).map((player) => (
              <LeaderboardItem key={player.id} {...player} />
            ))}
          </div>
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
