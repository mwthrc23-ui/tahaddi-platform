import { BroadcastLayout } from '@/components/layout';
import { QuestionImage } from '@/components/questions/question-image';
import { QuestionProgress, RoomCode, WinnerPodium } from '@/components/quiz';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '؟') + (parts[1]?.[0] ?? '');
}

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
                  imageUrl: true,
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
  const winners =
    session?.participants.slice(0, 3).map((participant) => ({
      name: participant.displayName,
      initials: getInitials(participant.displayName),
      score: participant.score,
    })) ?? [];

  return (
    <BroadcastLayout>
      {!session ? (
        <EmptyState
          title="لا توجد جلسة بث نشطة"
          description="ابدأ جلسة مسابقة من لوحة المضيف لعرض شاشة البث."
        />
      ) : session.status === 'FINISHED' ? (
        <div className="broadcast-stage">
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">غرفة {session.roomCode}</span>
                <h1>النتيجة النهائية</h1>
                <p>انتهت مسابقة {session.quiz.title}، وهذه مراكز المتسابقين الثلاثة الأولى.</p>
              </div>
              <Badge>انتهت</Badge>
            </div>
            <Card className="results-screen">
              <h2>منصة الفائزين</h2>
              {winners.length > 0 ? (
                <WinnerPodium winners={winners} />
              ) : (
                <EmptyState title="لا توجد نتائج بعد" description="لم ينضم أي متسابق للجلسة." />
              )}
            </Card>
          </section>
          <aside>
            <Card>
              <h2>ترتيب المتسابقين</h2>
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
            </Card>
          </aside>
        </div>
      ) : !currentQuestion ? (
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
              <Badge className="badge-live">مباشرة</Badge>
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
              {currentQuestion.imageUrl && (
                <QuestionImage src={currentQuestion.imageUrl} className="question-media" eager />
              )}
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
