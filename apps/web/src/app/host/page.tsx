import { Radio } from 'lucide-react';
import { startLiveSession } from '@/app/live/actions';
import { HostLayout } from '@/components/layout';
import { HostQuestionViewer, LiveHostExperience } from '@/components/live';
import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { createHostLiveAccessToken } from '@/lib/live/access-token';

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

  return (
    <HostLayout players={selectedSession?._count.participants ?? 0}>
      <div className="host-stage">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <Radio />
                تشغيل مباشر
              </span>
              <h1>لوحة المضيف</h1>
              <p>حالة موحدة من الخادم، وتوقيت متزامن لجميع اللاعبين.</p>
            </div>
            <ButtonLink href="/quizzes/new" variant="gold">
              مسابقة جديدة
            </ButtonLink>
          </div>

          {liveError && (
            <p className="text-danger" role="alert">
              تعذّر تشغيل المسابقة. تأكد أنها تحتوي على سؤال واحد على الأقل.
            </p>
          )}

          {selectedSession ? (
            <>
              <LiveHostExperience
                sessionId={selectedSession.id}
                hostId={user.id}
                accessToken={hostAccessToken}
                roomCode={selectedSession.roomCode}
                joinUrl={`${siteUrl.replace(/\/$/, '')}/join/${selectedSession.roomCode}`}
                initialAutoAdvance={selectedSession.quiz.autoAdvance}
              />
              <HostQuestionViewer
                questions={selectedSession.quiz.questions}
                currentPosition={selectedSession.currentQuestionPosition}
                answeredCount={selectedSession._count.answers}
                activeCount={selectedSession._count.participants}
              />
            </>
          ) : (
            <EmptyState
              title="اختر مسابقة لتشغيلها"
              description="المسابقات المحفوظة في حسابك تظهر أدناه ويمكن فتح غرفة مباشرة منها."
            />
          )}

          {sessions.length > 0 && (
            <div className="card-grid three">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <Badge className="badge-live">{session.roomCode}</Badge>
                  <h2>{session.quiz.title}</h2>
                  <p className="muted">
                    {session._count.participants.toLocaleString('ar-SA')} لاعب
                  </p>
                  <ButtonLink href={`/host?sessionId=${session.id}`} variant="outline">
                    فتح اللوحة
                  </ButtonLink>
                </Card>
              ))}
            </div>
          )}

          <div className="card-grid three">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <div className="inline-between">
                  <Badge>{quiz.status === 'ACTIVE' ? 'منشورة' : 'مسودة'}</Badge>
                  <span dir="ltr">{quiz.roomCode}</span>
                </div>
                <h2>{quiz.title}</h2>
                <p>{quiz.description || 'بدون وصف.'}</p>
                <p className="muted">
                  {quiz._count.questions.toLocaleString('ar-SA')} سؤال جاهز للجلسة
                </p>
                {quiz.questions.length > 0 && (
                  <details className="host-quiz-preview">
                    <summary>مشاهدة الأسئلة</summary>
                    <ol>
                      {quiz.questions.map(({ question }) => (
                        <li key={question.id}>{question.prompt}</li>
                      ))}
                    </ol>
                  </details>
                )}
                <form action={startLiveSession}>
                  <input type="hidden" name="quizId" value={quiz.id} />
                  <Button type="submit" fullWidth disabled={quiz._count.questions === 0}>
                    تشغيل مباشر
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </HostLayout>
  );
}
