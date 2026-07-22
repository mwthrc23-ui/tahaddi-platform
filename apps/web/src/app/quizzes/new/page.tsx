import { DashboardLayout } from '@/components/layout';
import { QuizBuilder } from '@/components/quizzes/quiz-builder';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

export default async function NewQuizPage() {
  const user = await requireActiveUser('/quizzes/new');
  const questions = hasDatabaseUrl()
    ? await getPrismaClient().question.findMany({
        where: {
          ownerId: user.id,
          status: { in: ['PUBLISHED', 'DRAFT'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          prompt: true,
          category: true,
          timeLimit: true,
          basePoints: true,
        },
      })
    : [];

  const availableQuestions = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    category: question.category ?? '',
    duration: question.timeLimit,
    points: question.basePoints,
  }));

  return (
    <DashboardLayout title="منشئ المسابقة">
      <QuizBuilder availableQuestions={availableQuestions} />
    </DashboardLayout>
  );
}
