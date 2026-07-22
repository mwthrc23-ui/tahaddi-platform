import { DashboardLayout } from '@/components/layout';
import { QuizBuilder } from '@/components/quizzes/quiz-builder';
import { requireActiveUser } from '@/lib/auth/session';

export default async function NewQuizPage() {
  await requireActiveUser('/quizzes/new');

  return (
    <DashboardLayout title="منشئ المسابقة">
      <QuizBuilder />
    </DashboardLayout>
  );
}
