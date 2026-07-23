'use client';

import { ArrowLeft, LogOut, Play, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { demoQuestions, OPTION_LABELS } from '@/data/demo-questions';
import {
  calcEarned,
  clearSession,
  initSession,
  loadSession,
  saveSession,
  streakMultiplier,
  type DemoSession,
} from '@/lib/session-store';
import { SiteLayout } from '@/components/layout';
import {
  AnswerOption,
  QuestionCard,
  QuestionProgress,
  QuizTimer,
  ScoreDisplay,
} from '@/components/quiz';
import { Alert, Badge, Button, Card, EmptyState } from '@/components/ui';

// ---------------------------------------------------------------------------
// WaitingScreen
// ---------------------------------------------------------------------------
export function WaitingScreen() {
  const router = useRouter();

  function startQuiz() {
    clearSession();
    router.push('/demo/question?intro=1');
  }

  return (
    <SiteLayout>
      <div className="demo-page">
        <div className="container">
          <div className="demo-heading">
            <div>
              <Badge>معاينة تفاعلية</Badge>
              <h1>جولة تدريبية</h1>
              <p>هذه المعاينة لا تنشئ غرفة ولا تضيف لاعبين أو نتائج إلى حسابك.</p>
            </div>
            <Button variant="destructive" onClick={() => router.push('/')}>
              <LogOut />
              مغادرة
            </Button>
          </div>
          <div className="waiting-grid">
            <Card>
              <h2>ما الذي ستراه؟</h2>
              <p>سؤال تدريبي، تصحيح فوري، ثم ملخص لنقاطك المحفوظة على هذا الجهاز.</p>
            </Card>
            <Card>
              <EmptyState
                title="لا توجد غرفة أو قائمة لاعبين"
                description="أنشئ مسابقة حقيقية من لوحة المضيف للحصول على رمز دعوة وبيانات مباشرة."
              />
            </Card>
          </div>
          <Alert variant="info">لن تظهر في هذه المعاينة أسماء أو نتائج افتراضية.</Alert>
          <div className="center-actions" style={{ marginTop: '1.5rem' }}>
            <Button size="lg" variant="gold" onClick={startQuiz}>
              <Play />
              ابدأ التحدّي
            </Button>
          </div>
          <DemoSteps current="waiting" />
        </div>
      </div>
    </SiteLayout>
  );
}

// ---------------------------------------------------------------------------
// QuestionScreen — آلة حالة كاملة
// ---------------------------------------------------------------------------
type Phase = 'intro' | 'live' | 'revealed' | 'finished';

function getInitPhase(currentIndex: number): Phase {
  if (typeof window === 'undefined') return 'live';
  const params = new URLSearchParams(window.location.search);
  return params.get('intro') === '1' && currentIndex === 0 ? 'intro' : 'live';
}

export function QuestionScreen() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession>(() => loadSession() ?? initSession());
  const [phase, setPhase] = useState<Phase>(() => getInitPhase(session.currentIndex));
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [remaining, setRemaining] = useState<number>(() => {
    const q = demoQuestions[session.currentIndex] ?? demoQuestions[0];
    return q.timeLimit;
  });
  const [earned, setEarned] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<number | null>(null);

  const question = demoQuestions[session.currentIndex] ?? demoQuestions[0];
  const isLastQuestion = session.currentIndex >= demoQuestions.length - 1;
  const correctIndex = question.options.findIndex((o) => o.isCorrect);

  // Countdown 3→2→1→live: call setState inside the timer callback, not synchronously
  useEffect(() => {
    if (phase !== 'intro') return;
    if (countdown <= 0) {
      const id = window.setTimeout(() => {
        setRemaining(question.timeLimit);
        setPhase('live');
      }, 400);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, countdown, question.timeLimit]);

  // Timer: call revealAnswer inside callback to avoid synchronous setState in effect
  useEffect(() => {
    if (phase !== 'live' || remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    timerRef.current = id;
    return () => window.clearTimeout(id);
  }, [phase, remaining]);

  // Reveal when timer hits 0
  useEffect(() => {
    if (phase === 'live' && remaining === 0) {
      const id = window.setTimeout(() => revealAnswer(undefined), 0);
      return () => window.clearTimeout(id);
    }
  }, [phase, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  function revealAnswer(optionIndex: number | undefined) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const correct = optionIndex === correctIndex;
    const pts = correct
      ? calcEarned(question.basePoints, question.timeLimit, remaining, session.currentStreak)
      : 0;
    const newStreak = correct ? session.currentStreak + 1 : 0;
    const newLongest = Math.max(session.longestStreak, newStreak);
    const updatedSession: DemoSession = {
      ...session,
      score: session.score + pts,
      currentStreak: newStreak,
      longestStreak: newLongest,
      answers: [
        ...session.answers,
        {
          questionIndex: session.currentIndex,
          optionIndex: optionIndex ?? -1,
          correct,
          earned: pts,
        },
      ],
    };
    setEarned(pts);
    setSession(updatedSession);
    saveSession(updatedSession);
    setPhase('revealed');
  }

  function handleSelect(index: number) {
    if (phase !== 'live') return;
    setSelectedIndex(index);
  }

  function confirmAnswer() {
    if (phase !== 'live' || selectedIndex === undefined) return;
    revealAnswer(selectedIndex);
  }

  function goNext() {
    if (isLastQuestion) {
      const finished = { ...session, finished: true };
      saveSession(finished);
      router.push('/demo/results');
      return;
    }
    const next: DemoSession = { ...session, currentIndex: session.currentIndex + 1 };
    saveSession(next);
    setSession(next);
    setSelectedIndex(undefined);
    setEarned(0);
    setPhase('live');
    setRemaining(demoQuestions[next.currentIndex]?.timeLimit ?? 20);
  }

  function optionState(index: number) {
    if (phase === 'live') return selectedIndex === index ? 'selected' : 'default';
    if (index === correctIndex) return 'correct';
    if (index === selectedIndex && selectedIndex !== correctIndex) return 'wrong';
    return 'disabled';
  }

  if (phase === 'intro') {
    return (
      <SiteLayout>
        <div
          className="demo-page question-screen"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ opacity: 0.7, marginBottom: '0.5rem' }}>تبدأ المسابقة خلال</p>
            <div
              role="timer"
              aria-live="assertive"
              style={{ fontSize: '6rem', fontWeight: 800, lineHeight: 1 }}
            >
              {countdown > 0 ? countdown : 'ابدأ!'}
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const multiplier = streakMultiplier(session.currentStreak);

  return (
    <SiteLayout>
      <div className="demo-page question-screen">
        <div className="container">
          <div className="question-top">
            <div>
              <Badge>جولة تدريبية</Badge>
              <QuestionProgress current={session.currentIndex + 1} total={demoQuestions.length} />
            </div>
            <QuizTimer total={question.timeLimit} remaining={remaining} size="lg" />
          </div>
          <QuestionCard
            number={session.currentIndex + 1}
            text={question.prompt}
            type={question.type === 'TRUE_FALSE' ? 'صح أم خطأ' : 'اختيار من متعدد'}
            difficulty={
              question.difficulty === 'EASY'
                ? 'سهل'
                : question.difficulty === 'MEDIUM'
                  ? 'متوسط'
                  : 'صعب'
            }
            points={question.basePoints}
            time={question.timeLimit}
            category={question.category}
            status={phase === 'live' ? 'مفتوح' : 'مغلق'}
          >
            <div className="answers-list">
              {question.options.map((option, index) => (
                <AnswerOption
                  key={index}
                  label={(OPTION_LABELS[index] ?? 'A') as 'A' | 'B' | 'C' | 'D'}
                  text={option.text}
                  state={optionState(index)}
                  onSelect={phase === 'live' ? () => handleSelect(index) : undefined}
                />
              ))}
            </div>
            {phase === 'revealed' && question.explanation && (
              <p
                className="question-explanation"
                aria-live="polite"
                style={{ marginTop: '1rem', opacity: 0.85 }}
              >
                💡 {question.explanation}
              </p>
            )}
          </QuestionCard>
          <div className="inline-between">
            <ScoreDisplay
              score={session.score}
              earned={earned}
              streak={session.currentStreak}
              multiplier={multiplier}
            />
            {phase === 'live' ? (
              <Button size="lg" onClick={confirmAnswer} disabled={selectedIndex === undefined}>
                تأكيد الإجابة
                <ArrowLeft />
              </Button>
            ) : (
              <Button size="lg" onClick={goNext}>
                {isLastQuestion ? 'عرض النتائج' : 'السؤال التالي'}
                <ArrowLeft />
              </Button>
            )}
          </div>
          <DemoSteps current="question" />
        </div>
      </div>
    </SiteLayout>
  );
}

// ---------------------------------------------------------------------------
export function ResultsScreen() {
  const router = useRouter();
  const [session] = useState<DemoSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadSession();
  });

  function replayQuiz() {
    clearSession();
    router.push('/demo/question?intro=1');
  }

  const lastAnswer = session?.answers.at(-1);
  const lastQuestion = lastAnswer ? demoQuestions[lastAnswer.questionIndex] : null;
  const lastCorrectOption = lastQuestion?.options.find((o) => o.isCorrect);

  if (!session || !lastAnswer || !lastQuestion || !lastCorrectOption) {
    return (
      <SiteLayout>
        <div className="demo-page results-screen">
          <div className="container narrow">
            <EmptyState
              title="لا توجد نتيجة محفوظة"
              description="أجب عن سؤال في الجولة التدريبية أولًا، أو افتح غرفة حقيقية من لوحة المضيف."
            />
            <div className="center-actions">
              <Button onClick={replayQuiz}>ابدأ الجولة التدريبية</Button>
              <Link className="button button-outline button-md" href="/quizzes/new">
                أنشئ مسابقة حقيقية
              </Link>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="demo-page results-screen">
        <div className="container narrow">
          <div className="result-hero">
            <span>{lastAnswer.correct ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</span>
            <h1>{lastCorrectOption.text}</h1>
            <p>{lastQuestion.explanation}</p>
          </div>
          <ScoreDisplay
            score={session.score}
            earned={lastAnswer.earned}
            streak={session.currentStreak}
            multiplier={streakMultiplier(session.currentStreak)}
          />
          <Alert variant="info">
            لا يوجد ترتيب أو توزيع إجابات في الجولة التدريبية؛ هذه البيانات تظهر من جلسة حقيقية فقط.
          </Alert>
          <div
            className="center-actions"
            style={{ marginTop: '1.5rem', gap: '0.75rem', display: 'flex', flexWrap: 'wrap' }}
          >
            <Button variant="outline" onClick={replayQuiz}>
              أعد اللعب
            </Button>
            <Link className="button button-primary button-lg" href="/demo/winners">
              عرض ملخص الجولة
              <ArrowLeft />
            </Link>
          </div>
          <DemoSteps current="results" />
        </div>
      </div>
    </SiteLayout>
  );
}

// ---------------------------------------------------------------------------
// WinnersScreen
// ---------------------------------------------------------------------------
export function WinnersScreen() {
  const router = useRouter();
  const [session] = useState<DemoSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadSession();
  });
  const [shared, setShared] = useState(false);

  async function shareResult() {
    const text = `حققت ${(session?.score ?? 0).toLocaleString('ar-SA')} نقطة في الجولة التدريبية على تحدّي: ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'تحدّي — نتيجتي', text });
        return;
      } catch {
        /* fallback */
      }
    }
    await navigator.clipboard?.writeText(text);
    setShared(true);
    window.setTimeout(() => setShared(false), 2000);
  }

  function newChallenge() {
    clearSession();
    router.push('/demo/waiting');
  }

  return (
    <SiteLayout>
      <div className="demo-page winners-screen">
        <div className="container">
          <div className="centered-heading">
            <Badge>انتهت الجولة التدريبية</Badge>
            <h1>ملخص جولتك</h1>
            <p>يعرض هذا الملخص نتيجتك الفعلية المحفوظة على هذا الجهاز فقط.</p>
            {session && (
              <p aria-live="polite">
                نقاطك الإجمالية: <strong dir="ltr">{session.score.toLocaleString('ar-SA')}</strong>
                {' · '}أطول سلسلة: <strong>{session.longestStreak}</strong>
              </p>
            )}
          </div>
          {session ? (
            <div className="full-ranking">
              <ScoreDisplay score={session.score} streak={session.longestStreak} />
            </div>
          ) : (
            <EmptyState
              title="لا توجد جولة محفوظة"
              description="ابدأ الجولة التدريبية أولًا لعرض نتيجتك هنا."
            />
          )}
          <div className="center-actions">
            <Button variant="gold" onClick={shareResult} aria-live="polite">
              <Share2 />
              {shared ? 'تم النسخ!' : 'مشاركة النتيجة'}
            </Button>
            <Button variant="outline" onClick={newChallenge}>
              جولة تدريبية جديدة
            </Button>
            <Link className="button button-outline button-md" href="/">
              العودة للرئيسية
            </Link>
          </div>
          <DemoSteps current="winners" />
        </div>
      </div>
    </SiteLayout>
  );
}

// ---------------------------------------------------------------------------
// DemoSteps nav
// ---------------------------------------------------------------------------
function DemoSteps({ current }: { current: 'waiting' | 'question' | 'results' | 'winners' }) {
  const pages = [
    { id: 'waiting', label: 'الانتظار' },
    { id: 'question', label: 'السؤال' },
    { id: 'results', label: 'النتائج' },
    { id: 'winners', label: 'الملخص' },
  ];
  return (
    <nav className="demo-steps" aria-label="خطوات الجولة التدريبية">
      {pages.map((page) => (
        <Link
          key={page.id}
          className={page.id === current ? 'active' : ''}
          href={`/demo/${page.id}`}
        >
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
