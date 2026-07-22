import { HostLayout } from '@/components/layout';
import { EmptyState } from '@/components/ui';

export default function Page() {
  return (
    <HostLayout>
      <div className="host-stage">
        <section>
          <EmptyState
            title="لا توجد جلسة نشطة"
            description="أنشئ مسابقة وابدأ الجلسة لعرض واجهة المضيف."
          />
        </section>
      </div>
    </HostLayout>
  );
}
