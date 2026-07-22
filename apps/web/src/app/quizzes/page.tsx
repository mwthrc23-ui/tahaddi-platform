import { SiteLayout } from '@/components/layout';
import { ButtonLink, EmptyState } from '@/components/ui';

export default function QuizzesPage() {
  return (
    <SiteLayout>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">استكشف وشارك</span>
              <h1>المسابقات العامة</h1>
              <p>تابع المسابقات المتاحة واختر الجولة التي تناسبك.</p>
            </div>
          </div>
          <EmptyState
            title="لا توجد مسابقات عامة بعد"
            description="ستظهر المسابقات المنشورة هنا عند إطلاق أول جولة عامة."
          />
          <div className="dashboard-actions">
            <ButtonLink href="/quizzes/new">أنشئ مسابقة</ButtonLink>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
