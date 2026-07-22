import { getPublicQuizzes, type PublicQuiz } from './actions';
import { SiteLayout } from '@/components/layout';
import { ButtonLink, CompetitionCard, EmptyState } from '@/components/ui';
import { getCurrentSession } from '@/lib/auth/session';

export default async function QuizzesPage() {
  const [result, session] = await Promise.all([getPublicQuizzes(24), getCurrentSession()]);

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">استكشف وشارك</span>
              <h1>المسابقات العامة</h1>
              <p>تابع المسابقات المتاحة واختر الجولة التي تناسبك.</p>
            </div>
          </div>
          {result.quizzes.length > 0 ? (
            <div className="card-grid three">
              {result.quizzes.map((quiz: PublicQuiz) => (
                <CompetitionCard
                  key={quiz.id}
                  title={quiz.title}
                  description={quiz.description || 'مسابقة عامة نشطة وجاهزة للانضمام.'}
                  meta={`${quiz.questionCount.toLocaleString('ar-SA')} سؤال · ${quiz.ownerName || 'مضيف تحدّي'}`}
                  href={`/demo/waiting?quizId=${encodeURIComponent(quiz.id)}&code=${encodeURIComponent(quiz.roomCode)}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                result.status === 'error'
                  ? 'تعذّر تحميل المسابقات العامة'
                  : 'لا توجد مسابقات عامة نشطة الآن'
              }
              description={
                result.status === 'error'
                  ? result.message
                  : 'ستظهر المسابقات المنشورة هنا عند إطلاق أول جولة عامة.'
              }
            />
          )}
          <div className="dashboard-actions">
            <ButtonLink href="/quizzes/new">أنشئ مسابقة</ButtonLink>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
