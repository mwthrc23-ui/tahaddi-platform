import { Radio, SkipForward, Square, Users } from 'lucide-react';
import { advanceLiveQuestion, finishLiveSession, startLiveSession } from '@/app/live/actions';
import { HostLayout } from '@/components/layout';
import { RoomPoller } from '@/components/live';
import { RoomCode } from '@/components/quiz';
import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { getLiveActiveCutoff } from '@/lib/live/engine';

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
            startedAt: true,
            currentQuestionPosition: true,
            questionStartedAt: true,
            questionAdvanceAt: true,
            quiz: {
              select: {
                title: true,
                autoLockAnswers: true,
                autoAdvance: true,
                speedScoring: true,
                questions: {
                  orderBy: { position: 'asc' },
                  select: { questionId: true },
                },
                _count: { select: { questions: true } },
              },
            },
            participants: {
              orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
              select: {
                id: true,
                displayName: true,
                score: true,
                correctCount: true,
                joinedAt: true,
                lastSeenAt: true,
                status: true,
              },
            },
            answers: { select: { questionId: true, participantId: true } },
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
        _count: { select: { questions: true } },
      },
    }),
  ]);
  const activeCutoff = getLiveActiveCutoff();
  const activeParticipants =
    selectedSession?.participants.filter(
      (participant) =>
        participant.status === 'CONNECTED' &&
        participant.lastSeenAt >= activeCutoff &&
        (!selectedSession.questionStartedAt ||
          participant.joinedAt <= selectedSession.questionStartedAt),
    ) ?? [];
  const currentQuestionId =
    selectedSession?.quiz.questions[selectedSession.currentQuestionPosition]?.questionId;
  const answeredParticipantIds = new Set(
    selectedSession?.answers
      .filter((answer) => answer.questionId === currentQuestionId)
      .map((answer) => answer.participantId) ?? [],
  );

  return (
    <HostLayout players={selectedSession?.participants.length ?? 0}>
      <div className="host-stage">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <Radio />
                تشغيل مباشر
              </span>
              <h1>لوحة المضيف</h1>
              <p>افتح غرفة من مسابقة محفوظة وشارك الرمز مع اللاعبين.</p>
            </div>
            <ButtonLink href="/quizzes/new" variant="gold">
              مسابقة جديدة
            </ButtonLink>
          </div>

          {liveError && (
            <p className="text-danger" role="alert">
              تعذّر تنفيذ العملية. تأكد أن المسابقة تحتوي على سؤال واحد على الأقل.
            </p>
          )}

          {selectedSession ? (
            <div className="card-grid two">
              {selectedSession.status === 'ACTIVE' && (
                <RoomPoller endpoint={`/api/live/${selectedSession.id}/tick`} />
              )}
              <div>
                <RoomCode
                  code={selectedSession.roomCode}
                  url={`/join/${selectedSession.roomCode}`}
                />
                <Card>
                  <div className="inline-between">
                    <div>
                      <h2>{selectedSession.quiz.title}</h2>
                      <p className="muted">
                        {selectedSession.quiz._count.questions.toLocaleString('ar-SA')} سؤال
                      </p>
                      <p className="muted">
                        السؤال{' '}
                        {(selectedSession.currentQuestionPosition + 1).toLocaleString('ar-SA')}
                        {' · '}
                        {answeredParticipantIds.size.toLocaleString('ar-SA')} من{' '}
                        {activeParticipants.length.toLocaleString('ar-SA')} أجابوا
                      </p>
                    </div>
                    <Badge className="badge-live">
                      {selectedSession.status === 'FINISHED' ? 'انتهت' : 'مباشرة'}
                    </Badge>
                  </div>
                  <div className="dashboard-actions">
                    <ButtonLink
                      href={`/broadcast?sessionId=${selectedSession.id}`}
                      variant="outline"
                    >
                      شاشة البث
                    </ButtonLink>
                    {selectedSession.status === 'ACTIVE' && (
                      <form action={advanceLiveQuestion}>
                        <input type="hidden" name="sessionId" value={selectedSession.id} />
                        <Button variant="secondary" type="submit">
                          <SkipForward />
                          السؤال التالي
                        </Button>
                      </form>
                    )}
                    <form action={finishLiveSession}>
                      <input type="hidden" name="sessionId" value={selectedSession.id} />
                      <Button variant="destructive" type="submit">
                        <Square />
                        إنهاء الجلسة
                      </Button>
                    </form>
                  </div>
                  <div className="question-meta">
                    <Badge>
                      {selectedSession.quiz.autoLockAnswers ? 'تثبيت فوري' : 'تأكيد يدوي'}
                    </Badge>
                    <Badge>
                      {selectedSession.quiz.autoAdvance ? 'انتقال تلقائي' : 'انتقال يدوي'}
                    </Badge>
                    <Badge>
                      {selectedSession.quiz.speedScoring ? 'نقاط حسب السرعة' : 'نقاط ثابتة'}
                    </Badge>
                  </div>
                  {selectedSession.questionAdvanceAt && (
                    <p className="text-success" role="status">
                      اكتملت الإجابات؛ الانتقال التلقائي جارٍ.
                    </p>
                  )}
                </Card>
              </div>
              <Card>
                <h2>
                  <Users />
                  اللاعبون
                </h2>
                {selectedSession.participants.length > 0 ? (
                  <div className="leaderboard-list">
                    {selectedSession.participants.map((participant, index) => (
                      <div className="leaderboard-item" key={participant.id}>
                        <span className="rank">{index + 1}</span>
                        <div className="player-name">
                          <strong>{participant.displayName}</strong>
                          <span>{participant.correctCount.toLocaleString('ar-SA')} صحيحة</span>
                        </div>
                        <strong className="score" dir="ltr">
                          {participant.score.toLocaleString('ar-SA')}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="بانتظار اللاعبين"
                    description="شارك رمز الغرفة ليبدأ الانضمام."
                  />
                )}
              </Card>
            </div>
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
