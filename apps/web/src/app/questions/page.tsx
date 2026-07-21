import { BookOpen, Clock3, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Badge, Button, Card } from '@/components/ui';
import { QuestionEditor } from '@/components/questions/question-editor';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

const difficultyLabel = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' } as const;

export default async function QuestionsPage() {
  const user = await requireActiveUser('/questions');
  const questions = hasDatabaseUrl()
    ? await getPrismaClient().question.findMany({
        where: { ownerId: user.id, status: { not: 'ARCHIVED' } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { options: { orderBy: { position: 'asc' }, select: { id: true } } },
      })
    : [];

  return (
    <DashboardLayout title="بنك الأسئلة">
      <div className="dashboard-actions">
        <Button>
          <Plus />
          سؤال جديد
        </Button>
      </div>
      <div className="card-grid two">
        <Card>
          <h2>
            <BookOpen />
            إضافة سؤال
          </h2>
          <QuestionEditor />
        </Card>
        <Card>
          <h2>
            <Clock3 />
            مسوداتك
          </h2>
          {questions.length === 0 ? (
            <p>لم تضف أسئلة بعد. احفظ أول مسودة من النموذج.</p>
          ) : (
            <div className="stack-list">
              {questions.map((question) => (
                <article key={question.id} className="list-item">
                  <div>
                    <strong>{question.prompt}</strong>
                    <p>
                      {question.category || 'بلا فئة'} · {question.options.length} خيارات ·{' '}
                      {question.timeLimit} ثانية
                    </p>
                  </div>
                  <Badge>{difficultyLabel[question.difficulty]}</Badge>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
