import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import { QuestionEditForm } from '@/components/questions/question-edit-form';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser(`/questions/${id}`);

  if (!hasDatabaseUrl()) notFound();

  const question = await getPrismaClient().question.findFirst({
    where: { id, ownerId: user.id, status: { not: 'ARCHIVED' } },
    include: { options: { orderBy: { position: 'asc' } } },
  });

  if (!question) notFound();

  return (
    <DashboardLayout title="تعديل السؤال">
      <div className="dashboard-actions">
        <Link href="/questions">العودة إلى بنك الأسئلة</Link>
      </div>
      <Card>
        <h2>
          <Pencil />
          تعديل السؤال
        </h2>
        <QuestionEditForm
          question={{
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            imageUrl: question.imageUrl,
            difficulty: question.difficulty,
            category: question.category,
            explanation: question.explanation,
            source: question.source,
            timeLimit: question.timeLimit,
            basePoints: question.basePoints,
            options: question.options.map((option: { text: string; isCorrect: boolean }) => ({
              text: option.text,
              isCorrect: option.isCorrect,
            })),
          }}
        />
      </Card>
    </DashboardLayout>
  );
}
