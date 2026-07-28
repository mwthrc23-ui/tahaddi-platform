import { Button } from '@/components/ui';
import styles from '@/components/admin/admin.module.css';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requirePermission } from '@/lib/auth/session';
import { updateContentStatus } from './actions';

const messages: Readonly<Record<string, string>> = {
  UPDATED: 'تم تحديث حالة المحتوى وتسجيل الإجراء.',
  CONTENT_INCOMPLETE: 'لا يمكن النشر قبل اكتمال الأسئلة والإجابات المطلوبة.',
  INVALID_REQUEST: 'تعذّر العثور على المحتوى المطلوب.',
  REQUEST_FAILED: 'تعذّر تنفيذ التغيير الآن.',
  SESSION_REVOKED: 'تغيّرت صلاحية جلستك. سجّل الدخول من جديد.',
};

function valueOf(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission('MANAGE_CONTENT', '/admin/content');
  const result = valueOf((await searchParams).result);
  const prisma = getPrismaClient();
  const [questions, quizzes] = await Promise.all([
    prisma.question.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        prompt: true,
        status: true,
        category: true,
        updatedAt: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.quiz.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        updatedAt: true,
        owner: { select: { name: true, email: true } },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>إدارة المحتوى</h2>
          <p>آخر الأسئلة والمسابقات على مستوى المنصة.</p>
        </div>
      </div>
      {result && messages[result] && (
        <p className={styles.notice} role="status">
          {messages[result]}
        </p>
      )}
      <section className={styles.panel}>
        <h3>المسابقات</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>المسابقة</th>
              <th>المالك</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.id}>
                <td data-label="المسابقة">
                  <span className={styles.identity}>
                    <strong>{quiz.title}</strong>
                    <small>{quiz._count.questions.toLocaleString('ar-SA')} سؤال</small>
                  </span>
                </td>
                <td data-label="المالك">{quiz.owner.name || quiz.owner.email || '—'}</td>
                <td data-label="الحالة">{quiz.status}</td>
                <td data-label="الإجراء">
                  <form action={updateContentStatus}>
                    <input type="hidden" name="resourceType" value="Quiz" />
                    <input type="hidden" name="resourceId" value={quiz.id} />
                    <input
                      type="hidden"
                      name="nextStatus"
                      value={quiz.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      {quiz.status === 'ACTIVE' ? 'أرشفة' : 'نشر'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={styles.panel}>
        <h3>الأسئلة</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>السؤال</th>
              <th>المالك</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td data-label="السؤال">
                  <span className={styles.identity}>
                    <strong>{question.prompt}</strong>
                    <small>{question.category || 'بلا تصنيف'}</small>
                  </span>
                </td>
                <td data-label="المالك">{question.owner.name || question.owner.email || '—'}</td>
                <td data-label="الحالة">{question.status}</td>
                <td data-label="الإجراء">
                  <form action={updateContentStatus}>
                    <input type="hidden" name="resourceType" value="Question" />
                    <input type="hidden" name="resourceId" value={question.id} />
                    <input
                      type="hidden"
                      name="nextStatus"
                      value={question.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      {question.status === 'PUBLISHED' ? 'أرشفة' : 'نشر'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
