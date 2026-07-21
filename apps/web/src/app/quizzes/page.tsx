import { DashboardLayout } from '@/components/layout';
import { QuizBuilder } from '@/components/quizzes/quiz-builder';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

export default async function QuizzesPage() {
  const user = await requireActiveUser('/quizzes');
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

  const availableQuestions = questions.map((question: {
    id: string;
    prompt: string;
    category: string | null;
    timeLimit: number;
    basePoints: number;
  }) => ({
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
