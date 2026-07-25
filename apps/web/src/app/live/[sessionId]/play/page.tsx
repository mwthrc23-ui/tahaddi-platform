import { redirect } from 'next/navigation';
import { submitLiveAnswer } from '@/app/live/actions';
import { SiteLayout } from '@/components/layout';
import { QuestionImage } from '@/components/questions/question-image';
import { QuestionProgress, ScoreDisplay, WinnerPodium } from '@/components/quiz';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { getCurrentSession } from '@/lib/auth/session';

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

function getAnswerNotice(value: string | undefined) {
  if (value === 'saved') return 'تم تسجيل إجابتك وحفظ نتيجتك.';
  if (value === 'closed') return 'السؤال غير مفتوح الآن.';
  if (value === 'invalid') return 'الخيار غير صالح لهذا السؤال.';
  if (value === 'error') return 'تعذّر تسجيل الإجابة الآن.';
  return '';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '؟') + (parts[1]?.[0] ?? '');
}

export default async function LivePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ participantId?: string; answer?: string }>;
}) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const participantId = query.participantId ?? '';

  if (!hasDatabaseUrl()) {
    redirect('/');
  }

  const [session, authSession] = await Promise.all([
    getPrismaClient().liveSession.findUnique({
      where: { id: sessionId },
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
                    id: true,
                    prompt: true,
                    imageUrl: true,
                    type: true,
                    category: true,
                    difficulty: true,
                    timeLimit: true,
                    basePoints: true,
                    explanation: true,
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
        participants: {
          orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
          select: { id: true, displayName: true, score: true, correctCount: true },
        },
      },
    }),
    getCurrentSession(),
  ]);

  const participant = session?.participants.find((item) => item.id === participantId);
  const currentQuestion = session?.quiz.questions[session.currentQuestionPosition]?.question;
  const winners =
    session?.participants.slice(0, 3).map((item) => ({
      name: item.displayName,
      initials: getInitials(item.displayName),
      score: item.score,
    })) ?? [];
  const answer = participantId && currentQuestion
    ? await getPrismaClient().liveAnswer.findFirst({
        where: { sessionId, participantId, questionId: currentQuestion?.id ?? '' },
        select: { optionId: true, isCorrect: true, earnedPoints: true },
      })
    : null;

  return (
    <SiteLayout user={authSession?.user ? { name: authSession.user.name } : null}>
      <section className="section">
        <div className="container live-play">
          {!session ? (
            <EmptyState title="الجلسة غير متاحة" description="تحقق من الرابط أو رمز الغرفة." />
          ) : !participant ? (
            <EmptyState
              title="لم يتم تأكيد انضمامك"
              description="ارجع للصفحة الرئيسية وأدخل اسمك ورمز الغرفة مرة أخرى."
            />
          ) : session.status === 'FINISHED' ? (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">غرفة {session.roomCode}</span>
                  <h1>النتيجة النهائية</h1>
                  <p>
                    انتهت مسابقة {session.quiz.title}، وهذه مراكز المتسابقين الثلاثة الأولى.
                  </p>
                </div>
                <Badge>انتهت</Badge>
              </div>

              <div className="card-grid two">
                <Card className="results-screen">
                  <h2>منصة الفائزين</h2>
                  {winners.length > 0 ? (
                    <WinnerPodium winners={winners} />
                  ) : (
                    <EmptyState title="لا توجد نتائج بعد" description="لم ينضم أي متسابق للجلسة." />
                  )}
                </Card>

                <div>
                  <ScoreDisplay score={participant.score} streak={participant.correctCount} />
                  <Card>
                    <h2>ترتيب المتسابقين</h2>
                    <div className="leaderboard-list">
                      {session.participants.map((item, index) => (
                        <div className="leaderboard-item" key={item.id}>
                          <span className="rank">{index + 1}</span>
                          <div className="player-name">
                            <strong>{item.displayName}</strong>
                            <span>{item.correctCount.toLocaleString('ar-SA')} إجابات صحيحة</span>
                          </div>
                          <strong className="score" dir="ltr">
                            {item.score.toLocaleString('ar-SA')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          ) : !currentQuestion ? (
            <EmptyState title="الجلسة غير متاحة" description="تحقق من الرابط أو رمز الغرفة." />
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">غرفة {session.roomCode}</span>
                  <h1>{session.quiz.title}</h1>
                  <p>
                    {participant.displayName} · {participant.score.toLocaleString('ar-SA')} نقطة
                  </p>
                </div>
                <Badge className="badge-live">مباشرة</Badge>
              </div>

              <div className="card-grid two">
                <Card className="question-card">
                  <div className="question-meta">
                    <Badge>السؤال {session.currentQuestionPosition + 1}</Badge>
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
                    <QuestionImage
                      src={currentQuestion.imageUrl}
                      className="question-media"
                      eager
                    />
                  )}
                  <div className="answers-list">
                    {currentQuestion.options.map((option, index) => {
                      const label = optionLabels[index] ?? String(index + 1);
                      const selected = answer?.optionId === option.id;
                      const state = answer
                        ? option.isCorrect
                          ? 'correct'
                          : selected
                            ? 'wrong'
                            : 'disabled'
                        : 'default';
                      return (
                        <form action={submitLiveAnswer} key={option.id}>
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="participantId" value={participant.id} />
                          <input type="hidden" name="questionId" value={currentQuestion.id} />
                          <input type="hidden" name="optionId" value={option.id} />
                          <button
                            type="submit"
                            className={`answer-option option-${label.toLowerCase()} is-${state}`}
                            disabled={Boolean(answer) || session.status === 'FINISHED'}
                          >
                            <span className="answer-letter">{label}</span>
                            <span className="answer-text">{option.text}</span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                  {answer && (
                    <p className={answer.isCorrect ? 'text-success' : 'text-danger'} role="status">
                      {answer.isCorrect
                        ? `إجابة صحيحة +${answer.earnedPoints.toLocaleString('ar-SA')}`
                        : 'إجابة غير صحيحة'}
                    </p>
                  )}
                  {answer && currentQuestion.explanation && (
                    <p className="question-explanation">{currentQuestion.explanation}</p>
                  )}
                  {getAnswerNotice(query.answer) && (
                    <p className="muted" role="status">
                      {getAnswerNotice(query.answer)}
                    </p>
                  )}
                </Card>

                <div>
                  <ScoreDisplay
                    score={participant.score}
                    earned={answer?.earnedPoints ?? 0}
                    streak={participant.correctCount}
                  />
                  <Card>
                    <h2>الترتيب الحالي</h2>
                    <div className="leaderboard-list">
                      {session.participants.map((item, index) => (
                        <div className="leaderboard-item" key={item.id}>
                          <span className="rank">{index + 1}</span>
                          <div className="player-name">
                            <strong>{item.displayName}</strong>
                            <span>{item.correctCount.toLocaleString('ar-SA')} إجابات صحيحة</span>
                          </div>
                          <strong className="score" dir="ltr">
                            {item.score.toLocaleString('ar-SA')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Button variant="outline" fullWidth disabled>
                    السؤال التالي يفتحه المضيف في المرحلة القادمة
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
