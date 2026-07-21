import { BookOpen, Clock3, Plus } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Badge, Button, ButtonLink, Card, Input, Select } from '@/components/ui';
import { ArchiveQuestionButton } from '@/components/questions/archive-question-button';
import { QuestionEditor } from '@/components/questions/question-editor';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';

const difficultyLabel = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' } as const;
type DifficultyKey = keyof typeof difficultyLabel;
const statuses = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const types = ['ALL', 'MULTIPLE_CHOICE', 'TRUE_FALSE'] as const;
const difficulties = ['ALL', 'EASY', 'MEDIUM', 'HARD'] as const;

export default async function DashboardQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; difficulty?: string }>;
}) {
  const user = await requireActiveUser('/dashboard/questions');
  const filters = await searchParams;
  const q = filters.q?.trim() || '';
  const status = statuses.includes(filters.status as (typeof statuses)[number])
    ? (filters.status as Exclude<(typeof statuses)[number], 'ALL'> | 'ALL')
    : 'ALL';
  const type = types.includes(filters.type as (typeof types)[number])
    ? (filters.type as Exclude<(typeof types)[number], 'ALL'> | 'ALL')
    : 'ALL';
  const difficulty = difficulties.includes(filters.difficulty as (typeof difficulties)[number])
    ? (filters.difficulty as Exclude<(typeof difficulties)[number], 'ALL'> | 'ALL')
    : 'ALL';
  const questions = hasDatabaseUrl()
    ? await getPrismaClient().question.findMany({
        where: {
          ownerId: user.id,
          ...(status === 'ALL' ? { status: { not: 'ARCHIVED' } } : { status }),
          ...(type === 'ALL' ? {} : { type }),
          ...(difficulty === 'ALL' ? {} : { difficulty }),
          ...(q
            ? {
                OR: [
                  { prompt: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: { options: { orderBy: { position: 'asc' }, select: { id: true } } },
      })
    : [];

  return (
    <DashboardLayout title="بنك الأسئلة">
      <div className="dashboard-actions">
        <ButtonLink href="#question-editor">
          <Plus />
          سؤال جديد
        </ButtonLink>
      </div>
      <Card>
        <form className="form-grid" action="/dashboard/questions">
          <Input label="ابحث في السؤال أو الفئة" name="q" defaultValue={q} />
          <Select label="الحالة" name="status" defaultValue={status}>
            <option value="ALL">كل المسودات والمنشور</option>
            <option value="DRAFT">مسودة</option>
            <option value="PUBLISHED">منشور</option>
            <option value="ARCHIVED">مؤرشف</option>
          </Select>
          <Select label="النوع" name="type" defaultValue={type}>
            <option value="ALL">كل الأنواع</option>
            <option value="MULTIPLE_CHOICE">اختيار متعدد</option>
            <option value="TRUE_FALSE">صح أو خطأ</option>
          </Select>
          <Select label="الصعوبة" name="difficulty" defaultValue={difficulty}>
            <option value="ALL">كل المستويات</option>
            <option value="EASY">سهل</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HARD">صعب</option>
          </Select>
          <Button type="submit" variant="outline">
            تطبيق التصفية
          </Button>
        </form>
      </Card>
      <div className="card-grid two">
        <Card id="question-editor">
          <h2>
            <BookOpen />
            إضافة سؤال
          </h2>
          <QuestionEditor />
        </Card>
        <Card>
          <h2>
            <Clock3 />
            أسئلتك
          </h2>
          {questions.length === 0 ? (
            <p>لا توجد أسئلة مطابقة. احفظ مسودة جديدة أو غيّر عوامل التصفية.</p>
          ) : (
            <div className="stack-list">
              {questions.map(
                (question: {
                  id: string;
                  prompt: string;
                  category: string | null;
                  status: string;
                  difficulty: DifficultyKey;
                  timeLimit: number;
                  options: { id: string }[];
                }) => (
                  <article key={question.id} className="list-item">
                    <div>
                      <strong>{question.prompt}</strong>
                      <p>
                        {question.category || 'بلا فئة'} · {question.options.length} خيارات ·{' '}
                        {question.timeLimit} ثانية
                      </p>
                    </div>
                    <div className="inline-between">
                      <Badge>{difficultyLabel[question.difficulty]}</Badge>
                      {question.status !== 'ARCHIVED' && (
                        <div className="inline-between">
                          <Link href={`/questions/${question.id}`}>تعديل</Link>
                          <ArchiveQuestionButton questionId={question.id} />
                        </div>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
