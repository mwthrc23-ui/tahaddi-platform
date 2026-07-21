import { DashboardLayout } from '@/components/layout';
import { QuizBuilder } from '@/components/quizzes/quiz-builder';

export default function QuizzesPage() {
  return (
    <DashboardLayout title="منشئ المسابقة">
      <QuizBuilder />
    </DashboardLayout>
  );
}
