import { Plus, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Badge, ButtonLink, Card, EmptyState, StatisticCard } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

export default async function Page() {
  const user = await requireActiveUser('/dashboard');
  const prisma = getPrismaClient();
  const [
    quizCount,
    questionCount,
    participantCount,
    answerCount,
    correctAnswerCount,
    recentQuizzes,
  ] = await Promise.all([
    prisma.quiz.count({ where: { ownerId: user.id } }),
    prisma.question.count({ where: { ownerId: user.id } }),
    prisma.liveParticipant.count({ where: { session: { hostId: user.id } } }),
    prisma.liveAnswer.count({ where: { session: { hostId: user.id } } }),
    prisma.liveAnswer.count({ where: { session: { hostId: user.id }, isCorrect: true } }),
    prisma.quiz.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        roomCode: true,
        updatedAt: true,
        _count: { select: { questions: true, liveSessions: true } },
      },
    }),
  ]);
  const accuracy =
    answerCount > 0
      ? `${Math.round((correctAnswerCount / answerCount) * 100).toLocaleString('ar-SA')}٪`
      : '—';

  return (
    <DashboardLayout>
      <div className="dashboard-actions">
        <ButtonLink href="/quizzes/new">
          <Plus />
          مسابقة جديدة
        </ButtonLink>
      </div>
      <div className="card-grid four">
        <StatisticCard
          title="المسابقات"
          meta={quizCount.toLocaleString('ar-SA')}
          description="في حسابك"
        />
        <StatisticCard
          title="اللاعبون"
          meta={participantCount.toLocaleString('ar-SA')}
          description="إجمالي المنضمين إلى جلساتك"
        />
        <StatisticCard
          title="دقة الإجابات"
          meta={accuracy}
          description={answerCount > 0 ? 'من الإجابات المسجلة' : 'لا توجد إجابات مسجلة'}
        />
        <StatisticCard
          title="الأسئلة"
          meta={questionCount.toLocaleString('ar-SA')}
          description="في بنك أسئلتك"
        />
      </div>
      <Card>
        <h2>
          <Trophy />
          آخر المسابقات
        </h2>
        {recentQuizzes.length > 0 ? (
          <div className="dashboard-quiz-list">
            {recentQuizzes.map((quiz) => (
              <article key={quiz.id} className="dashboard-quiz-row">
                <div>
                  <div className="component-row">
                    <Badge>
                      {quiz.status === 'ACTIVE'
                        ? 'منشورة'
                        : quiz.status === 'ARCHIVED'
                          ? 'مؤرشفة'
                          : 'مسودة'}
                    </Badge>
                    <span dir="ltr">{quiz.roomCode}</span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <p className="muted">
                    {quiz._count.questions.toLocaleString('ar-SA')} سؤال ·{' '}
                    {quiz._count.liveSessions.toLocaleString('ar-SA')} جلسة · آخر تحديث{' '}
                    {quiz.updatedAt.toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <ButtonLink href="/host" variant="outline">
                  فتح لوحة المضيف
                </ButtonLink>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد مسابقات بعد" description="أنشئ أول مسابقة للبدء." />
        )}
      </Card>
    </DashboardLayout>
  );
}
