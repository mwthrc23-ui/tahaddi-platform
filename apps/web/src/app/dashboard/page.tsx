import { Plus, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { ButtonLink, Card, EmptyState, StatisticCard } from '@/components/ui';
import { requireActiveUser } from '@/lib/auth/session';

export default async function Page() {
  await requireActiveUser('/dashboard');
  return (
    <DashboardLayout>
      <div className="dashboard-actions">
        <ButtonLink href="/quizzes/new">
          <Plus />
          مسابقة جديدة
        </ButtonLink>
      </div>
      <div className="card-grid four">
        <StatisticCard title="المسابقات" meta="٠" description="لا توجد بعد" />
        <StatisticCard title="اللاعبون" meta="٠" description="هذا الشهر" />
        <StatisticCard title="متوسط الدقة" meta="—" description="لا توجد بيانات" />
        <StatisticCard title="الأسئلة" meta="٠" description="في بنك الأسئلة" />
      </div>
      <Card>
        <h2>
          <Trophy />
          آخر المسابقات
        </h2>
        <EmptyState title="لا توجد مسابقات بعد" description="أنشئ أول مسابقة للبدء." />
      </Card>
    </DashboardLayout>
  );
}
