import { Radio, Users, Zap, Trophy } from 'lucide-react';
import { startLiveSession } from '@/app/live/actions';
import { HostLayout } from '@/components/layout';
import { HostQuestionViewer, LiveHostExperience } from '@/components/live';
import { Button, ButtonLink, EmptyState } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { createHostLiveAccessToken } from '@/lib/live/access-token';
import { toArabicDigits } from '@/lib/utils';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; liveError?: string }>;
}) {
  const [{ sessionId, liveError }, user] = await Promise.all([
    searchParams,
    requireActiveUser('/host'),
  ]);
  const prisma = getPrismaClient();
  const [selectedSession, sessions, quizzes] = await Promise.all([
    sessionId
      ? prisma.liveSession.findFirst({
          where: { id: sessionId, hostId: user.id },
          select: {
            id: true,
            roomCode: true,
            status: true,
            currentQuestionPosition: true,
            quiz: {
              select: {
                title: true,
                autoAdvance: true,
                questions: {
                  orderBy: { position: 'asc' },
                  select: {
                    questionId: true,
                    question: {
                      select: {
                        id: true,
                        prompt: true,
                        imageUrl: true,
                        category: true,
                        timeLimit: true,
                        basePoints: true,
                        options: {
                          orderBy: { position: 'asc' },
                          select: { id: true, text: true, isCorrect: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            _count: { select: { participants: true, answers: true } },
          },
        })
      : null,
    prisma.liveSession.findMany({
      where: { hostId: user.id, status: { in: ['WAITING', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        roomCode: true,
        status: true,
        quiz: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { ownerId: user.id, status: { not: 'ARCHIVED' } },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        description: true,
        roomCode: true,
        status: true,
        questions: {
          orderBy: { position: 'asc' },
          select: { question: { select: { id: true, prompt: true } } },
        },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  const siteUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const hostAccessToken = selectedSession
    ? createHostLiveAccessToken(selectedSession.id, user.id)
    : '';

  const liveSessionCount = selectedSession?._count.participants ?? 0;
  const quizCount = quizzes.length;
  const activeSessionCount = sessions.length;

  return (
    <HostLayout players={liveSessionCount}>
      <div className="host-stage">
        <div className="host-main">
          <header className="host-main-header">
            <div>
              <span className="eyebrow">
                <Radio />
                تشغيل مباشر
              </span>
              <h1>لوحة المضيف</h1>
              <p>تحكم كامل بالجولة، ومراقبة مباشرة للاعبين والأجوبة.</p>
            </div>
            <ButtonLink href="/quizzes/new" variant="gold">
              <Trophy aria-hidden="true" />
              مسابقة جديدة
            </ButtonLink>
          </header>

          {liveError && (
            <div className="host-alert host-alert--danger" role="alert">
              <Zap aria-hidden="true" />
              <div>
                <strong>تعذّر تشغيل المسابقة</strong>
                <span>تأكد بأنها تحتوي على سؤال واحد على الأقل.</span>
              </div>
            </div>
          )}

          <div className="host-stats">
            <div className="host-stat">
              <Users aria-hidden="true" />
              <div>
                <strong>{toArabicDigits(liveSessionCount)}</strong>
                <span>لاعب متصل</span>
              </div>
            </div>
            <div className="host-stat">
              <Trophy aria-hidden="true" />
              <div>
                <strong>{toArabicDigits(quizCount)}</strong>
                <span>مسابقة جاهزة</span>
              </div>
            </div>
            <div className="host-stat">
              <Zap aria-hidden="true" />
              <div>
                <strong>{toArabicDigits(activeSessionCount)}</strong>
                <span>جلسة نشطة</span>
              </div>
            </div>
          </div>

          <div className="host-main-content">
            {selectedSession ? (
              <>
                <div className="host-live-wrapper">
                  <LiveHostExperience
                    sessionId={selectedSession.id}
                    hostId={user.id}
                    accessToken={hostAccessToken}
                    roomCode={selectedSession.roomCode}
                    joinUrl={`${siteUrl.replace(/\/$/, '')}/join/${selectedSession.roomCode}`}
                    initialAutoAdvance={selectedSession.quiz.autoAdvance}
                  />
                </div>
                <div className="host-question-viewer-wrapper">
                  <div className="host-question-viewer-header">
                    <Users aria-hidden="true" />
                    <strong>الأسئلة</strong>
                    <span className="host-panel__badge host-panel__badge--success">
                      {toArabicDigits(selectedSession._count.answers)} إجابة
                    </span>
                  </div>
                  <div className="host-question-viewer-body">
                    <HostQuestionViewer
                      questions={selectedSession.quiz.questions}
                      currentPosition={selectedSession.currentQuestionPosition}
                      answeredCount={selectedSession._count.answers}
                      activeCount={selectedSession._count.participants}
                    />
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="اختر مسابقة لتشغيلها"
                description="المسابعات المحفوظة في حسابك تظهر أدناه ويمكن فتح غرفة مباشرة منها."
              />
            )}
          </div>
        </div>

        <aside className="host-sidebar">
          {sessions.length > 0 && (
            <div className="host-panel">
              <div className="host-panel__header">
                <span className="host-panel__title">
                  <Radio aria-hidden="true" />
                  جلسات نشطة
                </span>
                <span className="host-panel__badge host-panel__badge--live">
                  {toArabicDigits(activeSessionCount)}
                </span>
              </div>
              <div className="host-quiz-grid">
                {sessions.map((session) => (
                  <div key={session.id} className="host-quiz-row">
                    <span className="host-quiz-row__number" dir="ltr">
                      {session.roomCode.slice(0, 2)}
                    </span>
                    <div className="host-quiz-row__content">
                      <h4>{session.quiz.title}</h4>
                      <p>
                        {toArabicDigits(session._count.participants)} لاعب · {' '}
                        <span dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {session.status}
                        </span>
                      </p>
                    </div>
                    <div className="host-quiz-row__actions">
                      <ButtonLink
                        href={`/host?sessionId=${session.id}`}
                        variant="outline"
                        size="sm"
                        fullWidth
                      >
                        فتح
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="host-panel">
            <div className="host-panel__header">
              <span className="host-panel__title">
                <Trophy aria-hidden="true" />
                مسابعاتك
              </span>
              <span className="host-panel__badge">{toArabicDigits(quizCount)}</span>
            </div>
            <div className="host-quiz-grid">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="host-quiz-row">
                  <span className="host-quiz-row__number" dir="ltr">
                    {quiz.roomCode?.slice(0, 2) ?? '--'}
                  </span>
                  <div className="host-quiz-row__content">
                    <h4>{quiz.title}</h4>
                    <p>
                      {toArabicDigits(quiz._count.questions)} سؤال · {quiz.status === 'ACTIVE' ? 'منشورة' : 'مسودة'}
                    </p>
                  </div>
                  <form action={startLiveSession} className="host-quiz-row__actions">
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <Button
                      type="submit"
                      variant="gold"
                      size="sm"
                      disabled={quiz._count.questions === 0}
                    >
                      تشغيل
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          <div className="host-panel host-panel--cta">
            <div className="host-panel__header">
              <span className="host-panel__title">
                <Users aria-hidden="true" />
                انضم بالرمز
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              شارك رابط الجلسة مع اللاعبين. يدخلون بالاسم فقط، بلا حساب.
            </p>
            <ButtonLink href="/join" variant="outline" fullWidth>
              فتح صفحة الانضمام
            </ButtonLink>
          </div>
        </aside>
      </div>
    </HostLayout>
  );
}
