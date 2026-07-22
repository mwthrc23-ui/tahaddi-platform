import { BroadcastLayout } from '@/components/layout';
import { QuestionProgress, RoomCode } from '@/components/quiz';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;

  if (!hasDatabaseUrl()) {
    return (
      <BroadcastLayout>
        <EmptyState title="قاعدة البيانات غير مهيأة" description="لا يمكن عرض جلسة بث الآن." />
      </BroadcastLayout>
    );
  }

  const session = await getPrismaClient().liveSession.findFirst({
    where: sessionId ? { id: sessionId } : { status: { in: ['WAITING', 'ACTIVE'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      roomCode: true,
      status: true,
      currentQuestionPosition: true,
      quiz: {
        select: {
          title: true,
          questions: {
            orderBy: { position: 'asc' },
            select: {
              question: {
                select: {
                  prompt: true,
                  category: true,
                  difficulty: true,
                  basePoints: true,
                  timeLimit: true,
                },
              },
            },
          },
        },
      },
      participants: {
        orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
        select: { id: true, displayName: true, score: true, correctCount: true },
      },
    },
  });

  const currentQuestion = session?.quiz.questions[session.currentQuestionPosition]?.question;

  return (
    <BroadcastLayout>
      {!session || !currentQuestion ? (
        <EmptyState
          title="لا توجد جلسة بث نشطة"
          description="ابدأ جلسة مسابقة من لوحة المضيف لعرض شاشة البث."
        />
      ) : (
        <div className="broadcast-stage">
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">غرفة {session.roomCode}</span>
                <h1>{session.quiz.title}</h1>
              </div>
              <Badge className="badge-live">
                {session.status === 'FINISHED' ? 'انتهت' : 'مباشرة'}
              </Badge>
            </div>
            <Card className="question-card">
              <div className="question-meta">
                <Badge>{currentQuestion.category ?? 'عام'}</Badge>
                <span>{currentQuestion.difficulty}</span>
                <span>{currentQuestion.basePoints.toLocaleString('ar-SA')} نقطة</span>
                <span>{currentQuestion.timeLimit.toLocaleString('ar-SA')} ثانية</span>
              </div>
              <QuestionProgress
                current={session.currentQuestionPosition + 1}
                total={session.quiz.questions.length}
              />
              <h2>{currentQuestion.prompt}</h2>
            </Card>
          </section>
          <aside>
            <RoomCode code={session.roomCode} url={`/join/${session.roomCode}`} />
            <Card>
              <h2>الترتيب</h2>
              {session.participants.length > 0 ? (
                <div className="leaderboard-list">
                  {session.participants.map((participant, index) => (
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
                <EmptyState title="بانتظار اللاعبين" description="سيظهر الترتيب بعد أول انضمام." />
              )}
            </Card>
          </aside>
        </div>
      )}
    </BroadcastLayout>
  );
}
